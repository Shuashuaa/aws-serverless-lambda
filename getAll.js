const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");

const dynamoDbClient = new DynamoDBClient({}); // Initialize DynamoDB client

exports.getAllRecords = async (event) => {
  try {
    console.log("Incoming event:", event);

    // Ensure the DynamoDB table name is set
    const tableName = process.env.DYNAMODB_TABLE;
    if (!tableName) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "DYNAMODB_TABLE environment variable is not set" }),
        headers: {
          "Access-Control-Allow-Origin": "*" // Allow any origin for CORS
        }
      };
    }

    // Construct the Scan command to retrieve all items from the table
    const params = {
      TableName: tableName, // Table name from environment variable
    };

    console.log("Scan params:", params);

    const command = new ScanCommand(params); // Create ScanCommand to retrieve all items

    const data = await dynamoDbClient.send(command); // Send the command to DynamoDB

    // If no items are returned, send an empty array
    const items = data.Items || [];

    // Log the raw items for debugging
    console.log("Raw items from DynamoDB:", items);

    // Format the items as an array of objects with error handling
    const formattedItems = items.map((item) => {
      return {
        id: item.id ? item.id.N : "Unknown", // Check if 'id' exists
        sample_product_name: item.sample_product_name ? item.sample_product_name.S : "Unknown", // Check if 'sample_product_name' exists
        sample_product_price: item.sample_product_price ? item.sample_product_price.N : "Unknown", // Check if 'sample_product_price' exists
        created_at: item.created_at ? item.created_at.S : "Unknown", // Check if 'created_at' exists
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Items retrieved successfully", data: formattedItems }),
      headers: {
        "Access-Control-Allow-Origin": "*", // Allow any origin for CORS
        "Content-Type": "application/json" // Content type is JSON
      }
    };
  } catch (error) {
    console.error("Error retrieving items:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error retrieving items", error: error.message }),
      headers: {
        "Access-Control-Allow-Origin": "*", // Allow any origin for CORS
        "Content-Type": "application/json" // Content type is JSON
      }
    };
  }
};
