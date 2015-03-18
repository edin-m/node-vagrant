# node-vagrant
Node js wrapper for vagrant CLI - command line tool.

This is light wrapper around vagrant CLI.
It uses spawn process, and every command requiring user input
such as init and destroy is created with switch --force or -f.

Installation
===

```
npm install node-vagrant --save
```

Usage
===

All callbacks are node style:
```
function(err, out) { ...
```
where err is stderr if exit code != 0 and out is stdout if exit code == 0
___
Other commands
```
// import vagrant
var vagrant = require('node-vagrant');

// view version
vagrant.version(function(err, out) ...

// view global status
vagrant.globalStatus(function(err, out) ...
// out is [] array of {} objects with properties: id, name, provider, state, cwd

// create machine - does not run command or init machine
// you can specify directory where Vagrantfile will be located
// and machine instanced
var machine = vagrant.create({ cwd: ..., env: ... });

// init machine
// you can specify additional arguments by using array (applicable to other functions)
machine.init('ubuntu/trusty64', function(err, out) ...
machine.init(['ubuntu/trusty64'], function(err, out) ...
// -f is set by default
machine.init(['ubuntu/trusty64', '-f'], function(err, out) ...

// up
machine.up(function(err, out) ...

// status
machine.status(function(err, out) ...

// get ssh config - useful to retrieve private and connect to machine with ssh2
machine.sshConfig(function(err, out) ...
// out is object {} with properties: port, hostname, user, private_key

// suspend
machine.suspend(function(err, out) ...

// resume
machine.resume(function(err, out) ...

// halt
machine.halt(function(err, out) ...

// destroy - uses -f by default
machine.destroy(function(err, out) ...

```

Example
===

Example script of a usage is in example/example.js

```
npm run example
```

TODO
===
- multi-machine
- more detail vagrant file settings
    - firewall
    - networking
- boxing
- provisoning
