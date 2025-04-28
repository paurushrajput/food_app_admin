function getKeyByValue(object = {}, value) {
    for (let key in object) {
        if (object[key] === value) {
            return key;
        }
    }
    return null;
}

module.exports = {
    getKeyByValue,
}