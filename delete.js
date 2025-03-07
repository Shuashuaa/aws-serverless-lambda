const { DynamoDBClient, DeleteItemCommand } = require("@aws-sdk/client-dynamodb");
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

exports.delete = async (event) => {
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
        headers: {
          "Access-Control-Allow-Origin": "*", // Allow any origin for CORS
          "Content-Type": "application/json" // Content type is JSON
        }
      };
    }

    const tableName = process.env.DYNAMODB_TABLE;
    if (!tableName) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "DYNAMODB_TABLE environment variable is not set" }),
        headers: {
          "Access-Control-Allow-Origin": "*", // Allow any origin for CORS
          "Content-Type": "application/json" // Content type is JSON
        }
      };
    }

    const params = {
      TableName: tableName,
      Key: {
        id: { N: id.toString() }, 
      },
    };

    const command = new DeleteItemCommand(params);

    const data = await dynamoDbClient.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Item with id ${id} deleted successfully`, data }),
      headers: {
        "Access-Control-Allow-Origin": "*", // Allow any origin for CORS
        "Content-Type": "application/json" // Content type is JSON
      }
    };
  } catch (error) {
    console.error("Error deleting item:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error deleting item", error: error.message }),
      headers: {
        "Access-Control-Allow-Origin": "*", // Allow any origin for CORS
        "Content-Type": "application/json" // Content type is JSON
      }
    };
  }
};
