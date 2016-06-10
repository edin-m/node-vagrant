var fs = require('fs');
var path = require('path');
var vagrant = require('../index');
var expect = require('chai').expect;

describe('it should test node-vagrant', function() {
    var machine;

    before(function(done) {
        machine = vagrant.create({ cwd: __dirname });
        done();
    });

    it('should test creation of example1 Vagrantfile', function(done) {
        this.timeout(20000);
        var config = require('./example1.config.json');
        machine.init('ubuntu/trusty64', config, function(err, out) {
            expect(err).to.not.exist;

            machine.isInitialized = true;
            var origLoc = path.join(__dirname, 'Vagrantfile');
            var exampleLoc = path.join(__dirname, 'example1.Vagrantfile');

            var Vagrantfile = fs.readFileSync(origLoc).toString();
            var exampleVagrantfile = fs.readFileSync(exampleLoc).toString();

            // for previewing purposes
            fs.writeFileSync('./out.example1.Vagrantfile', Vagrantfile);

            expect(Vagrantfile.replace(/[\n\r]/gm, '')).to.equal(exampleVagrantfile.replace(/[\n\r]/gm, ''));
            fs.unlinkSync(origLoc);
            done();
        });
    });

    it('should test creation of example2 Vagranfile', function(done) {
        this.timeout(20000);
        var config = require('./example2.config.json');
        machine.init('ubuntu/trusty64', config, function(err, out) {
            expect(err).to.not.exist;

            machine.isInitialized = true;
            var origLoc = path.join(__dirname, 'Vagrantfile');
            var exampleLoc = path.join(__dirname, 'example2.Vagrantfile');

            var Vagrantfile = fs.readFileSync(origLoc).toString();
            var exampleVagrantfile = fs.readFileSync(exampleLoc).toString();

            // for previewing purposes
            fs.writeFileSync('./out.example2.Vagrantfile', Vagrantfile);

            expect(Vagrantfile.replace(/[\n\r]/gm, '')).to.equal(exampleVagrantfile.replace(/[\n\r]/gm, ''));
            fs.unlinkSync(origLoc);
            done();
        });
    });

    describe('should test vagrant commands', function() {
        // mock _mainRun as to call a callback within tests
        var runFuncBefore;
        var interceptRunFunc = function(command, opts, cb) {
            if (this.callCb) {
                cb(this.callCbErr, this.callCbOut);
            }
            this.onCall(command, opts);
            return {
                stdout: { on: function() { } },
                stderr: { }
            };
        };
        var setupInterceptCallback = function(cb) {
            machine._mainRun = interceptRunFunc.bind({
                callCb: false,
                callCbErr: null,
                callCbOut: '',
                onCall: cb
            });
        };
        before(function(done) {
            runFuncBefore = machine._run;
            done();
        });
        it('should test vagrant init', function(done) {
            machine._run = function(command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(3);
                expect(command[0]).to.equal('init');
                expect(command[1]).to.equal('ubuntu/trusty64');
                expect(command[2]).to.equal('-f');
                done();
            };
            machine.init('ubuntu/trusty64', { }, function() { });
        });
        it('should test vagrant up', function(done) {
            machine._run = function(command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(1);
                expect(command[0]).to.equal('up');
                done();
                return { stdout: { on: function() { } }, stderr: { } };
            };
            machine.up();
        });
        it('should test vagrant status', function(done) {
            machine._run = function(command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(1);
                expect(command[0]).to.equal('status');
                done();
            };
            machine.status();
        });
        it('should test vagrant sshStatus', function(done) {
            machine._run = function(command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(1);
                expect(command[0]).to.equal('ssh-config');
                done();
            };
            machine.sshConfig();
        });
        it('should test vagrant suspend', function(done) {
            machine._run = function(command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(1);
                expect(command[0]).to.equal('suspend');
                done();
            };
            machine.suspend();
        });
        it('should test vagrant resume', function(done) {
            machine._run = function(command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(1);
                expect(command[0]).to.equal('resume');
                done();
            };
            machine.resume();
        });
        it('should test vagrant halt', function(done) {
            machine._run = function(command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(2);
                expect(command[0]).to.equal('halt');
                expect(command[1]).to.equal('-f');
                done();
            };
            machine.halt();
        });
        it('should test vagrant destroy', function(done) {
            machine._run = function(command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(2);
                expect(command[0]).to.equal('destroy');
                expect(command[1]).to.equal('-f');
                done();
            };
            machine.destroy();
        });
        after(function(done) {
            machine._run = runFuncBefore;
            done();
        });
    });

    it('should prepare provisioners from object config to array config', function(done) {
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
            //expect(provisioner.type).to.equal(origKey);
            var orig = exprovisioners[origKey];
            for (var key in provisioner.config) {
                expect(provisioner.config[key]).to.equal(orig[key]);
            }
        });
        done();
    });

    after(function(done) {
        this.timeout(20000);
        var filesToUnlink = [
            path.join(__dirname, 'out.example1.Vagrantfile'),
            path.join(__dirname, './out.example2.Vagrantfile')
        ];
        filesToUnlink.forEach(function(filename) {
            if (fs.existsSync(filename)) {
                fs.unlinkSync(filename);
            }
        });
        machine.destroy(function(err, res) {
            expect(err).to.not.exist;
            done();
        });
    });

});
