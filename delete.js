const { DynamoDBClient, DeleteItemCommand } = require("@aws-sdk/client-dynamodb");

const dynamoDbClient = new DynamoDBClient({}); // Initialize DynamoDB client

exports.delete = async (event) => {
  try {
    console.log("Incoming event:", event);

    const { id } = event.pathParameters || {}; // Extract 'id' from the dynamic URL parameter

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required path parameter 'id'" }),
      };
    }

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
        id: { N: id.toString() }, 
      },
    };

    const command = new DeleteItemCommand(params);

    const data = await dynamoDbClient.send(command);

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
