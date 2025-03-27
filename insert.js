const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

// Initialize DynamoDB Client
const dynamoDbClient = new DynamoDBClient({});

// Initialize Secrets Manager Client
const client = new SecretsManagerClient({});

// Secret name for retrieving the secret
const secretName = "SECRET_KEY";

// Function to get the secret value from Secrets Manager
async function getSecretValue() {
  try {
    const data = await client.send(new GetSecretValueCommand({
      SecretId: secretName
    }));
    
    let secret;
    if (data.SecretString) {
      secret = JSON.parse(data.SecretString);
    } else {
      const buff = Buffer.from(data.SecretBinary, 'base64');
      secret = JSON.parse(buff.toString('ascii'));
    }

    return secret;
  } catch (error) {
    console.error("Error retrieving secret:", error);
    throw error;
  }
}

// Lambda handler
exports.handler = async (event) => {
  try {
    console.log("Incoming event:", event);

    // Check if the body exists
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: "Invalid input, missing body" }),
      };
    }

    const cleanBody = event.body.replace(/\r?\n|\r/g, '').trim();
    const requestBody = JSON.parse(cleanBody);

    console.log(requestBody, 'requestBody')

    // Validate the request body
    if (!requestBody.userId) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: "Client is Not Authenticated" }),
      };
    }

    // Validate the request body
    if (!requestBody.sample_product_name || !requestBody.sample_product_price) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: "Missing required fields" }),
      };
    }

    // Get the secret from Secrets Manager
    const secret = await getSecretValue();
    if (!secret || !secret.SECRET_KEY) {
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: "Failed to retrieve the secret key" }),
      };
    }

    // Check for API key in the headers
    const apiKey = event.headers['x-api-key'];
    if (!apiKey || apiKey !== secret.SECRET_KEY) {
      return {
        statusCode: 403,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: "Forbidden: Invalid or missing API key" }),
      };
    }

    // Prepare the item for DynamoDB
    const item = {
      id: { N: Math.floor(Math.random() * 1000000).toString() },
      userId: { S: requestBody.userId  },
      sample_product_name: { S: requestBody.sample_product_name },
      sample_product_price: { N: requestBody.sample_product_price.toString() },
      product_image: { S: requestBody.product_image },
      created_at: { S: new Date().toISOString() },
    };

    // DynamoDB table name
    const tableName = process.env.DYNAMODB_TABLE;
    if (!tableName) {
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: "DYNAMODB_TABLE environment variable is not set" }),
      };
    }

    // PutItemParams for inserting into DynamoDB
    const params = {
      TableName: tableName,
      Item: item,
    };

    // Perform the PutItem command
    const command = new PutItemCommand(params);
    await dynamoDbClient.send(command);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: "Item inserted successfully!", data: item }),
    };
  } catch (error) {
    console.error("Error inserting item:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: "Error inserting item", error: error.message }),
    };
  }
};