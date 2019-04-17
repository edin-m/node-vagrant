var EventEmitter = require('events').EventEmitter;
var util = require('util');

var parsers = require('./parsers');
var Command = require('./command');
var Machine = require('./machine');
var Common = require('./common');

module.exports._run = Command.runCommand;

module.exports.Machine = Machine;

module.exports.globalStatus = function (args, cb) {
    cb = cb || args;

    var command = Command.buildCommand('global-status', args);
    module.exports._run(command, function (err, out) {
        if (err) {
            return cb(err);
        }
        var lines = parsers.globalStatusParser(out);
        cb(null, lines);
    });
};

module.exports.create = function (opts) {
    return new Machine(opts);
};

module.exports.version = function (cb) {
    module.exports._run(Command.buildCommand('version'), cb);
};

module.exports.versionStatus = function (cb) {
    var command  = Command.buildCommand('--version');
    module.exports._run(command, function (err, out) {
        if (err) {
            return cb(err);
        }
        cb(null, parsers.versionStatusParser(out));
    });
};

module.exports.boxAdd = function (box, args, cb) {
    if (typeof box !== 'string' && cb) {
        return cb('box must be provided as a string');
    }
    cb = cb || args;

    var command = Command.buildCommand(['box', 'add', '-f'], args, box);
    var proc = module.exports._run(command, cb);

    var emitter = new EventEmitter;
    proc.stdout.on('data', function (buff) {
        var data = buff.toString();

        var res = parsers.downloadStatusParser(data);
        if (res) {
            emitter.emit('progress', res.machine, res.progress, res.rate, res.remaining);
        }
    });
    return emitter;
};

module.exports.boxList = function (args, cb) {
    cb = cb || args;

    var command = Command.buildCommand(['box', 'list'], args);
    module.exports._run(command, function (err, out) {
        if (err) {
            return cb(err);
        }
        cb(null, parsers.boxListParser(out));
    });
};

module.exports.boxOutdated = function (args, cb) {
    cb = cb || args;

    var command = Command.buildCommand(['box', 'outdated', '--global'], args);
    module.exports._run(command, function (err, out) {
        if (err) {
            return cb(err);
        }
        cb(null, parsers.boxListOutdatedParser(out));
    });
};

module.exports.boxPrune = function (args, cb) {
    cb = cb || args;

    var command = Command.buildCommand(['box', 'prune', '-f'], args);
    module.exports._run(command, cb);
};

module.exports.boxRemove = function (name, args, cb) {
    if (typeof name !== 'string' && cb) {
        return cb('name must be provided as a string');
    }

    cb = cb || args;

    var command = Command.buildCommand(['box', 'remove', '-f'], args, name);
    module.exports._run(command, cb);
};

module.exports.boxUpdate = function (box, provider, cb) {
    if (typeof box !== 'string' && cb) {
        cb('box must be provided as a string');
        return new EventEmitter;
    }

    var commandArgs = ['box', 'update', '--box', box];
    if (typeof provider === 'string') {
        commandArgs.push('--provider');
        commandArgs.push(provider);
    }

    var command = Command.buildCommand(commandArgs);
    var proc = module.exports._run(command, cb);

    var emitter = new EventEmitter;
    proc.stdout.on('data', function (buff) {
        var data = buff.toString();

        var res = parsers.downloadStatusParser(data);
        if (res) {
            emitter.emit('progress', res.machine, res.progress, res.rate, res.remaining);
        }
    });
    return emitter;
};

module.exports.promisify = function () {
    Common.enablePromised();
    if (Common.isPromised()) {
        Machine.promisify();
        module.exports.globalStatus = util.promisify(module.exports.globalStatus);
        module.exports.version = util.promisify(module.exports.version);
        module.exports.versionStatus = util.promisify(module.exports.versionStatus);
        module.exports.boxAdd = util.promisify(module.exports.boxAdd);
        module.exports.boxList = util.promisify(module.exports.boxList);
        module.exports.boxOutdated = util.promisify(module.exports.boxOutdated);
        module.exports.boxPrune = util.promisify(module.exports.boxPrune);
        module.exports.boxRemove = util.promisify(module.exports.boxRemove);
        module.exports.boxUpdate = util.promisify(module.exports.boxUpdate);
    } else {
        console.error('No Promise top-level class found');
    }
};
