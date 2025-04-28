const redis = require('redis');
const _ = require('lodash');
const DatabaseError = require("../error/databaseError");

let instance = null;

class RedisClient {
    constructor() {
        const url = `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
        const redisPassword = process.env.REDIS_PASSWORD;
        if (typeof redisPassword != "undefined" && redisPassword != null && redisPassword.trim().length > 0) {
            this.client = redis.createClient({
                url,
                password: redisPassword,
            });
        } else {
            if (process.env.NODE_ENV === 'local') {
                this.client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST);
            } else {
                this.client = redis.createClient({
                    url
                });
            }
        }
        this.client.on("error", (error) => console.error(`RedisError : ${error}`));
    }

    static getInstance() {
        if (!instance) {
            instance = new RedisClient();
        }
        return instance;
    }

    async initRedis() {
        this.client.connect();
    }

    async getData(key) {
        try {
            console.log(process.env.REDIS_ENV, key);
            const data = await this.client.get(key);
            return JSON.parse(data);
        } catch (err) {
            throw new DatabaseError(err);
        }
    }

    async setData(key, data, duration = 18000) {
        try {
            const value = typeof data === 'string' ? data : JSON.stringify(data);
            let resp = await this.client.setEx(key, duration, value); // cache for 5 mins
            return resp;
        } catch (err) {
            throw new DatabaseError(err);
        }
    }

    async delData(keys) {
        try {
            let response = await this.client.del(keys);
            return response;
        } catch (err) {
            throw new DatabaseError(err);
        }
    }

    async setZSet(setKey, score, key) {
        try {
            await this.client.zAdd(setKey, { score: score, value: key });
        } catch (err) {
            throw new DatabaseError(err);
        }
    }

    async zRangeWithScore(key, start, end) {
        try {
            let teams = await this.client.ZRANGE_WITHSCORES(key, start, end);
            return teams;
        } catch (err) {
            throw new DatabaseError(err);
        }
    }

    async zRankForValue(key, value) {
        try {
            const member = await this.client.ZREVRANK(key, value);
            return member;
        } catch (err) {
            throw new DatabaseError(err);
        }
    }

    async zScoreForMember(key, memberKey) {
        try {
            const member = await this.client.ZSCORE(key, memberKey);
            return member;
        } catch (err) {
            throw new DatabaseError(err);
        }
    }

    async zRangeByScore(key, min, max) {
        try {
            const member = await this.client.ZRANGEBYSCORE(key, min, max);
            return member;
        } catch (err) {
            throw new DatabaseError(err);
        }
    }

    async setDataNoTtl(key, data) {
        try {
            console.log("writing on redis no ttl:..", key);
            const value = typeof data === 'string' ? data : JSON.stringify(data);
            let resp = await this.client.set(key, value); // Use this.client to access the Redis client
            return resp;
        } catch (err) {
            throw new DatabaseError(err);
        }
    }


    async zRemRangeByScore(key, min, max) {
        try {
            const member = await this.client.ZREMRANGEBYSCORE(key, min, max);
            return member;
        } catch (err) {
            throw new DatabaseError(err);
        }
    }
}

const redisObj = RedisClient.getInstance();

module.exports = {
    getData: redisObj.getData.bind(redisObj),
    initRedis: redisObj.initRedis.bind(redisObj),
    setData: redisObj.setData.bind(redisObj),
    delData: redisObj.delData.bind(redisObj),
    setZSet: redisObj.setZSet.bind(redisObj),
    zRangeWithScore: redisObj.zRangeWithScore.bind(redisObj),
    zRankForValue: redisObj.zRankForValue.bind(redisObj),
    zScoreForMember: redisObj.zScoreForMember.bind(redisObj),
    zRangeByScore: redisObj.zRangeByScore.bind(redisObj),
    zRemRangeByScore: redisObj.zRemRangeByScore.bind(redisObj),
    setDataNoTtl: redisObj.setDataNoTtl.bind(redisObj),
};