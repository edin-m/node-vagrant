# node-vagrant
Node js wrapper for vagrant CLI - command line tool.

This is light wrapper around vagrant CLI.
It uses spawn process, and every command requiring user input
such as init and destroy is created with switch --force or -f.

[![npm version](https://badge.fury.io/js/node-vagrant.svg)](https://badge.fury.io/js/node-vagrant)
[![Build Status](https://travis-ci.org/edin-m/node-vagrant.svg?branch=master)](https://travis-ci.org/edin-m/node-vagrant)

Installation
===

```
$ npm install node-vagrant --save
```

Usage
===

All callbacks are node style:
```js
function(err, out)
```
where err is stderr if exit code != 0 and out is stdout if exit code == 0
___
Other commands
```js
// import vagrant
var vagrant = require('node-vagrant');

// view version
vagrant.version(function(err, out) {});
// or --version ; out = { status: '2.0.3', major: 2, minor: 0, patch: 3 }
vagrant.versionStatus(function(err, out) {});

// view global status
// you can specify '--prune' as additional argument. By default global-status is based on a cache,
// prune removes invalid entries from the list.
// Note that this is much more time consuming than simply listing the entries.
vagrant.globalStatus(function(err, out) {});
vagrant.globalStatus('--prune', function(err, out) {});

// vagrant machine

// create machine - does not run command or init machine
// you can specify directory where Vagrantfile will be located
// and machine instanced
var machine = vagrant.create({ cwd: <String>, env: <Object> }) // cwd and env default to process' values

// init machine
// you can specify additional arguments by using array (applicable to other functions)
machine.init('ubuntu/trusty64', function(err, out) {});
machine.init(['ubuntu/trusty64'], function(err, out) {});
// -f is set by default
machine.init(['ubuntu/trusty64', '-f'], function(err, out) {});

// up
machine.up(function(err, out) {})

// status
machine.status(function(err, out) {});

// get ssh config - useful to retrieve private and connect to machine with ssh2
// out is an array of objects [{}] with properties: port, hostname, user, private_key
machine.sshConfig(function(err, out) {});

// execute an ssh command on the machine
machine.on('ssh-out', console.log);
machine.on('ssh-err', console.error);
machine.sshCommand('echo "a bash command"');

// provision
machine.provision(function(err, out) {});

// suspend
machine.suspend(function(err, out) {});

// resume
machine.resume(function(err, out) {});

// reload
machine.reload(function(err, out) {});

// halt
machine.halt(function(err, out) {});

// destroy
// uses -f by default
machine.destroy(function(err, out) {});

// snapshots
// push, pop, save, delete, restore, list and a snapshot() function.
// example:
machine.snapshots().push(cb);

// box repackage
// must be specific to a vagrant environment hence location in machine
machine.boxRepackage(name, provider, version, function(err, out) {})

// plugins
// expunge, install, uninstall, repair, update, list and a plugin() function.
// example:
machine.plugin().expunge(args, cb);

// DEPRECATED! For backward compatibility only
machine.pluginUpdate(function(err, out) {});
machine.pluginRepair(function(err, out) {});

// boxes

// box add
// uses -f by default
// depending on type of box provided (name,address,file,json) missing information may be prompted.
// please ensure that your add metheod is specific.
vagrant.boxAdd(box, args, function(err, out) {})
    .on('progress', function(out) {});

// box list
// out is an array of objects [{}] with properties: name, provider, version
vagrant.boxList(args, function(err, out) {});

// box outdated
// --global is used by default
// out is an array of objects [{}] with properties: name, status, currentVersion, latestVersion
// status can be 'up to date' 'out of date' 'unknown'
// if status is unknown currentVersion and latestVersion will be null
vagrant.boxOutdated(args, function(err, out) {});

// box prune
// uses -f by defaultprune
vagrant.boxPrune(args, function(err, out) {});

// box remove
// uses -f by default
vagrant.boxRemove(name, args, function(err, out) {});

// box repackage
// avalible in machine

// box update
// uses the --box and --provider flags by default
// provider can be null and in that case no --provider arg is added
vagrant.boxUpdate(box, provider, function(err, out) {});
    .on('progress', function(out) {});


// args
// should be array of args or a string for single flag see --prune abov
// ie
vagrant.boxAdd('ubuntu/trusty64', ['--clean', '--provider', 'virtualbox'], function(err, out) {})
//or simply
vagrant.boxAdd('ubuntu/trusty64', '--clean', function(err, out) {})
```

Events
===
```js
.on('up-progress', function(out) {}); // receive stdout progress from up of vagrant

.on('progress', function(out) {}); // receive stdout box download progress
```

Receive any stdout/stderr output from a child subprocess. These work only on a Machine instance:

```
machine.on('stdout', function(data) {}); // data is a Buffer
machine.on('stderr', function(data) {}); // data is a Buffer
```

Example
===

Example script of a usage is in example/example.js

```
$ npm run example
```

Flags & env vars
===

Debug the commands sent to vagrant:
```js
$ NODE_DEBUG=1 node example.js
node-vagrant command: [ 'global-status' ]
node-vagrant command: [ 'version' ]
```

Disable the debug:
```js
$ NODE_DEBUG=1 NODE_VAGRANT_DISABLE_DEBUG=1 node example.js
```

Custom vagrant location:
```js
$ VAGRANT_DIR=/custom/path node example.js
```

Promises
===

```js
var vagrant = require('../index');
vagrant.promisify();

vagrant.init('ubuntu/trusty64').then(successCb, errorCb);
```

TODO
===
- [ ] multi-machine
- [ ] more detail vagrant file settings
    - [ ] firewall
    - [ ] networking
- [x] boxing
- [x] provisoning
- [x] providers
- [x] (native) promises (if available)
- [ ] use ES6 (after which will become version 2.x.x)
