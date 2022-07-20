const AWS = require("aws-sdk");
const parseMultipart = require("parse-multipart");
const parser = require("lambda-multipart-parser");

const BUCKET = process.env.BUCKET;
const s3 = new AWS.S3();

module.exports.uploadFile = async event => {
  console.log("lambda uploadFile event string ... ", JSON.stringify(event));
  const result = await parser.parse(event);
  console.log("result ... ", result);
  const { filename, content } = result.files[0];

  try {
    await s3
      .putObject({
        Bucket: BUCKET,
        Key: filename,
        ACL: "public-read",
        Body: content,
      })
      .promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        link: `https://${BUCKET}.s3.amazonaws.com/${filename}`,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message }),
    };
  }
};

