var EventEmitter = require('events').EventEmitter;

var rewire = require('rewire');
var expect = require('chai').expect;
var sinon = require('sinon');

var Machine = rewire('../src/machine');

/* eslint no-unused-vars: ["error", { "args": "none" }] */
/* eslint quotes: "off" */

describe('it should test Machine class', function () {
    var machine;
    var commandMock = Machine.__get__('Command');

    before(function (done) {
        machine = new Machine({ cwd: __dirname });
        done();
    });

    beforeEach(function (done) {
        commandMock = Machine.__get__('Command');
        done();
    });

    afterEach(function (done) {
        Machine.__set__('Command', commandMock);
        done();
    });

    describe('should test machine commands', function () {
        // mock _mainRun as to call a callback within tests
        var runFuncBefore;
        beforeEach(function (done) {
            runFuncBefore = machine._run;
            done();
        });
        afterEach(function (done) {
            machine._run = runFuncBefore;
            done();
        });
        it('should test machine init', function (done) {
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
        it('should test machine init without config', function (done) {
            var oldChangeVagrantfile = machine._changeVagrantfile;
            machine._changeVagrantfile = function (config) {
                machine._changeVagrantfile = oldChangeVagrantfile;
                expect(config.config.vm.box).to.equal('ubuntu/trusty64');
                done();
            };
            machine._run = function (command, cb) {
                cb(null);
            };
            machine.init('ubuntu/trusty64');
        });
        it('should test machine up', function (done) {
            machine._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(1);
                expect(command[0]).to.equal('up');
                done();
                return { stdout: { on: function () { } }, stderr: { } };
            };
            machine.up();
        });
        it('should test machine up emit progress', function (done) {
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
        it('should test machine up emit up-progress', function (done) {
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
        it('should test machine status', function (done) {
            machine._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(1);
                expect(command[0]).to.equal('status');
                done();
            };
            machine.status();
        });
        it('should test machine ssh config', function (done) {
            machine._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(1);
                expect(command[0]).to.equal('ssh-config');
                done();
            };
            machine.sshConfig();
        });
        it('should test machine ssh command', function (done) {
            machine._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(3);
                expect(command[0]).to.equal('ssh');
                done();
            };
            machine.sshCommand('echo test');
        });
        it('should test machine ssh command emit stdout', function (done) {
            var ee = new EventEmitter;
            var spy = sinon.spy();
            machine._run = function (command) {
                return { stdout: ee, stderr: new EventEmitter };
            };
            machine.once('ssh-out', spy);
            machine.sshCommand('echo test');
            ee.emit('data', 'test');
            expect(spy.calledOnce).to.equal(true);
            expect(spy.getCall(0).args[0]).to.equal('test');
            done();
        });
        it('should test machine ssh command emit stderr', function (done) {
            var ee = new EventEmitter;
            var spy = sinon.spy();
            machine._run = function (command) {
                return { stdout: new EventEmitter, stderr: ee };
            };
            machine.once('ssh-err', spy);
            machine.sshCommand('1>&2 echo test');
            ee.emit('data', 'test');
            expect(spy.calledOnce).to.equal(true);
            expect(spy.getCall(0).args[0]).to.equal('test');
            done();
        });
        it('should test machine suspend', function (done) {
            machine._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(1);
                expect(command[0]).to.equal('suspend');
                done();
            };
            machine.suspend();
        });
        it('should test machine resume', function (done) {
            machine._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(1);
                expect(command[0]).to.equal('resume');
                done();
            };
            machine.resume();
        });
        it('should test machine halt', function (done) {
            machine._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(2);
                expect(command[0]).to.equal('halt');
                expect(command[1]).to.equal('-f');
                done();
            };
            machine.halt();
        });
        it('should test machine destroy', function (done) {
            machine._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(2);
                expect(command[0]).to.equal('destroy');
                expect(command[1]).to.equal('-f');
                done();
            };
            machine.destroy();
        });

        describe('should test snapshots', function () {
            it('should test snapshots() push()', function (done) {
                machine._run = function (command, cb) {
                    expect(command).to.be.an('array');
                    expect(command.length).to.equal(2);
                    expect(command[0]).to.equal('snapshot');
                    expect(command[1]).to.equal('push');
                    cb();
                };
                machine.snapshots().push(done);
            });
            it('should test snapshots() pop()', function (done) {
                machine._run = function (command, cb) {
                    expect(command).to.be.an('array');
                    expect(command.length).to.equal(2);
                    expect(command[0]).to.equal('snapshot');
                    expect(command[1]).to.equal('pop');
                    cb();
                };
                machine.snapshots().pop(done);
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

        it('should emit stdout', function (done) {
            var ee = new EventEmitter();
            var buf = Buffer.from('output');
            Machine.__set__('Command', {
                runCommand: function (_, opts, cb) {
                    cb();
                    setTimeout(function () {
                        ee.emit('data', buf);
                    }, 15);
                    return { stdout: ee };
                }
            });

            machine.on('stdout', function (data) {
                expect(data).to.equal(buf);
                done();
            });
            machine._run('any command', function () {});
        });

        it('should emit stderr', function (done) {
            var ee = new EventEmitter();
            var buf = Buffer.from('output');
            Machine.__set__('Command', {
                runCommand: function (_, opts, cb) {
                    cb();
                    setTimeout(function () {
                        ee.emit('data', buf);
                    }, 15);
                    return { stderr: ee };
                }
            });

            machine.on('stderr', function (data) {
                expect(data).to.equal(buf);
                done();
            });

            machine._run(['any command'], function () {});
        });
    });
});
