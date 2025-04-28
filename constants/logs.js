const Log = {
    unknownModule: "unknown-module",
    unknownVersion: "unknown-version"
}

const LogsSchema = {
    type: {
        INFO: "info",
        SUCCESS: "success",
        ERROR: "error",
        WARNING: "warning",
    },
    subType: {
        DATABASE: "database",
        CLIENT: "client",
        SERVER: "server",
        GENERAL: "general",
    }
}

module.exports = {
    Log,
    LogsSchema
}