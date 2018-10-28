# @jmshal/bugsnag-js-plugin-azure-functions

@bugsnag/js plugin for Azure Function apps.

## Installation

```
$ npm i --save @bugsnag/js @jmshal/bugsnag-js-plugin-azure-functions
```

## Basic usage

```js
const bugsnag = require('@bugsnag/js'); // or "@bugsnag/node"
const azureFunctionsPlugin = require('@jmshal/bugsnag-js-plugin-azure-functions');
const { validateJWT, doSomethingBuggy } = require('./my-function-utilities');

const bugsnagClient = bugsnag('API-KEY');
bugsnagClient.use(azureFunctionsPlugin);

const { wrapFunction } = bugsnagClient.getPlugin('azure-functions');

module.exports = wrapFunction(async (context, req) => {
  // The validateJWT function can also leave breadcrumbs because it has access to
  // the underlying Bugsnag client (eg. context.bugsnag.leaveBreadcrumb).
  const claims = await validateJWT(context);

  context.bugsnag.user = {
    id: claims.sub,
    email: claims.email,
  };

  await doSomethingBuggy(); // Throws and automatically gets reported
});
```

## License

MIT ❤️
