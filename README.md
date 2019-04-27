# serverless-iot-offline
[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)
[![npm](https://img.shields.io/npm/v/serverless-iot-offline.svg)](https://www.npmjs.com/package/serverless-iot-offline)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#contributing)

Serverless plugin that emulates AWS IoT service. Manages topic subscriptions, lifecycle events, thing shadow management and rule engine with limited SQL syntax support.

## Prerequisites

[Redis](https://redis.io/) installed.  
Serverless framework 1.x

## Installation
Add serverless-iot-offline to your project:  
`npm install --save-dev serverless-iot-offline`  
Then inside yur `serverless.yml` file add following entry to the plugins section: `serverless-iot-offline`. If there is no plugin section you will need to add it to the file.  
Example:
```yaml
plugins:
  - serverless-iot-offline
```

or if you are using `serverless-offline` plugin:
```yaml
plugins:
  - serverless-iot-offline
  - serverless-offline
```

## Usage and command line options

Make sure `redis-server` is started.  
If you are using `serverless-offline` you can run:  
`sls offline start`  
Otherwise run:  
`sls iot start`

CLI options:  
```bash
--port                -p  # Port to listen on. Default: 1883
--httpPort            -h  # Port for WebSocket connections. Default: 1884
--noStart             -n  # Prevent Iot broker (Mosca MQTT brorker) from being started (if you already have one)
--skipCacheValidation -c  # Tells the plugin to skip require cache invalidation. A script reloading tool like Nodemon might then be needed (same as serverless-offline)
```

Above options could be added through `serverless.yml` file:
```yaml
custom:
  iot:
    start:
      port: 1880
    redis:
      host: 'localhost'
      port: 6379
      db: 12
    # path to initial shadows
    # it is used to seed redis database with preconfigured shadows
    seedShadows: ./shadows.json
    # optional seedPolicies path
    seedPolicies: ./policy.json
```
Example of `shadows.json` file which will seed redis with 2 shadows:
```json
{
  "thingName1": {
    "state": {
      "reported": {
        "some_prop": "hello"
      }
    }
  },
  "thingName2": {
    "state": {
      "reported": {}
    }
  }
}
```

## Contributing

Local implementation of AWS IoT service has a minimum of SQL syntax support and primarily we need help with that.  
To get a better understanding of what SQL syntax we are supporting see [documentation](./iotSql/README.md) and [testData.js](./testData.js) file.  
Checkout [contributing guidelines](./CONTRIBUTING.md).

## Credits and inspiration
This plugin was inspired by [Tradle](https://github.com/tradle)'s [serverless-iot-local](https://github.com/tradle/serverless-iot-local) project

## Licence

MIT
