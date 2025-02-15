const { DynamoDBClient, GetItemCommand } = require("@aws-sdk/client-dynamodb");

const dynamoDbClient = new DynamoDBClient({}); // Initialize DynamoDB client

exports.getAll = async (event) => {
  try {
    console.log("Incoming event:", event);

    const { id } = event.pathParameters || {}; // Extract 'id' from the dynamic path parameter

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required path parameter 'id'" }),
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

    // Construct the GetItem command to retrieve the item with the specified id
    const params = {
      TableName: tableName,
      Key: {
        id: { N: id.toString() }, // Use the id path parameter as the key
      },
    };

    console.log("GetItem params:", params);

    const command = new GetItemCommand(params); // Create GetItemCommand to retrieve the item

    const data = await dynamoDbClient.send(command); // Send the command to DynamoDB

    if (!data.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: `Item with id ${id} not found` }),
      };
    }

    // Format the retrieved item
    const formattedItem = {
      id: data.Item.id.N,
      sample_product_name: data.Item.sample_product_name.S,
      sample_product_price: data.Item.sample_product_price.N,
      created_at: data.Item.created_at.S,
    };

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Item retrieved successfully", data: formattedItem }),
    };
  } catch (error) {
    console.error("Error retrieving item:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error retrieving item", error: error.message }),
    };
  }
};