const { URL } = require('url');
const createReportFromErr = require('@bugsnag/core/lib/report-from-error');
const clone = require('@bugsnag/core/lib/clone-client');

const handledState = {
  severity: 'error',
  unhandled: true,
  severityReason: {
    type: 'unhandledErrorMiddleware',
    attributes: { framework: 'Azure Functions' },
  },
};

const plugin = {
  name: 'azure-functions',
  init: client => {
    // A higher order function which takes in the Azure Function handler (entrypoint), and
    // returns a new handler which automatically injects a Bugsnag client into the context,
    // and automatically reports unhandled errors.
    const wrapFunction = func => async (ctx, ...args) => {
      // Get a client to be scoped to this request. If sessions are enabled, use the
      // startSession() call to get a session client, otherwise, clone the existing client.
      const requestClient = client.config.autoCaptureSessions ? client.startSession() : clone(client);

      ctx.bugsnag = requestClient;

      // extract request info and pass it to the relevant bugsnag properties
      const { request, metaData } = getRequestAndMetaDataFromCtx(ctx);
      requestClient.metaData = { ...requestClient.metaData, ...metaData };
      requestClient.request = request;

      try {
        await func(ctx, ...args);
      } catch (err) {
        ctx.bugsnag.notify(createReportFromErr(err, handledState));
        throw err;
      }
    };

    return { wrapFunction };
  },
};

const extractRequestInfo = ctx => {
  const request = ctx.req;
  const url = new URL(request.originalUrl);
  return {
    url,
    path: url.pathname,
    httpMethod: request.method,
    headers: request.headers,
    query: request.query,
    clientIp: (request.headers['client-ip'] || '').replace(/:\d+$/, '') || undefined,
  };
};

const getRequestAndMetaDataFromCtx = ctx => {
  const requestInfo = extractRequestInfo(ctx);
  return {
    metaData: {
      request: requestInfo,
      function: ctx.executionContext,
    },
    request: {
      clientIp: requestInfo.clientIp,
      headers: requestInfo.headers,
      url: requestInfo.url,
      referer: requestInfo.headers.referer,
    },
  };
};

module.exports = plugin;
