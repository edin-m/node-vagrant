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

    it.skip('should test creation of vagrant file with config', function(done) {
        this.timeout(20000);
        var config = require('./example1.config.json');
        machine.init('ubuntu/trusty64', config, function(err, out) {
            expect(err).to.not.exist;

            machine.isInitialized = true;
            var origLoc = path.join(__dirname, 'Vagrantfile');
            var exampleLoc = path.join(__dirname, 'example1.Vagrantfile');

            var Vagrantfile = fs.readFileSync(origLoc).toString().replace(/[\n\r]/gm, '');
            var exampleVagrantfile = fs.readFileSync(exampleLoc).toString().replace(/[\n\r]/gm, '');

            expect(Vagrantfile).to.equal(exampleVagrantfile);
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
        if (!!!machine.isInitialized) {
            return done();
        }
        this.timeout(20000);
        machine.destroy(function(err, res) {
            expect(err).to.not.exist;

            var where = path.join(__dirname, 'Vagrantfile');
            fs.unlinkSync(where);

            done();
        });
    });

});
