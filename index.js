var child_process = require('child_process');
var spawn = child_process.spawn;
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var path = require('path');

var vagrant = process.env.VAGRANT_DIR ? path.join(process.env.VAGRANT_DIR, 'vagrant') : 'vagrant';

var MATCHERS = {
    port: /Port (\S+)$/mi,
    hostname: /HostName (\S+)$/mi,
    user: /User (\S+)$/mi,
    private_key: /IdentityFile (\S+)$/mi
};

function Vagrant(opts) {
    opts = opts || {};

    if(!(this instanceof Vagrant)) {
        return new Vagrant(opts);
    }

    this.opts = opts;
}

function _command(name, args, more) {
    more = more || [];
    
    if(!args || (typeof args === 'function')) {
        args = [];
    }

    if(!Array.isArray(args)) {
        args = [args];
    }

    args = args.concat(more);

    return [name].concat(args);
}

function _contains(arr, items) {
    if(!Array.isArray(items)) {
        items = [items];
    }

    return arr.some(function(item) {
        return items.indexOf(item) >= 0;
    });
}

function run(command, opts, cb) {
    var args = [].slice.call(arguments);

    if(args.length === 1) {
        opts = {};
    }
    else if(args.length === 2) {
        if(typeof args[1] === 'function') {
            cb = opts;
            opts = {};
        }
    }

    if(!Array.isArray(command)) {
        command = _command(command);
    };

    if(process.env.NODE_DEBUG)
        console.log('node-vagrant command:', command);

    var child = spawn(vagrant, command, opts);

    if(typeof cb === 'function') {
        var out = '';
        var err = '';

        child.stdout.on('data', function(data) {
            out += data;
        });

        child.stderr.on('data', function(data) {
            err += data;
        });

        child.on('close', function(code) {
            if(code !== 0)
                return cb(err);

            return cb(null, out);
        });
    }

    return child;
}


Vagrant.prototype._run = function(command, cb) {
    
    var self = this;
    if(self._runningCommand) {
        return cb(new Error('Already running command'));
    }

    self._runningCommand = true;

    var out = '';
    var err = '';
    var child = run(command, {
        cwd: self.opts.cwd || process.cwd(),
        env: self.opts.env || process.env,
    }, function(err, data) {
        self._runningCommand = false;

        cb(err, data);
    });

    return child;
};

Vagrant.prototype.sshConfig = function(cb) {
    var command = _command('ssh-config');

    this._run(command, function(err, out) {
        if(err) return cb(err);
        
        var config = {};
        for(var key in MATCHERS) {
            config[key] = out.match(MATCHERS[key])[1];
        }

        cb(null, config);
    });
};

Vagrant.prototype.status = function(cb) {
    var command = _command('status');

    this._run(command, function(err, out) {
        if(err) return cb(err);

        var lines = out.split('\n').slice(2).reduce(function(prev, curr) {
            if(prev.length > 0 && prev[prev.length - 1].length === 0) 
                return prev;

            prev.push(curr.trim());
            return prev;
        }, []);

        lines.pop();
        
        var re = /(\S+)\s+(\S+)\s+\((\S+)\)/;

        var statuses = {};
        lines.forEach(function(line) {
            var res = line.match(re);
            statuses[res[1]] = {
                status: res[2],
                provider: res[3]
            };
        });

        cb(null, statuses);
    });
};

Vagrant.prototype.up = function(args, cb) {
    cb = cb || args;

    var command = _command('up', args);
    this._run(command, cb);
};

Vagrant.prototype.init = function(args, cb) {
    cb = cb || args;

    var command = _command('init', args, ['-f']);
    this._run(command, cb);
};

Vagrant.prototype.destroy = function(args, cb) {
    cb = cb || args;

    var command = _command('destroy', args, ['-f']);
    this._run(command, cb);
};

Vagrant.prototype.suspend = function(cb) {
    this._run(_command('suspend'), cb);
};

Vagrant.prototype.resume = function(cb) {
    this._run(_command('resume'), cb);
};

Vagrant.prototype.halt = function(args, cb) {
    cb = cb || args;

    var command = _command('halt', args, ['-f']);
    this._run(command, cb);
};

Vagrant.prototype._generic = function(name, args, cb) {
    this._run(_command(name, args), cb);
};

module.exports.Vagrant = Vagrant;

module.exports.globalStatus = function(args, cb) {
     cb = cb || args;
 
     var command = _command('global-status', args);
     run(command, function(err, out) {
         if(err) return cb(err);
 
         var lines = out.split('\n').slice(2).reduce(function(prev, curr) {
             if(prev.length > 0 && prev[prev.length - 1].length === 0)
                 return prev;
 
             prev.push(curr.trim());
             return prev;
         }, []);
 
         lines.pop();
         if(/no active Vagrant environments/.test(lines[0]))
             lines = [];
 
         var re = /(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)/;
         lines = lines.map(function(line) {
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

module.exports.create = function(opts) {
    return Vagrant(opts);
};

module.exports.version = function(cb) {
    run(_command('version'), cb);
};

