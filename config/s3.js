const { S3Client } = require("@aws-sdk/client-s3");
require("dotenv").config();

// AWS S3 Configuration (SDK v3)
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
const awsBucketName = process.env.AWS_BUCKET_NAME;

module.exports = { s3, awsBucketName };