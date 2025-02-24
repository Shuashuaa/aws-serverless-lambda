const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const dynamoDbClient = new DynamoDBClient({});

exports.handler = async (event) => {
  try {
    console.log("Incoming event:", event);

    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS", // Add OPTIONS if needed
          "Access-Control-Allow-Headers": "Content-Type, X-Custom-Header", // Add any custom headers you need
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: "Invalid input, missing body" }),
      };
    }

    const cleanBody = event.body.replace(/\r?\n|\r/g, '').trim();
    const requestBody = JSON.parse(cleanBody);

    if (!requestBody.sample_product_name || !requestBody.sample_product_price) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-Custom-Header",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: "Missing required fields" }),
      };
    }

    const item = {
      id: { N: Math.floor(Math.random() * 1000000).toString() },
      sample_product_name: { S: requestBody.sample_product_name },
      sample_product_price: { N: requestBody.sample_product_price.toString() },
      created_at: { S: new Date().toISOString() },
    };

    const tableName = process.env.DYNAMODB_TABLE;
    if (!tableName) {
      return {
        statusCode: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-Custom-Header",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: "DYNAMODB_TABLE environment variable is not set" }),
      };
    }

    const params = {
      TableName: tableName,
      Item: item,
    };

    console.log("PutItem params:", params);

    const command = new PutItemCommand(params);
    const data = await dynamoDbClient.send(command);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Custom-Header",
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
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Custom-Header",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: "Error inserting item", error: error.message }),
    };
  }
};