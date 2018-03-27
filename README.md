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

// view global status
//you can specify '--prune' as additional argument. By default global-status is based on a cache,
//prune removes invalid entries from the list.
//Note that this is much more time consuming than simply listing the entries.
vagrant.globalStatus(function(err, out) {});
vagrant.globalStatus('--prune', function(err, out) {});

// vagrant machine

// create machine - does not run command or init machine
// you can specify directory where Vagrantfile will be located
// and machine instanced
var machine = vagrant.create({ cwd: [], env: [] });

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
// out is object {} with properties: port, hostname, user, private_key
machine.sshConfig(function(err, out) {});

// suspend
machine.suspend(function(err, out) {});

// resume
machine.resume(function(err, out) {});

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
machine.boxRepackage(name, provider, version, function(err, out) {});


// boxes

// box add
// uses -f by default
// depending on type of box provided (name,address,file,json) missing information may be prompted.
// please ensure that your add metheod is specific.
vagrant.boxAdd(box, args, function(err, out) {})
    .on('progress', function(out) {});

// box list
// out is object {} with properties: name, provider, version
vagrant.boxList(args, function(err, out) {});

// box outdated
// --global is used by default
// out is object {} with properties: name, status, currentVersion, latestVersion
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

TODO
===
- multi-machine
- more detail vagrant file settings
    - firewall
    - networking
- boxing
- ~~provisoning~~
- ~~providers~~
