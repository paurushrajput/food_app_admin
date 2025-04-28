const { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsCommand } = require("@aws-sdk/client-s3");
const GeneralError = require("../error/generalError");
const { generateRandomString } = require("./password");
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.S3_REGION;
const Bucket = process.env.S3_BUCKET;
const basePath = process.env.S3_BASE_PATH;
const awsImageBaseUrl = process.env.AWS_IMAGE_BASE_URL;
const s3 = new S3Client({
    region: region,
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
});

function getUrlFromBucket(filename, addDummyImage = true) {
    // const regionString = region.includes('us-east-1') ? '' : ('-' + region)
    // return `https://${Bucket}.s3${regionString}.amazonaws.com/${filename}`
    return filename ? `${awsImageBaseUrl}/${filename}`.replace(/ /g, "%20") : (addDummyImage ? 'https://via.placeholder.com/640x360' : null);//FIXME
};

async function replaceFilenamesWithUrls(rows) {
    for (const row of rows) {
        // const url =  getUrlFromBucket(row.filename);
        const url = (row.filename && row.basePath) ?
            `${awsImageBaseUrl}/${row.basePath}/${row.filename}`.replace(/ /g, "%20") :
            'http://via.placeholder.com/640x360';
        row.filename = url;
    }
};

async function uploadFile(file, filename, public = false) {
    if (!file) {
        throw new GeneralError('file not found');
    }

    if (!filename) {
        throw new GeneralError('filename not found');
    }
    filename = Date.now().toString() + "_" + generateRandomString() + "_" + filename;

    const params = {
        Bucket,
        Key: basePath + "/" + filename,
        Body: file,
    };

    if (public) {
        params['ACL'] = 'public-read'
    }

    const command = new PutObjectCommand(params);
    const result = await s3.send(command);
    return {
        filepath: basePath,
        filename,
        public,
        downloadUrl: getUrlFromBucket(basePath + "/" + filename),
        result
    };
}



async function deleteFile(filename) {
    if (!filename) {
        throw new GeneralError('filename not found');
    }

    const params = {
        Bucket,
        Key: basePath + "/" + filename,
    };

    const command = new DeleteObjectCommand(params);

    const result = await s3.send(command);
    return result
}

async function listFileFromBucket() {
    const params = {
        Prefix: basePath,
        Bucket,
    };
    const command = new ListObjectsCommand(params);
    const result = await s3.send(command);
    return result;
}


module.exports = {
    uploadFile,
    deleteFile,
    listFileFromBucket,
    getUrlFromBucket,
    replaceFilenamesWithUrls
}
