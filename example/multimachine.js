#!/usr/bin/env node
var vagrant = require('../index');

process.env.NODE_DEBUG = true;

var machine = vagrant.create({ cwd: process.cwd(), env: process.env });

var config = {
    config: {
        multimachine: [
            {
                name: 'web',
                commands: [
                    'vm.box = "apache"'
                ]
            },
            {
                name: 'db',
                isPrimary: true,
                commands: [
                    'vm.box = "mysql"'
                ]
            },
            {
                name: 'db_follower',
                autostart: false,
                commands: [
                    'vm.box = "mysql"'
                ]
            }
        ]
    }
};

machine.init('ubuntu/trusty64', config, console.log.bind(console, 'Finished: '));

