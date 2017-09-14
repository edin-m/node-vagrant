var EventEmitter = require('events').EventEmitter;
var expect = require('chai').expect;
var sinon = require('sinon');

var vagrant = require('../index');

/* eslint no-unused-vars: ["error", { "args": "none" }] */
/* eslint quotes: "off" */

describe('it should test node-vagrant', function () {
    var machine;

    before(function (done) {
        machine = vagrant.create({ cwd: __dirname });
        done();
    });

    describe('should test vagrant machine commands', function () {
        // mock _mainRun as to call a callback within tests
        var runFuncBefore;
        before(function (done) {
            runFuncBefore = machine._run;
            done();
        });
        it('should test vagrant init', function (done) {
            machine._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(3);
                expect(command[0]).to.equal('init');
                expect(command[1]).to.equal('ubuntu/trusty64');
                expect(command[2]).to.equal('-f');
                done();
            };
            machine.init('ubuntu/trusty64', { }, function () { });
        });
        it('should test vagrant up', function (done) {
            machine._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(1);
                expect(command[0]).to.equal('up');
                done();
                return { stdout: { on: function () { } }, stderr: { } };
            };
            machine.up();
        });
        it('should test vagrant up emit progress', function (done) {
            var dataStr = '    default: Progress: 97% (Rate: 899k/s, Estimated time remaining: 0:00:24)';
            var ee = new EventEmitter;
            var spy = sinon.spy();
            machine._run = function (command) {
                return { stdout: ee, stderr: { } };
            };
            machine.once('up-progress', spy);
            machine.up();
            ee.emit('data', dataStr);
            expect(spy.calledOnce).to.equal(true);
            expect(spy.getCall(0).args[0]).to.equal(dataStr);
            done();
        });
        it('should test vagrant up emit up-progress', function (done) {
            var dataStr = '    default: Progress: 97% (Rate: 899k/s, Estimated time remaining: 0:00:24)';
            var ee = new EventEmitter;
            var spy = sinon.spy();
            machine._run = function (command) {
                return { stdout: ee, stderr: { } };
            };
            machine.once('progress', spy);
            machine.up();
            ee.emit('data', dataStr);
            expect(spy.calledOnce).to.equal(true);
            expect(spy.getCall(0).args).to.deep.equal(['default', '97', '899k/s', '0:00:24']);
            done();
        });
        it('should test vagrant status', function (done) {
            machine._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(1);
                expect(command[0]).to.equal('status');
                done();
            };
            machine.status();
        });
        it('should test vagrant ssh config', function (done) {
            machine._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(1);
                expect(command[0]).to.equal('ssh-config');
                done();
            };
            machine.sshConfig();
        });
        it('should test vagrant suspend', function (done) {
            machine._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(1);
                expect(command[0]).to.equal('suspend');
                done();
            };
            machine.suspend();
        });
        it('should test vagrant resume', function (done) {
            machine._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(1);
                expect(command[0]).to.equal('resume');
                done();
            };
            machine.resume();
        });
        it('should test vagrant halt', function (done) {
            machine._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(2);
                expect(command[0]).to.equal('halt');
                expect(command[1]).to.equal('-f');
                done();
            };
            machine.halt();
        });
        it('should test vagrant destroy', function (done) {
            machine._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(2);
                expect(command[0]).to.equal('destroy');
                expect(command[1]).to.equal('-f');
                done();
            };
            machine.destroy();
        });
        it('should test snapshots() push()', function (done) {
            machine._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(2);
                expect(command[0]).to.equal('snapshot');
                expect(command[1]).to.equal('push');
                done();
            };
            machine.snapshots().push();
        });
        it('should test snapshots() pop()', function (done) {
            machine._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(2);
                expect(command[0]).to.equal('snapshot');
                expect(command[1]).to.equal('pop');
                done();
            };
            machine.snapshots().pop();
        });
        it('should test snapshots() save()', function (done) {
            machine._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(1);
                expect(command[0]).to.equal('snapshot save');
                done();
            };
            machine.snapshots().save();
        });
        it('should test snapshots() delete()', function (done) {
            machine._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(1);
                expect(command[0]).to.equal('snapshot delete');
                done();
            };
            machine.snapshots().delete();
        });
        it('should test snapshots() restore()', function (done) {
            machine._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(1);
                expect(command[0]).to.equal('snapshot restore');
                done();
            };
            machine.snapshots().restore();
        });
        it('should test snapshots() list()', function (done) {
            machine._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(2);
                expect(command[0]).to.equal('snapshot');
                expect(command[1]).to.equal('list');
                done();
            };
            machine.snapshots().list();
        });
        it('should test box repackge', function (done) {
            machine._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(5);
                expect(command[0]).to.equal('box');
                expect(command[1]).to.equal('repackage');
                expect(command[2]).to.equal('ubuntu/trusty64');
                expect(command[3]).to.equal('virtualbox');
                expect(command[4]).to.equal('someNewVersion');
                done();
                return { stdout: { on: function () { } }, stderr: { } };
            };
            machine.boxRepackage('ubuntu/trusty64', 'virtualbox', 'someNewVersion');
        });
        it('should prepare provisioners from object config to array config', function (done) {
            var config = {
                config: {
                    provisioners: {
                        shell: {
                            path: "'./provision.shell.sh'"
                        },
                        ansible: {
                            playbook: "'playbook.yml'"
                        },
                        docker: {
                            pull_images: "'ubuntu'"
                        },
                        file: {
                            source: "'./Vagrantfile'",
                            destination: "'~/OutputVagrantfile'"
                        }
                    }
                }
            };
            var exprovisioners = config.config.provisioners;
            machine._prepareProvisioners(config.config);
            expect(config.config.provisioners).to.be.an('array');
            expect(config.config.provisioners.length).to.equal(4);
            config.config.provisioners.forEach(function (provisioner, index) {
                expect(provisioner).to.be.an('object');
                var origKey = Object.keys(exprovisioners)[index];
                expect(provisioner.name).to.equal(origKey);
                var orig = exprovisioners[origKey];
                for (var key in provisioner.config) {
                    expect(provisioner.config[key]).to.equal(orig[key]);
                }
            });
            done();
        });

        after(function (done) {
            machine._run = runFuncBefore;
            done();
        });
    });

    describe('should test vagrant box commands', function () {
        var runFuncBeforeVagrant;

        before(function (done) {
            runFuncBeforeVagrant = vagrant._run;
            done();
        });

        it('should test box add', function (done) {
            vagrant._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(4);
                expect(command[0]).to.equal('box');
                expect(command[1]).to.equal('add');
                expect(command[2]).to.equal('-f');
                expect(command[3]).to.equal('ubuntu/trusty64');
                done();
                return { stdout: { on: function () { } }, stderr: { } };
            };
            vagrant.boxAdd('ubuntu/trusty64');
        });
        it('should test box add emit progress', function (done) {
            var dataStr = '    default: Progress: 97% (Rate: 899k/s, Estimated time remaining: 0:00:24)';
            var ee = new EventEmitter;
            var spy = sinon.spy();
            vagrant._run = function (command) {
                return { stdout: ee, stderr: { } };
            };
            vagrant.boxAdd('ubuntu/trusty64')
                .once('progress', spy);
            ee.emit('data', dataStr);
            expect(spy.calledOnce).to.equal(true);
            expect(spy.getCall(0).args).to.deep.equal(['default', '97', '899k/s', '0:00:24']);
            done();
        });
        it('should test box list', function (done) {
            vagrant._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(2);
                expect(command[0]).to.equal('box');
                expect(command[1]).to.equal('list');
                done();
            };
            vagrant.boxList();
        });
        it('should test box outdated', function (done) {
            vagrant._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(3);
                expect(command[0]).to.equal('box');
                expect(command[1]).to.equal('outdated');
                expect(command[2]).to.equal('--global');
                done();
            };
            vagrant.boxOutdated();
        });
        it('should test box prune', function (done) {
            vagrant._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(3);
                expect(command[0]).to.equal('box');
                expect(command[1]).to.equal('prune');
                expect(command[2]).to.equal('-f');
                done();
            };
            vagrant.boxPrune();
        });
        it('should test box remove', function (done) {
            vagrant._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(4);
                expect(command[0]).to.equal('box');
                expect(command[1]).to.equal('remove');
                expect(command[2]).to.equal('-f');
                expect(command[3]).to.equal('ubuntu/trusty64');
                done();
            };
            vagrant.boxRemove('ubuntu/trusty64');
        });
        it('should test box update', function (done) {
            vagrant._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(6);
                expect(command[0]).to.equal('box');
                expect(command[1]).to.equal('update');
                expect(command[2]).to.equal('--box');
                expect(command[3]).to.equal('ubuntu/trusty64');
                expect(command[4]).to.equal('--provider');
                expect(command[5]).to.equal('virtualbox');
                done();
                return { stdout: { on: function () { } }, stderr: { } };
            };
            vagrant.boxUpdate('ubuntu/trusty64', 'virtualbox');
        });
        it('should test box update emit progress', function (done) {
            var dataStr = '    default: Progress: 97% (Rate: 899k/s, Estimated time remaining: 0:00:24)';
            var ee = new EventEmitter;
            var spy = sinon.spy();
            vagrant._run = function (command) {
                return { stdout: ee, stderr: { } };
            };
            vagrant.boxUpdate('ubuntu/trusty64', 'virtualbox')
                .once('progress', spy);
            ee.emit('data', dataStr);
            expect(spy.calledOnce).to.equal(true);
            expect(spy.getCall(0).args).to.deep.equal(['default', '97', '899k/s', '0:00:24']);
            done();
        });

        after(function (done) {
            vagrant._run = runFuncBeforeVagrant;
            done();
        });
    });
});
