const { DynamoDBClient, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");

const dynamoDbClient = new DynamoDBClient({}); // Initialize DynamoDB client

exports.update = async (event) => {
  try {
    console.log("Incoming event:", event);

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
