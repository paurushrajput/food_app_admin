require('dotenv').config();
const mysql = require('mysql2/promise');
const mysql2 = require('mysql2');
const projectConfig = require("../projectConfig.json");
const { Operations } = require("../constants/database");
const DatabaseError = require("../error/databaseError");
const { isEmptyField } = require('../utils/common');

class Database {
    constructor() {
        this.pool = mysql.createPool({
            connectionLimit: process.env.MYSQL_CONNECTION_LIMIT || 5,
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USERNAME,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DB_NAME,
            port: process.env.MYSQL_DB_PORT,
            connectTimeout: 10000,
        });

        this.connect();
    }

    async connect() {
        try {
            const connection = await this.pool.getConnection();
            console.log('Database connected successfully');
            connection.release();
        } catch (error) {
            console.log("MysqlError ******* ", error)
            throw error;
        }
    }

    async query(statement, getLastInsertId = false) {
        try {
            let operation = statement?.operation || Operations.SELECT;
            if (projectConfig?.db?.logs || statement?.logging) {
                console.log('SQL ==> ', getRaw(statement));
            }

            //checking transaction is applied to this query 
            let connection = statement?.transaction;
            if (typeof connection == undefined || !connection || connection == null) {
                connection = this.pool;
                console.log("query execution type ********** POOL")
            } else {
                console.log("query execution type ********** TRANSACTION")
            }

            const [rows, fields] = await connection.execute(statement.text, statement.values);

            if (projectConfig?.db?.printResult || statement?.printResult) {
                console.log([rows, fields]);
            }

            let response = statement?.rowsOnly ? { rows } : { rows, fields };
            if (operation == Operations.INSERT && getLastInsertId == true) {
                // const [rows1, fields1] = await connection.execute('SELECT last_insert_id() as lastInsertId');
                const [rows1, fields1] = await connection.execute(`SELECT MAX(id) as lastInsertId FROM ${statement.tableName}`);
                response = { ...response, lastInsertId: rows1.length ? rows1[0].lastInsertId : 0 }
            }
            return response;
        } catch (error) {
            throw new DatabaseError(error);
        }
    }

    static getStandAloneConnection() {
        const pool = mysql2.createPool({
            connectionLimit: 1,
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USERNAME,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DB_NAME,
            port: process.env.MYSQL_DB_PORT,
            connectTimeout: 10000,
        });
        const connection = pool.promise();
        return connection;
    }

    static getInstance() {
        if (!this.instance) {
            this.instance = new Database();
        }
        return this.instance;
    }
}

function getRaw(statement) {
    let text = statement.text;
    for (let value of statement.values) {
        if (typeof value == 'number') {
            text = text.replace("?", value);
        } else {
            text = text.replace("?", `'${value}'`);
        }
    }
    return text;
}

function inMapper(array) {
    if (typeof array == "undefined" || array.length < 1) {
        throw new DatabaseError("Invalid array passed to inMapper");
    }
    let value = array?.map((value) => `'${value}'`).join(', ');
    return value;
}

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

function validateValues(array) {
    let result = [];
    for (let a of array) {
        result.push(Object.keys(a).length);
    }
    result = [...new Set(result)]
    return result.length > 1 ? false : true;
}

function getColumnReplacement(columns) {
    let columnReplacement = '';
    let columnValues = [];
    const keys = Object.keys(columns)?.filter(key => typeof columns[key] != "undefined");
    for (let key of keys) {
        if (columns[key] && (columns[key].toString().trim() == 'now()' || columns[key].toString().trim() == 'CURRENT_TIMESTAMP')) {
            columnReplacement += ` ${key} = now(),`
        } else if (columns[key] === null || columns[key]?.toString().toLowerCase().trim() === "null") {
            columnReplacement += ` ${key} = null,`
        } else {
            const value = typeTransformer(columns[key]);
            columnReplacement += ` ${key} = ?,`
            columnValues.push(value);
        }
    }
    columnReplacement += ` updated_at = now()`
    return {
        columnReplacement,
        columnValues
    };
}

function insertData(tableName, dataArray) {
    if (dataArray.length === 0) {
        throw new DatabaseError('No data to insert');
    }

    if (!Array.isArray(dataArray)) {
        dataArray = [dataArray];
    }

    dataArray = removeUndefinedAndNull(dataArray);

    if (!validateValues(dataArray)) {
        throw new DatabaseError('Input values is distorted');
    }

    const columns = Object.keys(dataArray[0]);
    const placeholders = Array.from({ length: columns.length }, () => '?').join(', ');
    const values = transformValues(dataArray);
    const text = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${dataArray
        .map((item) => {
            dataArray.push(...columns.map((col) => item[col]));
            return `(${placeholders})`;
        })
        .join(', ')};`;

    const statement = {
        text,
        values,
        tableName
    }
    return statement;
}

function updateSingle(table, columns, id) {
    let { columnReplacement, columnValues } = getColumnReplacement(columns);
    let text = `update ${table} set ${columnReplacement} where id = ? ;`
    const statement = {
        text,
        values: [...columnValues, ...[id]]
    }
    return statement;
}

function updateByColumn(table, columns, byColumn, value) {
    let { columnReplacement, columnValues } = getColumnReplacement(columns);
    let text = `update ${table} set ${columnReplacement} where ${byColumn} = ? ;`
    const statement = {
        text,
        values: [...columnValues, ...[value]]
    }
    return statement;
}

function updateMultiple(table, columns, ids) {
    ids = Array.isArray(ids) ? ids : [ids];
    const idsCopy = [...ids]
    // Generate comma-separated placeholders for multiple IDs
    const idPlaceholders = ids.fill('?').join(',');

    let { columnReplacement, columnValues } = getColumnReplacement(columns);
    let text = `update ${table} set ${columnReplacement} where id IN (${idPlaceholders}) ;`
    const statement = {
        text,
        values: [...columnValues, ...idsCopy]
    }
    return statement;
}

module.exports = {
    db: Database.getInstance(),
    connection: Database.getStandAloneConnection,
    inMapper,
    insertData,
    updateSingle,
    updateMultiple,
    updateByColumn
}
