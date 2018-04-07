var util = require('util');

var _isPromiseEnabled = false;

function enablePromised() {
    _isPromiseEnabled = true;
}

function isPromised() {
    return _isPromiseEnabled && typeof Promise === 'function' &&
        typeof util.promisify === 'function';
}

module.exports = {
    enablePromised: enablePromised,
    isPromised: isPromised
};
