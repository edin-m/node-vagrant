var EventEmitter = require('events').EventEmitter;
var util = require('util');
var path = require('path');
var _ = require('lodash');
var fs = require('fs');

var provisionerAdapters = require('./provisioners');
var parsers = require('./parsers');
var Command = require('./command');

function Machine(opts) {
    opts = opts || {};

    if (!(this instanceof Machine)) {
        return new Machine(opts);
    }

    this.batch = [];

    this.opts = opts;
    this.opts.cwd = this.opts.cwd || process.cwd();
    this.opts.env = this.opts.env || process.env;
}

util.inherits(Machine, EventEmitter);

Machine.prototype._run = function (command, cb) {
    var self = this;
    if (self._runningCommand) {
        self.batch.push({ command: command, cb: cb });
        return;
    }

    self._runningCommand = true;

    // var out = '';
    // var err = '';
    var child = Command.runCommand(command, {
        cwd: self.opts.cwd,
        env: self.opts.env
    }, function (err, data) {
        self._runningCommand = false;
        var next = self.batch.pop();
        if (next) {
            self._run(next.command, next.cb);
        }

        if (typeof cb === 'function') {
            cb(err, data);
        }
    });

    return child;
};

Machine.prototype.sshConfig = function (cb) {
    var command = Command.buildCommand('ssh-config');

    this._run(command, function (err, out) {
        if (err) {
            return cb(err);
        }
        var configs = parsers.sshConfigParser(out);
        cb(null, configs);
    });
};

Machine.prototype.status = function (cb) {
    var command = Command.buildCommand('status');

    this._run(command, function (err, out) {
        if (err) {
            return cb(err);
        }
        var statuses = parsers.statusParser(out);
        cb(null, statuses);
    });
};

Machine.prototype.up = function (args, cb) {
    cb = cb || args;

    var command = Command.buildCommand('up', args);
    var proc = this._run(command, cb);

    var self = this;
    proc.stdout.on('data', function (buff) {
        var data = buff.toString();

        self.emit('up-progress', data);

        var res = parsers.downloadStatusParser(data);
        if (res) {
            self.emit('progress', res.machine, res.progress, res.rate, res.remaining);
        }
    });
};

Machine.prototype._changeVagrantfile = function (config, cb) {
    var self = this;

    var where = path.join(__dirname, '../templates/basic.tpl');
    var locVagrantfile = path.join(self.opts.cwd, 'Vagrantfile');
    fs.readFile(where, function (err, data) {
        if (err) {
            return cb(err);
        }

        data = data.toString();

        var compiled = _.template(data);
        var rendered = compiled(config);

        fs.writeFile(locVagrantfile, rendered, function (err) {
            if (err) {
                return cb(err);
            }
            cb(null);
        });
    });
};

/**
 * Transforms provisioner config to array and appends additional configuration
 */
Machine.prototype._prepareProvisioners = function (config) {
    if (!config.provisioners) {
        config.provisioners = {};
    }
    if (_.isObject(config.provisioners) && !_.isArray(config.provisioners)) {
        // convert provisioners to array and add name and type
        var provisioners = config.provisioners;
        config.provisioners = Object.keys(provisioners).reduce(function (prev, name) {
            return prev.concat([{
                name: name,
                type: name,
                config: provisioners[name]
            }]);
        }, []);
    }
    config.provisioners.forEach(function (provisioner) {
        provisioner.templateLines = provisionerAdapters.createTemplate(provisioner).split(/\n|\r/).map(function (item) {
            return item.trim();
        }).filter(function (item) {
            return item.length > 0;
        });
    });
};

Machine.prototype.init = function (args, config, cb) {
    cb = cb || config;
    config = typeof config === 'object' ? config : {};

    var command = Command.buildCommand('init', args, ['-f']);

    var self = this;

    // make config in form of { config: { ... } }
    if (!_.isEmpty(config) && !config.hasOwnProperty('config')) {
        var newconfig = config;
        config = {};
        config.config = newconfig;
    }

    if (!config.config) {
        config.config = {};
    }

    self._prepareProvisioners(config.config);

    if (!_.isEmpty(config)) {
        this._run(command, function (err, res) {
            self._changeVagrantfile(config, function (err) {
                if (err) {
                    return cb(err);
                }
                cb(null, res);
            });
        });
    } else {
        this._run(command, cb);
    }
};

Machine.prototype.destroy = function (args, cb) {
    cb = cb || args;

    var command = Command.buildCommand('destroy', args, ['-f']);
    this._run(command, cb);
};

Machine.prototype.suspend = function (cb) {
    this._run(Command.buildCommand('suspend'), cb);
};

Machine.prototype.resume = function (cb) {
    this._run(Command.buildCommand('resume'), cb);
};

Machine.prototype.halt = function (args, cb) {
    cb = cb || args;

    var command = Command.buildCommand('halt', args, ['-f']);
    this._run(command, cb);
};

Machine.prototype.reload = function (args, cb) {
    cb = cb || args;

    var command = Command.buildCommand('reload', args);
    this._run(command, cb);
};

Machine.prototype.provision = function (cb) {
    this._run(Command.buildCommand('provision'), cb);
};

Machine.prototype.snapshots = function () {
    var self = this;
    return {
        push: function (cb) {
            self._generic('snapshot', 'push', cb);
        },
        pop: function (args, cb) {
            self._generic('snapshot', 'pop', cb);
        },
        save: function (args, cb) {
            self._generic('snapshot save', args, cb);
        },
        restore: function (args, cb) {
            self._generic('snapshot restore', args, cb);
        },
        list: function (cb) {
            self._generic('snapshot', 'list', cb);
        },
        delete: function (args, cb) {
            self._generic('snapshot delete', args, cb);
        }
    };
};

Machine.prototype.boxRepackage = function (name, provider, version, cb) {
    if (typeof name !== 'string') {
        return cb('name must be provided as a string');
    }
    if (typeof provider !== 'string') {
        return cb('provider must be provided as a string');
    }
    if (typeof version !== 'string') {
        return cb('version must be provided as a string');
    }

    var command = Command.buildCommand(['box', 'repackage', name, provider, version]);
    this._run(command, cb);
};

Machine.prototype._generic = function (name, args, cb) {
    this._run(Command.buildCommand(name, args), cb);
};

/**
 *
 */
module.exports = Machine;
