const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");

const dynamoDbClient = new DynamoDBClient({}); // Initialize DynamoDB client

exports.getAll = async (event) => {
  try {
    // Log the incoming event for debugging
    console.log("Incoming event:", event);

    // Ensure the DynamoDB table name is set
    const tableName = process.env.DYNAMODB_TABLE;
    if (!tableName) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "DYNAMODB_TABLE environment variable is not set" }),
      };
    }

    const params = {
      TableName: tableName, // Table name from environment variable
    };

    console.log("Scan params:", params);

    const command = new ScanCommand(params); // Create ScanCommand to retrieve all items

    const data = await dynamoDbClient.send(command); // Send the command to DynamoDB

    // If no items are returned, send an empty array
    const items = data.Items || [];

    // Format the items as an array of objects
    const formattedItems = items.map((item) => ({
      id: item.id.N,
      sample_product_name: item.sample_product_name.S,
      sample_product_price: item.sample_product_price.N,
      created_at: item.created_at.S,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Items retrieved successfully", data: formattedItems }),
    };
  } catch (error) {
    console.error("Error retrieving items:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error retrieving items", error: error.message }),
    };
  }
};