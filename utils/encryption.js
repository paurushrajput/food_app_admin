const crypto = require('crypto');
const util = require('util');
const secretKey = process.env.SECRET_KEY;
const secretIv = process.env.SECRET_IV;
const encryptionMethod = 'aes-256-cbc';

const encrypt = util.promisify((text, callback) => {
    const cipher = crypto.createCipheriv(encryptionMethod, Buffer.from(secretKey), secretIv);
    let encryptedData = cipher.update(text, 'utf8', 'hex');
    encryptedData += cipher.final('hex');
    callback(null, encryptedData);
});

const decrypt = util.promisify((encryptedData, callback) => {
    const decipher = crypto.createDecipheriv(encryptionMethod, Buffer.from(secretKey), secretIv);
    let decryptedData = decipher.update(encryptedData, 'hex', 'utf8');
    decryptedData += decipher.final('utf8');
    callback(null, decryptedData);
});

function generateRandomIV() {
    const secretIv = crypto.randomBytes(16);
    const ivHex = secretIv.toString('hex').slice(0, 16);
    return ivHex;
}

function generateRandomKey() {
    // Generate a random 32-byte buffer
    const key = crypto.randomBytes(32);
    // Convert the buffer to a hexadecimal string
    const keyHex = key.toString('hex').slice(0, 32);
    return keyHex;
}

module.exports = {
    encrypt,
    decrypt,
    generateRandomIV,
    generateRandomKey
};
