const { DynamoDBClient, DeleteItemCommand } = require("@aws-sdk/client-dynamodb");

const dynamoDbClient = new DynamoDBClient({}); // Initialize DynamoDB client

exports.delete = async (event) => {
  try {
    // Log the incoming event for debugging
    console.log("Incoming event:", event);
    

    // Check if event.queryStringParameters is provided for DELETE request
    const { id } = event.queryStringParameters || {};
    // const { id } = requestBody;

    // If no 'id' is provided, return an error
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required query parameter 'id'" }),
      };
    }

    // Ensure the DynamoDB table name is set
    const tableName = process.env.DYNAMODB_TABLE;
    if (!tableName) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "DYNAMODB_TABLE environment variable is not set" }),
      };
    }

    const params = {
      TableName: tableName,
      Key: {
        id: { N: id.toString() }, // Primary key 'id' should match the type of your DynamoDB table's key
      },
    };

    console.log("DeleteItem params:", params);

    const command = new DeleteItemCommand(params); // Create DeleteItemCommand

    const data = await dynamoDbClient.send(command); // Send the command to DynamoDB

    // Return success message
    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Item with id ${id} deleted successfully`, data }),
    };
  } catch (error) {
    console.error("Error deleting item:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error deleting item", error: error.message }),
    };
  }
};