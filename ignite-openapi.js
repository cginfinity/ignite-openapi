const Swagger = require('swagger-client')

function sendError (node, config, msg, e) {
  // node.error can't save the data we
  if (e.message && isNaN(e.message.substring(0, 1)) && e.status) e.message = e.status + ' ' + e.message
  msg.response = e.response
  if (config.errorHandling === 'other output') {
    node.send([null, msg])
  } else if (config.errorHandling === 'throw exception') {
    node.error(e.message, msg)
  } else {
    node.send(msg)
  }
}

module.exports = function (RED) {
  function openApiRed (config) {
    RED.nodes.createNode(this, config)
    const node = this

    node.on('input', function (msg) {
      let openApiUrl = config.openApiUrl
      if (msg.openApi && msg.openApi.url) openApiUrl = msg.openApi.url
      let parameters = {}
      let options = {}

      if (msg.openApi && msg.openApi.parameters) {
        parameters = msg.openApi.parameters
      } else {
        for (const p in config.parameters) {
          const param = config.parameters[p]
          let evaluatedInput = RED.util.evaluateNodeProperty(param.value, param.inputType, this, msg)
          // query input can't be object. Therefore stringify!
          if (typeof evaluatedInput === 'object' && param.in === 'query') {
            evaluatedInput = JSON.stringify(evaluatedInput)
          }
          // can't use 'if (evaluatedInput)' due to values false and 0
          if (param.required && (evaluatedInput === '' || evaluatedInput === null || evaluatedInput === undefined)) {
            return node.error(`Required input for ${param.name} is missing.`, msg)
          }
          if (param.isActive && param.name !== 'Request Body') {
            parameters[param.name] = evaluatedInput
          }
          if (param.isActive && param.name === 'Request Body') {
            options = {
              requestBody: {
                evaluatedInput
              }
            }
          }
        }
      }
      // preferred use operationId. If not available use pathname + method
      let operationId, pathName, method
      if (config.operationData.withoutOriginalOpId) {
        pathName = config.operationData.pathName
        method = config.operationData.method
      } else {
        operationId = config.operation
      }
      // fallback if no content type can be found
      let requestContentType = 'application/json'
      if (config.requestBody) {
        requestContentType = config.requestBody
      }

      // Start Swagger / OpenApi
      Swagger(openApiUrl).then((client) => {
        client.execute({
          operationId,
          pathName,
          method,
          parameters,
          requestContentType,
          // if available put token for auth
          requestInterceptor: (req) => {
            if (msg.openApiToken) req.headers.Authorization = 'Bearer ' + msg.openApiToken
          }
        }, {
          // options object (request body for openAPI 3)
          options
        })
          .then((res) => {
            msg.payload = res
            node.send(msg)
          }).catch((e) => {
            sendError(node, config, msg, e)
          })
      }).catch(e => {
        sendError(node, config, msg, e)
      })
    })
  }
  RED.nodes.registerType('OpenApi', openApiRed)

  // create API List
  RED.httpAdmin.get('/getNewOpenApiInfo', (request, response) => {
    const openApiUrl = request.query.openApiUrl
    if (!openApiUrl) {
      response.send("Missing or invalid openApiUrl parameter 'openApiUrl': " + openApiUrl)
      return
    }
    const decodedUrl = decodeURIComponent(openApiUrl)
    const newApiList = {}
    Swagger(decodedUrl).then((client) => {
      const paths = client.spec.paths
      Object.keys(paths).forEach((pathKey) => {
        const path = paths[pathKey]
        Object.keys(path).forEach((operationKey) => {
          const operation = path[operationKey]
          let opId = operation.operationId
          // fallback if no operation id exists
          if (!opId) {
            opId = operationKey + pathKey
            operation.operationId = opId
            operation.withoutOriginalOpId = true
            operation.pathName = pathKey
            operation.method = operationKey
          }

          // default if no array tag exists
          if (operation.tags.constructor !== Array || operation.tags.length === 0) operation.tags = ['default']
          for (const tag of operation.tags) {
            if (!newApiList[tag]) newApiList[tag] = {}
            operation.path = pathKey
            newApiList[tag][opId] = operation
          }
        })
      })
      response.send(newApiList)
    }).catch((e) => {
      if (e.message) response.send(e.message.toString())
      else response.send('Error: ' + e)
    })
  })
}
