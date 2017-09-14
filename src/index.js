var child_process = require('child_process');
var spawn = child_process.spawn;
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var path = require('path');
var _ = require('lodash');
var fs = require('fs');
var provisionerAdapters = require('./provisioners');
var parsers = require('./parsers');

var vagrant = process.env.VAGRANT_DIR ? path.join(process.env.VAGRANT_DIR, 'vagrant') : 'vagrant';

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

function _command(name, args, more) {
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

module.exports._run = function (command, opts, cb) {
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
        command = _command(command);
    }

    if (process.env.NODE_DEBUG) {
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
                return cb(err);
            }
            return cb(null, out);
        });
    }

    return child;
};

Machine.prototype._run = function (command, cb) {
    var self = this;
    if (self._runningCommand) {
        self.batch.push({ command: command, cb: cb });
        return;
    }

    self._runningCommand = true;

    // var out = '';
    // var err = '';
    var child = module.exports._run(command, {
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
    var command = _command('ssh-config');

    this._run(command, function (err, out) {
        if (err) {
            return cb(err);
        }
        var configs = parsers.sshConfigParser(out);
        cb(null, configs);
    });
};

Machine.prototype.status = function (cb) {
    var command = _command('status');

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

    var command = _command('up', args);
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

    var command = _command('init', args, ['-f']);

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

    var command = _command('destroy', args, ['-f']);
    this._run(command, cb);
};

Machine.prototype.suspend = function (cb) {
    this._run(_command('suspend'), cb);
};

Machine.prototype.resume = function (cb) {
    this._run(_command('resume'), cb);
};

Machine.prototype.halt = function (args, cb) {
    cb = cb || args;

    var command = _command('halt', args, ['-f']);
    this._run(command, cb);
};

Machine.prototype.reload = function (args, cb) {
    cb = cb || args;

    var command = _command('reload', args);
    this._run(command, cb);
};

Machine.prototype.provision = function (cb) {
    this._run(_command('provision'), cb);
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
        cb('name must be provided as a string');
    }
    if (typeof provider !== 'string') {
        cb('provider must be provided as a string');
    }
    if (typeof version !== 'string') {
        cb('version must be provided as a string');
    }

    var command = _command(['box', 'repackage', name, provider, version]);
    this._run(command, cb);
};

Machine.prototype._generic = function (name, args, cb) {
    this._run(_command(name, args), cb);
};

module.exports.Machine = Machine;

module.exports.globalStatus = function (args, cb) {
    cb = cb || args;

    var command = _command('global-status', args);
    module.exports._run(command, function (err, out) {
        if (err) {
            return cb(err);
        }
        var lines = parsers.globalStatusParser(out);
        cb(null, lines);
    });
};

module.exports.create = function (opts) {
    return Machine(opts);
};

module.exports.version = function (cb) {
    module.exports._run(_command('version'), cb);
};

module.exports.boxAdd = function (box, args, cb) {
    if (typeof box !== 'string' && cb) {
        cb('box must be provided as a string');
    }
    cb = cb || args;

    var command = _command(['box', 'add', '-f'], args, box);
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

    var command = _command(['box', 'list'], args);
    module.exports._run(command, function (err, out) {
        if (err) {
            return cb(err);
        }
        cb(null, parsers.boxListParser(out));
    });
};

module.exports.boxOutdated = function (args, cb) {
    cb = cb || args;

    var command = _command(['box', 'outdated', '--global'], args);
    module.exports._run(command, cb);
};

module.exports.boxPrune = function (args, cb) {
    cb = cb || args;

    var command = _command(['box', 'prune', '-f'], args);
    module.exports._run(command, cb);
};

module.exports.boxRemove = function (name, args, cb) {
    if (typeof name !== 'string' && cb) {
        cb('name must be provided as a string');
    }

    cb = cb || args;

    var command = _command(['box', 'remove', '-f'], args, name);
    module.exports._run(command, cb);
};

module.exports.boxUpdate = function (box, provider, cb) {
    if (typeof box !== 'string' && cb) {
        cb('box must be provided as a string');
    }

    if (typeof provider !== 'string' && cb) {
        cb('provider must be provided as a string');
    }

    var command = _command(['box', 'update', '--box', box, '--provider', provider]);
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
