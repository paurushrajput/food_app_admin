const AWS = require("aws-sdk");
const ServerError = require("../error/serverError");

AWS.config = {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_SECRETS_REGION
}

class SecretsManager {
	secretName;
	region;
	secretsManager;

	constructor(
		secretName,
		region,
	) {
		this.secretName = secretName;
		this.region = region;
		this.setSecretsManager();
	}

	setSecretsManager = () => {
		const config = { region: this.region }
    this.secretsManager = new AWS.SecretsManager(config);
  };

	getSecret = async (key) => {
		let secret, decodedBinarySecret;
		let env = process.env.NODE_ENV;
		if(env.toLowerCase() == "prod"){
			key = `prod_${key}`
		} else {
			key = `dev_${key}`
		}
		try {
			const secretValue = await this.secretsManager.getSecretValue({ SecretId: this.secretName }).promise();
			console.log(secretValue);
			if ('SecretString' in secretValue) {
				secret = secretValue.SecretString;
				secret = JSON.parse(secret);
				if(!secret[key]) {
					const err = new ServerError('Value not found');
					err.status = 'Value not found';
					throw err;
				}
				return { key: key, value: secret[key] }
			} else {
				let buff = new Buffer(secretValue.SecretBinary, 'base64');
				return decodedBinarySecret = buff.toString('ascii');
			}
		} catch (err) {
			err.status = err.status ? err.status : 500;
			throw err;
		}
	}

	updateSecret = async (key, value) => {
		let secret;
		try {
			let secretValue = await this.secretsManager.getSecretValue({ SecretId: this.secretName }).promise();
			if ('SecretString' in secretValue) {
				secret = secretValue.SecretString;
				secret = JSON.parse(secret);
				secret[key] = value;
				// return {key: secret[key]}    
			}

			let resp = await this.secretsManager.putSecretValue({
				SecretId: this.secretName,
				SecretString: JSON.stringify(secret)
			}).promise();

			return resp;
		} catch (err) {
			err.status = err.status ? err.status : 500;
			throw err;
		}
	}
}

module.exports = SecretsManager;