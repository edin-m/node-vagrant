#!/usr/bin/env node
var vagrant = require('../index');

process.env.NODE_DEBUG = true;

var machine = vagrant.create({ cwd: process.cwd(), env: process.env });

var config = {
    config: {
        provisioners: [
            {
                name: 'shell_1',
                type: 'shell',
                config: {
                    commands: [
                        'path = "./provision.shell.sh"'
                    ]
                }
            },
            {
                name: 'ansimble_1',
                type: 'ansimble',
                config: {
                    commands: [
                        'playbook: "playbook.yml"'
                    ]
                }
            },
            {
                name: 'docker_1',
                type: 'docker',
                config: {
                    commands: [
                        'pull_images: "ubuntu"'
                    ]
                }
            },
            {
                name: 'file_1',
                type: 'file',
                config: {
                    commands: [
                        'source: "./Vagrantfile"',
                        'destination: "~/OutputVagrantfile"'
                    ]
                }
            }
        ]
    }
};

machine.init('ubuntu/trusty64', config, console.log.bind(console, 'Finished: '));

