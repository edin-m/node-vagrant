var child_process = require('child_process');
var spawn = child_process.spawn;
var path = require('path');

var vagrant = process.env.VAGRANT_DIR ? path.join(process.env.VAGRANT_DIR, 'vagrant') : 'vagrant';

function buildCommand(name, args, more) {
    more = more || [];

    if (!args || (typeof args === 'function')) {
        args = [];
    }

    if (!Array.isArray(args)) {
        args = [args];
    }

    args = args.concat(more);

    if (!Array.isArray(name)) {
        name = [name];
    }

    return name.concat(args);
}

function runCommand(command, opts, cb) {
    var args = [].slice.call(arguments);

    if (args.length === 1) {
        opts = {};
    } else if (args.length === 2) {
        if (typeof args[1] === 'function') {
            cb = opts;
            opts = {};
        }
    }

    if (!Array.isArray(command)) {
        command = buildCommand(command);
    }

    if (process.env.NODE_DEBUG && !process.env.NODE_VAGRANT_DISABLE_DEBUG) {
        console.log('node-vagrant command:', command);
    }

    opts.detached = false;
    var child = spawn(vagrant, command, opts);

    if (typeof cb === 'function') {
        var out = '';
        var err = '';

        child.stdout.on('data', function (data) {
            out += data;
        });

        child.stderr.on('data', function (data) {
            err += data;
        });

        child.on('close', function (code) {
            if (code !== 0) {
                return cb(err, out);
            }
            return cb(null, out);
        });

        child.on('error', function (err) {
            return cb(err);
        });
    }

    return child;
}

module.exports = {
    buildCommand: buildCommand,
    runCommand: runCommand
};
