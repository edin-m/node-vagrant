#!/usr/bin/env node

var fs = require('fs');
var vagrant = require('../index');
vagrant.promisify();

process.env.NODE_DEBUG = true;

vagrant.globalStatus().then(console.log.bind(console));

vagrant.version().then(console.log.bind(console));

vagrant.versionStatus().then(console.log.bind(console));

var machine = vagrant.create({ cwd: process.cwd(), env: process.env });

machine.on('progress', function () {
    console.log('download progress: ', [].slice.call(arguments));
});

machine.on('up-progress', function () {
    console.log('up progress: ', [].slice.call(arguments));
});

var config = {
    config: {
        vm: {
            box: 'ubuntu/trusty64'
        }
    }
};

machine.init('ubuntu/trusty64', config)
    .then(function (out) {
        return machine.up();
    }, function (err) {
        throw new Error(err);
    })
    .then(function (out) {
        return machine.status();
    }, function (err) {
        throw new Error(err);
    })
    .then(function (out) {
        console.log(out);
        return machine.sshConfig();
    })
    .then(function (out) {
        console.log(out);
        return machine.suspend();
    })
    .then(function (out) {
        console.log(out);
        return machine.resume();
    })
    .then(function (out) {
        console.log(out);
        return machine.halt();
    })
    .then(function (out) {
        console.log(out);
        return machine.destroy();
    })
    .then(function (out) {
        console.log(out);
        return vagrant.globalStatus();
    })
    .then(function (out) {
        console.log(out);
        fs.unlinkSync('./Vagrantfile');
    })
    .catch(function (err) {
        console.log('Caught an error\n', err);
    });
