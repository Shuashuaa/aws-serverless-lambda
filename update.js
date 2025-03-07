const { DynamoDBClient, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");
const { 
  SecretsManagerClient, 
  GetSecretValueCommand 
} = require("@aws-sdk/client-secrets-manager");

const dynamoDbClient = new DynamoDBClient({}); // Initialize DynamoDB client
const client = new SecretsManagerClient({}); // Initialize Secrets Manager Client

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

exports.update = async (event) => {
  try {
    console.log("Incoming event:", event);

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

    const { id } = event.pathParameters || {}; // Extract 'id' from the dynamic URL parameter

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required path parameter 'id'" }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid input, missing body" }),
      };
    }

    const cleanBody = event.body.replace(/\r?\n|\r/g, '').trim();
    const requestBody = JSON.parse(cleanBody);

    if (!requestBody.sample_product_name || !requestBody.sample_product_price) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields (sample_product_name or sample_product_price)" }),
      };
    }

    const tableName = process.env.DYNAMODB_TABLE;
    if (!tableName) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "DYNAMODB_TABLE environment variable is not set" }),
      };
    }

    const updateExpression = "SET sample_product_name = :sample_product_name, sample_product_price = :sample_product_price, updated_at = :updated_at";
    const expressionAttributeValues = {
      ":sample_product_name": { S: requestBody.sample_product_name },
      ":sample_product_price": { N: requestBody.sample_product_price.toString() },
      ":updated_at": { S: new Date().toISOString() },
    };

    const params = {
      TableName: tableName,
      Key: {
        id: { N: id.toString() }, 
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    };

    const command = new UpdateItemCommand(params);

    const data = await dynamoDbClient.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Item updated successfully", data: data.Attributes }),
    };
  } catch (error) {
    console.error("Error updating item:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error updating item", error: error.message }),
    };
  }
};
