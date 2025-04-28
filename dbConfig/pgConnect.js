const { Pool } = require('pg');
const { Operations } = require('../constants/database');
const DatabaseError = require('../error/databaseError');

class DatabasePool {
    constructor() {
        this.pool = new Pool({
            host: process.env.PGBOUNCER_HOST,
            port: process.env.PGBOUNCER_PORT || 6432,
            database: process.env.PG_DB_NAME,
            user: process.env.PG_DB_USER,
            password: process.env.PG_DB_PASSWORD,
            // max: process.env.PG_POOL_MAX,
            // min: process.env.PG_POOL_MIN,
            // idleTimeoutMillis: process.env.PG_POOL_IDLE_TIMEOUT,
            // connectionTimeoutMillis: process.env.PG_POOL_CONNECTION_TIMEOUT,
            // max: 1,
            // min: 0,
            // idleTimeoutMillis: 120000,
            // connectionTimeoutMillis: 10000,
            max_client_conn: 100,
            default_pool_size: 20,
            pool_mode: "session",
            max_connections: 100,
        });

        this.pool.on('connect', () => {
            console.log('PG Pool connection created');
        });

        this.pool.on('remove', () => {
            console.log('PG Pool connection removed');
        });
    }

    async testConnection() {
        let client;
        try {
            client = await this.pool.connect();
            const result = await client.query('SELECT NOW()');
            console.log('Postgres Database connection test successful:', result.rows[0]);
            return true;
        } catch (error) {
            console.error('Postgres Database connection test failed:', error.message);
            throw new DatabaseError(`Failed to connect to database: ${error.message}`);
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    async simpleQuery(statement) {
        // No manual release needed - pool handles it automatically
        try {
            if (!statement || !statement.text) {
                console.error("Error: Query 'text' is missing in the statement.");
                throw new TypeError("Query 'text' cannot be null or undefined.");
            }
            const result = await this.pool.query(statement.text, statement.values);
            if (statement?.operation == Operations.SELECT) {
                return result.rows;
            }
            return {
                rows: result.rows,
                rowCount: result.rowCount,
            };
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }

    // Using pool.connect() - Manual Release Required
    async complexTransaction(callback) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            // Manual release required when using pool.connect()
            client.release();
        }
    }

    // Only needed when shutting down the application or Lambda container
    async end() {
        await this.pool.end();
    }
}

// Singleton instance
let dbInstance = null;

const getPGDatabase = async () => {
    if (!dbInstance) {
        dbInstance = new DatabasePool();
        // Test connection when creating instance
        // await dbInstance.testConnection();

    }
    return dbInstance;
};

function typeTransformer(data) {
    let result;
    if (typeof data == 'number' || typeof data == 'string') {
        result = data
    }
    else if (typeof data == 'object') {
        result = `${JSON.stringify(data)}`;
    }
    else {
        result = `'${data}'`;
    }
    return result;
}

function transformValues(array) {
    const result = [];
    for (let a of array) {
        const keys = Object.keys(a);
        for (let k of keys) {
            result.push(typeTransformer(a[k]));
        }
    }
    return result;
}

function validateValues(array) {
    let result = [];
    for (let a of array) {
        result.push(Object.keys(a).length);
    }
    result = [...new Set(result)]
    return result.length > 1 ? false : true;
}

function removeUndefinedAndNull(array) {
    const result = [];
    for (let element of array) {
        const obj = element;
        const keys = Object.keys(obj);
        for (let k of keys) {
            if (typeof obj[k] == "undefined" || obj[k] == null) {
                delete obj[k];
            }
        }
        result.push(obj);
    }
    return result;
}

function getColumnReplacement(columns) {
    let columnReplacement = '';
    let columnValues = [];
    const keys = Object.keys(columns);
    let pqp;
    for (let [index, key] of keys.entries()) {
        if (!pqp) pqp = index;
        if (columns[key]?.toString().toLowerCase().trim() === "null") {
            columnReplacement += ` ${key} = null,`
        }
        else if (['NOW()', 'CURRENT_TIMESTAMP'].includes(columns[key].toString().trim())) {
            columnReplacement += ` ${key} = now(),`
        }
        else {
            pqp = pqp + 1;
            const value = typeTransformer(columns[key]);
            columnReplacement += ` ${key} = $${pqp},`
            columnValues.push(value);
        }
    }
    columnReplacement += ` updated_at = now()`
    return {
        columnReplacement,
        columnValues,
        pqp
    };
}

function inMapper(array) {
    if (typeof array == "undefined" || array.length < 1) {
        throw new DatabaseError("Invalid array passed to inMapper");
    }
    let value = array?.map((value) => `'${value}'`).join(', ');
    return value;
}

function insertData(tableName, dataArray, returning = []) {
    if (dataArray.length === 0) {
        throw new Error('No data to insert');
    }

    if (!Array.isArray(dataArray)) {
        dataArray = [dataArray];
    }

    dataArray = removeUndefinedAndNull(dataArray);

    if (!validateValues(dataArray)) {
        throw new Error('Input values is distorted');
    }

    const returnValues = returning.length > 0 ? ` returning ${returning.join(', ')} ` : '';

    const columns = Object.keys(dataArray[0]);
    let placeholders = Array.from({ length: columns.length }, (e, i) => i + 1);
    let values = transformValues(dataArray);
    let lastParamNo = 0;
    const text = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${dataArray
        .map((item, index) => {
            let lastPlaceHolder;
            let modifiedPlaceholders = placeholders.map(el => {
                lastPlaceHolder = el + lastParamNo;
                return `$${el + lastParamNo}`
            }).join(', ')
            lastParamNo = lastPlaceHolder
            return `(${modifiedPlaceholders})`;
        })
        .join(', ')} ${returnValues};`;

    const statement = {
        text,
        values,
        tableName
    }
    return statement;
}

function updateSingle(table, columns, id) {
    if (!id) {
        throw new Error("Invalid id");
    }
    let { columnReplacement, columnValues, pqp } = getColumnReplacement(columns);
    let text = `update ${table} set ${columnReplacement} where id = $${pqp + 1} ;`
    const statement = {
        text,
        values: [...columnValues, ...[id]]
    }
    return statement;
}

module.exports = { getPGDatabase, insertData, updateSingle, inMapper };