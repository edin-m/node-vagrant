var util = require('util');

function isPromised() {
    return typeof Promise === 'function' &&
        typeof util.promisify === 'function';
}

module.exports = {
    isPromised: isPromised
};
