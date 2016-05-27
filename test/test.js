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

    it('should test creation of vagrant file with config', function(done) {
        this.timeout(20000);
        var config = require('./example1.config.json');
        machine.init('ubuntu/trusty64', config, function(err, out) {
            expect(err).to.not.exist;

            var origLoc = path.join(__dirname, 'Vagrantfile');
            var exampleLoc = path.join(__dirname, 'example1.Vagrantfile');

            var Vagrantfile = fs.readFileSync(origLoc).toString().replace(/[\n\r]/gm, '');
            var exampleVagrantfile = fs.readFileSync(exampleLoc).toString().replace(/[\n\r]/gm, '');

            expect(Vagrantfile).to.equal(exampleVagrantfile);
            done();
        });

    });

    after(function(done) {
        this.timeout(20000);
        machine.destroy(function(err, res) {
            expect(err).to.not.exist;

            var where = path.join(__dirname, 'Vagrantfile');
            fs.unlinkSync(where);

            done();
        });
    });

});
