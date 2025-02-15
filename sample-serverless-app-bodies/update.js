const { DynamoDBClient, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");

const dynamoDbClient = new DynamoDBClient({}); // Initialize DynamoDB client

exports.update = async (event) => {
  try {
    // Log the incoming event for debugging
    console.log("Incoming event:", event);

    // Check if event.body is provided
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid input, missing body" }),
      };
    }

    const cleanBody = event.body.replace(/\r?\n|\r/g, '').trim();
    const requestBody = JSON.parse(cleanBody); // Parse cleaned body

    // Ensure requestBody has the required fields (e.g., id, sample_product_name, and sample_product_price)
    if (!requestBody.id || !requestBody.sample_product_name || !requestBody.sample_product_price) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields (id, sample_product_name, or sample_product_price)" }),
      };
    }

    const tableName = process.env.DYNAMODB_TABLE;
    if (!tableName) {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "DYNAMODB_TABLE environment variable is not set" }),
      };
    }

    // Construct the update expression to modify the item
    const updateExpression = "SET sample_product_name = :sample_product_name, sample_product_price = :sample_product_price, updated_at = :updated_at";
    const expressionAttributeValues = {
      ":sample_product_name": { S: requestBody.sample_product_name },
      ":sample_product_price": { N: requestBody.sample_product_price.toString() }, // Convert to string for DynamoDB
      ":updated_at": { S: new Date().toISOString() }, // Set the current timestamp
    };

    const params = {
      TableName: tableName,
      Key: {
        id: { N: requestBody.id.toString() }, // Primary key 'id'
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW", // Return the updated item
    };

    console.log("UpdateItem params:", params);

    const command = new UpdateItemCommand(params); // Create UpdateItemCommand

    const data = await dynamoDbClient.send(command); // Send the command to DynamoDB

    // Return success with the updated item
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
