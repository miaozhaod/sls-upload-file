const AWS = require("aws-sdk");
const parseMultipart = require("parse-multipart");

const BUCKET = process.env.BUCKET;
const s3 = new AWS.S3();

module.exports.uploadFile = async event => {
  try {
    const { filename, data } = extractFile(event);
    console.log("filenane1: ", filename);
    console.log("data1: ", data);
    await s3
      .putObject({
        Bucket: BUCKET,
        Key: filename,
        ACL: "public-read",
        Body: data,
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

function extractFile(event) {
  console.log("event.headers", event.headers["content-type"]);
  console.log("event.body", event.body);
  const boundary = parseMultipart.getBoundary(event.headers["content-type"]);
  console.log("boundary", boundary);
  const parts = parseMultipart.Parse(
    Buffer.from(event.body, "base64"),
    boundary
  );
  console.log("parts", parts);
  const [{ filename, data }] = parts;
  console.log("filenane: ", filename);
  console.log("data: ", data);

  return {
    filename,
    data,
  };
}
