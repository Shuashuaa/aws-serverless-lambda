const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3Client = new S3Client({ 
    region: process.env.AWS_REGION || 'ap-southeast-2' // Use the region if available, else default to 'ap-southeast-2'
  });

// Environment variable for the S3 bucket name
const BUCKET_NAME = process.env.BUCKET_NAME; // Set this in your Lambda environment variables

exports.signUrl = async (event) => {
  try {
    console.log("Incoming event:", event);

    // Get the file name (or key) from the query parameters
    const { fileName, fileType } = event.queryStringParameters || {};

    if (!fileName || !fileType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required query parameters 'fileName' or 'fileType'" }),
      };
    }

    // Set S3 upload parameters
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: fileName, // The file name in the S3 bucket
      ContentType: fileType, // The content type (e.g., image/png)
      ACL: 'public-read', // Optional: Set access control to public-read (change as needed)
    };

    // Generate a signed URL for uploading the file
    const command = new PutObjectCommand(uploadParams);
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL valid for 1 hour

    // Return the signed URL
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Signed URL generated successfully", signedUrl }),
    };
  } catch (error) {
    console.error("Error generating signed URL:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error generating signed URL", error: error.message }),
    };
  }
};
