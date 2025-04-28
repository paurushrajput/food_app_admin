const Logs = require("../models/mongo/logs.model");
const { dateToMillis, getCurrentYmd } = require("../utils/date");
const { Log, LogsSchema } = require("../constants/logs");
const { prefixToRemove, globalAPIPrefix } = require("../constants/api");

const subTypeHandler = {
    "DatabaseError": "database",
    "ClientError": "client",
    "ServerError": "server",
    "GeneralError": "general",
    "Error": "general",
    "TypeError": "server",
    "ValidationError": "client",
    "ReferenceError":"server"
}

async function addNewError({ error, req }) {
    const date = dateToMillis();
    const type = LogsSchema.type.ERROR;
    const reqPath = (req?.originalUrl || req?.url)?.split(req?.path)[0] + req?.path || '';
    const module = fetchRequestPath(reqPath);
    const { currentDate, currentDateLocal } = getCurrentYmd(true);
    const errorText = `\n \n ${currentDate} ${currentDateLocal}: \n ${reqPath}  \n body: ${JSON.stringify(req?.body)}  \n query: ${JSON.stringify(req?.query)}  \n params: ${JSON.stringify(req?.params)} \n error: ${error?.stack}\n `;
    const host = process.env.SERVER_URL;
    const subType = subTypeHandler[error.name] || subTypeHandler['Error'];
    const existingEntry = await Logs.findOne({ date, module, type, subType, host }, { lean: true }).select('_id');

    if (existingEntry) {
        // If an entry exists for today's date, module, and type, subType push the details
        await Logs.updateOne(
            {
                _id: existingEntry._id,
            },
            {
                $push: { details: errorText },
            }
        );
    } else {
        // If no entry exists, create a new one
        const newEntry = {
            date,
            module,
            details: [errorText],
            type,
            subType,
            host,
        };
        await Logs.create(newEntry);
    }
    return {
        success: true
    }
}


function fetchRequestPath(url) {
    if (typeof url == "undefined" || url == null) {
        url = ""
    }
    const possibleVersions = Object.values(globalAPIPrefix).map(elem => elem.replace("/", ""));
    let version = Log.unknownVersion;
    let module = Log.unknownModule;
    if (url.includes("/")) {
        const pathArr = url.split("/").filter(elem => typeof elem != "undefined" && elem?.length > 0 && elem != prefixToRemove);
        if (pathArr) {
            if (pathArr.length > 0) {
                if (possibleVersions.includes(pathArr[0])) {
                    version = pathArr[0]
                }
            }
            if (pathArr.length > 1) {
                module = pathArr[1]
            }
        }
    }
    return `${version}_${module}`
}

module.exports = {
    addNewError,
    fetchRequestPath
}