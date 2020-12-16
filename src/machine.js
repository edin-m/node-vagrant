var EventEmitter = require('events').EventEmitter;
var util = require('util');
var path = require('path');
var _ = require('lodash');
var fs = require('fs');

var provisionerAdapters = require('./provisioners');
var parsers = require('./parsers');
var Command = require('./command');
var Common = require('./common');

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

    if (!!child.stdout) {
        child.stdout.on('data', function (data) {
            self.emit('stdout', data);
        });
    }

    if (!!child.stderr) {
        child.stderr.on('data', function (data) {
            self.emit('stderr', data);
        });
    }

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

Machine.prototype.sshCommand = function (cmd, cb) {
    var command = Command.buildCommand('ssh', ['-c', cmd]);
    var proc = this._run(command, cb);

    var self = this;
    proc.stdout.on('data', function (buff) {
        self.emit('ssh-out', buff.toString());
    });

    proc.stderr.on('data', function(buff) {
        self.emit('ssh-err', buff.toString());
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
        config.config = {
            vm: { box: args }
        };
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
    this._generic(['destroy', '-f'], args, cb);
};

Machine.prototype.suspend = function (cb) {
    this._generic('suspend', [], cb);
};

Machine.prototype.resume = function (cb) {
    this._generic('resume', [], cb);
};

Machine.prototype.halt = function (args, cb) {
    cb = cb || args;
    this._generic(['halt', '-f'], args, cb);
};

Machine.prototype.reload = function (args, cb) {
    cb = cb || args;
    this._generic('reload', args, cb);
};

Machine.prototype.provision = function (cb) {
    this._generic('provision', [], cb);
};

Machine.prototype.pluginUpdate = function (cb) {
    console.warn('DEPRECATED, use plugin().update()');
    this._generic('plugin update', [], cb);
};

Machine.prototype.pluginRepair = function (cb) {
    console.warn('DEPRECATED, use plugin().repair()');
    this._generic('plugin repair', [], cb);
};

Machine.prototype.plugin = function () {
    var self = this;
    var plugin = {
        expunge: function (args, cb) {
            self._generic('plugin', 'expunge', args, cb);
        },
        install: function (args, cb) {
            self._generic('plugin', 'install', args, cb);
        },
        uninstall: function (args, cb) {
            self._generic('plugin', 'uninstall', args, cb);
        },
        list: function (args, cb) {
            self._generic('plugin', 'list', args, cb); 
        },
        repair: function  (args, cb) {
            self._generic('plugin', 'repair', args, cb); 
        },
        update: function  (args, cb) {
            self._generic('plugin', 'update', args, cb);
        }
    };
    if (Common.isPromised()) {
        plugin.expunge = util.promisify(plugin.expunge);
        plugin.install = util.promisify(plugin.install);
        plugin.uninstall = util.promisify(plugin.uninstall);
        plugin.list = util.promisify(plugin.list);
        plugin.repair = util.promisify(plugin.repair);
        plugin.update = util.promisify(plugin.update);
    }
    return plugin;
};

Machine.prototype.snapshots = function () {
    var self = this;
    var snapshots = {
        push: function (cb) {
            self._generic('snapshot', 'push', cb);
        },
        pop: function (cb) {
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
    if (Common.isPromised()) {
        snapshots.push = util.promisify(snapshots.push);
        snapshots.pop = util.promisify(snapshots.pop);
        snapshots.save = util.promisify(snapshots.save);
        snapshots.restore = util.promisify(snapshots.restore);
        snapshots.list = util.promisify(snapshots.list);
        snapshots.delete = util.promisify(snapshots.delete);
    }
    return snapshots;
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

module.exports.promisify = function () {
    if (Common.isPromised()) {
        Machine.prototype.sshConfig = util.promisify(Machine.prototype.sshConfig);
        Machine.prototype.sshCommand = util.promisify(Machine.prototype.sshCommand);
        Machine.prototype.status = util.promisify(Machine.prototype.status);
        Machine.prototype.up = util.promisify(Machine.prototype.up);
        Machine.prototype.init = util.promisify(Machine.prototype.init);
        Machine.prototype.destroy = util.promisify(Machine.prototype.destroy);
        Machine.prototype.suspend = util.promisify(Machine.prototype.suspend);
        Machine.prototype.resume = util.promisify(Machine.prototype.resume);
        Machine.prototype.halt = util.promisify(Machine.prototype.halt);
        Machine.prototype.reload = util.promisify(Machine.prototype.reload);
        Machine.prototype.provision = util.promisify(Machine.prototype.provision);
        Machine.prototype.boxRepackage = util.promisify(Machine.prototype.boxRepackage);
    }
};
