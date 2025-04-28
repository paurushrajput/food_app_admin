require("dotenv").config();
const mongoose = require('mongoose');

class Database {
    constructor() {
        this.connection = null;
        this.connect();
    }

    async connect() {
        if (!this.connection) {
            try {
                let url = process.env.MONGO_URL;
                if (typeof url == "undefined") {
                    url = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}/${process.env.MONGO_DATABASE}?retryWrites=true&w=majority`
                }
                await mongoose.connect(url);
                this.connection = mongoose.connection;
                console.log('MongoDB connected successfully');
            } catch (error) {
                console.log("MongoError ******* ", error)
                throw error;
            }
        }

        return this.connection;
    }
}

module.exports = new Database();
