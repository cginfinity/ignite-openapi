# ignite-openapi

This node allows to work with APIs defined by OpenAPI 3 (Swagger). You can set parameters within the Node-RED-UI and trigger the flow from within your flow.

It is based on [swagger-js](https://github.com/swagger-api/swagger-js).

## Usage

### 1. Get the API-operations list
Enter the URL to your OpenAPI configuration (json or yaml file) and push the read-button. That's it. You can now select the operation you want to run.

![Operations](https://gitlab.com/2WeltenChris/ignite-openapi/raw/master/examples/operations.png?raw=true "Operations")

## 2. Understanding the API

Hovering on an operations title or a key, you see the respective comments within the mouseover. This allows you to understand what a parameter is meant for. Required parameters are marked with an asterisk.

![operation description](https://gitlab.com/2WeltenChris/ignite-openapi/raw/master/examples/operation_description.png?raw=true "Operation description")


![parameter description](https://gitlab.com/2WeltenChris/ignite-openapi/raw/master/examples/parameter_description.png?raw=true "Parameter description")

For JSON-parameters you can further show the structure by clicking on show keys. Again, the comments can be found within the mouseover.

![json description](https://gitlab.com/2WeltenChris/ignite-openapi/raw/master/examples/json_description.png?raw=true "Json description")

## 3. Parameter configuration

Each parameter has an input-field corresponding to its type. You can further define that a parameter shall be read from the incoming message object or define a jsonata expression.

JSON parameters may define a sample structure. You can set this as the value by clicking the corresponding button - either with only the required keys (set required) or with all keys (set default).

## 4. Authentification

If the API requires an authentification token you can log in using the standard `http-request` node of Node-RED. The JWT token you get as a response must then be put into `msg.openApiToken` to be automatically placed in the request-header as bearer authentification.

## 5. Error handling

You can choose how to handle a returning server error. The last server response object will be placed in msg.response instead of msg.error. This ensures that all 3 ways react the same.

* `Standard`: The flow moves on normally. You have to handle an server error in your flow.
* `Separate output`: Your flow will take a different way.
* `Throw an exception`: Throws an node.error which can be catched by the standard 'catch' node (usefull for many nodes with the same error handling).

You find that example also in the sample flow (see below).

![Error handling](https://gitlab.com/2WeltenChris/ignite-openapi/raw/master/examples/error_handling.png?raw=true "Error handling")

## Sample flow

You can find a sample flow in the node red imports where you can see some examples on how to configure the node.

![Example](https://gitlab.com/2WeltenChris/ignite-openapi/raw/master/examples/examples.png?raw=true "Example Node")
