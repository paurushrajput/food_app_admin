const fs = require("fs");
const { errorLogs } = require("../projectConfig.json");
const { fetchRequestPath } = require("./logManager");

function logErrorThis({ req, error, optional }) {
    try {
        if (!errorLogs?.create) {
            return
        }

        let req_path = (req?.originalUrl || req?.url || "")?.split(req?.path)[0] + req?.path || null;
        let moduleName = fetchRequestPath(req_path);
        let currentDate = new Date();
        let dd = currentDate.getDate();
        if (dd < 10) {
            dd = "0" + dd;
        }
        let mm = currentDate.getMonth();
        mm = Number(mm) + 1;
        if (mm < 10) {
            mm = "0" + mm;
        }
        let yy = currentDate.getFullYear();
        let folderPath =
            errorLogs.absolutePath +
            "/" +
            yy +
            "-" +
            mm +
            "-" +
            dd +
            "/" +
            moduleName +
            "/";
        let fileName =
            yy +
            "_" +
            mm +
            "_" +
            dd +
            "_" +
            currentDate.toLocaleTimeString().replace(/:/g, "_").replace(/ /g, "_") +
            "_" +
            moduleName +
            ".txt";
        console.info("fileName ===>", fileName);

        if (!fs.existsSync(folderPath)) {
            fs.mkdir(folderPath, {
                recursive: true
            }, function (err) {
                if (err) {
                    console.error(err);
                } else {
                    console.info("New directory successfully created.");
                    let errStr = `\n \n ${yy}-${mm}-${dd} ${currentDate.toLocaleTimeString()}: \n body: ${JSON.stringify(req?.body)}  \n query: ${JSON.stringify(req?.query)}  \n params: ${JSON.stringify(req?.params)} \n ${error?.stack
                        }\n `;
                    fs.appendFileSync(folderPath + fileName, errStr, (err) => {
                        if (err) throw err;
                        console.info("New Log file written successfully !!");
                    });
                    const fileDescriptor = fs.openSync(folderPath + fileName, 'a');
                    fs.closeSync(fileDescriptor);
                }
            });
        } else {
            console.info("directory already exists");
            fs.readdir(folderPath, function (err, files) {
                if (err) {
                    return console.error("Unable to scan directory: " + err);
                } else {
                    console.info(
                        "all files of directory: ",
                        JSON.stringify(files, null, 2)
                    );
                    for (let f = 0; f < files.length; f++) {
                        let file = files[f];
                        if (f == files.length - 1) {
                            fs.readFile(folderPath + file, "utf-8", function (err, content) {
                                if (err) throw err;
                                console.info(`${file} content length ==> `, content.length);
                                if (content.length < Number(errorLogs.maxFileSize)) {
                                    console.info("File already exists so just appending logs");
                                    let errStr = `\n \n ${yy}-${mm}-${dd} ${currentDate.toLocaleTimeString()}: \n body: ${JSON.stringify(req?.body)}  \n query: ${JSON.stringify(req?.query)}  \n params: ${JSON.stringify(req?.params)} \n ${error?.stack
                                        }\n `;
                                    fs.appendFileSync(folderPath + file, errStr, (err) => {
                                        if (err) throw err;
                                        console.info("Log file re-written successfully !!");
                                    });
                                    const fileDescriptor = fs.openSync(folderPath + file, 'a');
                                    fs.closeSync(fileDescriptor);
                                } else {
                                    console.info(
                                        "File does not exists so creating new one and appending logs"
                                    );
                                    let errStr = `\n \n ${yy}-${mm}-${dd} ${currentDate.toLocaleTimeString()}: \n body: ${JSON.stringify(req?.body)}  \n query: ${JSON.stringify(req?.query)}  \n params: ${JSON.stringify(req?.params)} \n ${error?.stack
                                        }\n `;
                                    fs.appendFileSync(folderPath + file, errStr, (err) => {
                                        if (err) throw err;
                                        console.info("New Log file written successfully !!");
                                    });
                                    const fileDescriptor = fs.openSync(folderPath + file, 'a');
                                    fs.closeSync(fileDescriptor);
                                }
                            });
                        } else {
                            fs.readFile(folderPath + file, "utf-8", function (err, content) {
                                if (err) throw err;
                                console.info(`${file} content length ==> `, content.length);
                                if (content.length < Number(errorLogs.maxFileSize)) {
                                    console.info("File already exists so just appending logs");
                                    let errStr = `\n \n ${yy}-${mm}-${dd} ${currentDate.toLocaleTimeString()}: \n body: ${JSON.stringify(req?.body)}  \n query: ${JSON.stringify(req?.query)}  \n params: ${JSON.stringify(req?.params)} \n ${error?.stack
                                        }\n `;
                                    fs.appendFileSync(folderPath + file, errStr, (err) => {
                                        if (err) throw err;
                                        console.info("Log file re-written successfully !!");
                                    });
                                    const fileDescriptor = fs.openSync(folderPath + file, 'a');
                                    fs.closeSync(fileDescriptor);
                                }
                            });
                            break;
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error(error);
    }
}

module.exports = { logErrorThis };