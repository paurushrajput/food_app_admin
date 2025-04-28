const projectConfig = require("../projectConfig.json");
const { greenConsoleText } = require("../utils/common");

function initialize(server) {
  server.addHook('onResponse', async (request, reply) => {
    const { statusCode } = reply;
    const responseTime = Date.now() - request.startTime;
    const isRequestLog = projectConfig?.logs?.requestLog?.headers || projectConfig?.logs?.requestLog?.params || projectConfig?.logs?.requestLog?.query || projectConfig?.logs?.requestLog?.body;
    beautifyResponseLogs(isRequestLog, `${JSON.stringify(request.method)} | ${JSON.stringify(request.url)}`, { statusCode: JSON.stringify(statusCode), responseTime, responseData: JSON.stringify(reply.responseData) })
  });
}

function beautifyRequestLogs(request) {
  let logMsg = `\n======================================= ${request.method} | ${request.url} ======================================================================= \n`
  let anyTrue = false;
  if (projectConfig?.logs?.requestLog?.headers) {
    anyTrue = true;
    logMsg += `headers ==>>> ${request.headers}\n`
  }
  if (projectConfig?.logs?.requestLog?.params) {
    anyTrue = true;
    logMsg += `params ==>>> ${request.params}\n`
  }
  if (projectConfig?.logs?.requestLog?.query) {
    anyTrue = true;
    logMsg += `query ==>>> ${request.query}\n`
  }
  if (projectConfig?.logs?.requestLog?.body) {
    anyTrue = true;
    logMsg += `body ==>>> ${request.body}\n`
  }

  if (anyTrue) {
    console.log(logMsg)
  }
}

function beautifyResponseLogs(isRequestLog, url, response) {
  let logMsg = '';
  let anyTrue = false;
  if (!isRequestLog) {
    logMsg = `======================================= ${url} ======================================================================= \n \n`
  }
  if (projectConfig?.logs?.responseLog?.statusCode) {
    anyTrue = true;
    logMsg += `statusCode ==>>> ${response.statusCode}\n`
  }
  if (projectConfig?.logs?.responseLog?.responseTime) {
    anyTrue = true;
    logMsg += `responseTime ==>>> ${response.responseTime} ms \n`
  }
  if (projectConfig?.logs?.responseLog?.responseData) {
    anyTrue = true;
    logMsg += `responseData ==>>> ${response.responseData}\n`
  }

  if (anyTrue) {
   // logMsg += `============================================================================================================== \n`
   // console.log(logMsg)
  }
}

(async() => {
  require("../utils/eventListener");
  require("../dbConfig/redisConnect").initRedis();
  const {setData} =  require("../dbConfig/redisConnect");
  const result = await setData("food-app","1111");
  result.toString().toLowerCase() == "ok" && console.log("Redis connected successfully");
  
  // run cron in beta and live env only 
  if (process.env.CRON_ENV !== 'local') {
    console.log(greenConsoleText(' Cron job will be soon running.'))
    require("../utils/cron");
  }else{
    console.log(greenConsoleText(' Cron job will only run in beta and live environment.'))
  }
})()

module.exports = {
  initialize,
  beautifyRequestLogs
}
