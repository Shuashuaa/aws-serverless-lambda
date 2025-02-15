const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const dynamoDbClient = new DynamoDBClient({}); // Initialize DynamoDB client

exports.handler = async (event) => {
  try {
    // Log the incoming event for debugging
    console.log("Incoming event:", event);

    // Check if event.body is valid
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid input, missing body" }),
      };
    }

    const cleanBody = event.body.replace(/\r?\n|\r/g, '').trim();
    const requestBody = JSON.parse(cleanBody); // Parse cleaned body

    // Access sample_product_name using bracket notation
    // const productName = requestBody["sample_product_name"];
    // const productPrice = requestBody["sample_product_price"];

    // Ensure requestBody has the required fields
    if (!requestBody.sample_product_name || !requestBody.sample_product_price) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields" }),
      };
    }

    const item = {
        id: { N: Math.floor(Math.random() * 1000000).toString() }, // ID as a string (Numeric value as string)
        sample_product_name: { S: requestBody.sample_product_name }, // Product name as a string
        sample_product_price: { N: requestBody.sample_product_price.toString() }, // Price as a string (convert if necessary)
        created_at: { S: new Date().toISOString() }, // Timestamp as ISO string
    };

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
      Item: item,
    };

    console.log("PutItem params:", params);

    const command = new PutItemCommand(params); // Create PutItemCommand

    const data = await dynamoDbClient.send(command); // Send the command

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Item inserted successfully!", data: item }),
    };
  } catch (error) {
    console.error("Error inserting item:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error inserting item", error: error.message }),
    };
  }
};
