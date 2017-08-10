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

var SSH_CONFIG_MATCHERS = {
    host: /Host (\S+)$/mi,
    port: /Port (\S+)$/mi,
    hostname: /HostName (\S+)$/mi,
    user: /User (\S+)$/mi,
    private_key: /IdentityFile (\S+)$/mi,
};

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

    return [name].concat(args);
}

function run(command, opts, cb) {
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
}


Machine.prototype._run = function (command, cb) {
    var self = this;
    if (self._runningCommand) {
        self.batch.push({ command: command, cb: cb });
        return;
    }

    self._runningCommand = true;

    // var out = '';
    // var err = '';
    var child = run(command, {
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
        var configs = out.split('\n\n')
            .filter(function (out) {
                return !_.isEmpty(out);
            })
            .map(function (out) {
                var config = {};
                for (var key in SSH_CONFIG_MATCHERS) {
                    config[key] = out.match(SSH_CONFIG_MATCHERS[key])[1];
                }
                return config;
            });

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

Machine.prototype._generic = function (name, args, cb) {
    this._run(_command(name, args), cb);
};

module.exports.Machine = Machine;

module.exports.globalStatus = function (args, cb) {
    cb = cb || args;

    var command = _command('global-status', args);
    run(command, function (err, out) {
        if (err) {
            return cb(err);
        }

        var lines = out.split('\n').slice(2).reduce(function (prev, curr) {
            if (prev.length > 0 && prev[prev.length - 1].length === 0) {
                return prev;
            }
            prev.push(curr.trim());
            return prev;
        }, []);

        lines.pop();
        if (/no active Vagrant environments/.test(lines[0])) {
            lines = [];
        }

        var re = /(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)/;
        lines = lines.map(function (line) {
            var res = line.match(re);
            return {
                id: res[1],
                name: res[2],
                provider: res[3],
                state: res[4],
                cwd: res[5]
            };
        });

        cb(null, lines);
    });
};

module.exports.create = function (opts) {
    return Machine(opts);
};

module.exports.version = function (cb) {
    run(_command('version'), cb);
};
