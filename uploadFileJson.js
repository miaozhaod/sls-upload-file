const AWS = require("aws-sdk");
const sharp = require('sharp');

const s3 = new AWS.S3();

module.exports.handler = async event => {
  console.log("event ...", event);
  const { body } = event;
  let requestBody = body;
  if (typeof body !== "object") {
    console.log("Request body is not valid, transforming....");
    try {
      requestBody = JSON.parse(body);
    } catch (e) {
      console.error("Failed when transforming request body.", e);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify(
          {
            message: `Function errored when transforming request body to object. [typeof requestBody: ${typeof body}]`,
            requestBody,
          },
          null,
          2
        ),
      };
    }
  }

  if (!requestBody.file || !requestBody.mime) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: `Invalid body request`,
        requestBody: body,
      }),
    };
  }

  try {
    const { file, user_id, mime } = requestBody;
    let buffer = Buffer.from(file, "base64");
    const fileName = `${user_id}.${mime}`;
    const bucketName = process.env.BUCKET;

    const imageMimes = ["image/jpeg", "image/png", "image/jpg"];
    if (imageMimes.includes(mime)) {
      buffer = await sharp(buffer)
        .resize(500, 500)
        .toFormat("jpg")
        .jpeg({ quality: 90 })
        .toBuffer();
    }
    await s3
      .putObject({
        Bucket: bucketName,
        Key: fileName,
        ACL: "public-read",
        Body: buffer,
        ContentType: mime,
      })
      .promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        link: `https://${bucketName}.s3.amazonaws.com/${fileName}`,
      }),
    };
  } catch (err) {
    console.log("error", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message }),
    };
  }
};
