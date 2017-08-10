var fs = require('fs');
var path = require('path');
var expect = require('chai').expect;

var vagrant = require('../index');
var helpers = require('./helpers');
var describe = helpers.integration.describe;
var it = helpers.integration.it;

/* eslint no-unused-vars: ["error", { "args": "none" }] */
/* eslint quotes: "off" */

describe('it should test node-vagrant', function () {
    var machine;

    before(function (done) {
        machine = vagrant.create({ cwd: __dirname });
        done();
    });

    it('should test creation of example1 Vagrantfile', function (done) {
        this.timeout(20000);
        var config = require('./example1.config.json');
        machine.init('ubuntu/trusty64', config, function (err, out) {
            expect(err).to.not.exist;

            machine.isInitialized = true;
            var origLoc = path.join(__dirname, 'Vagrantfile');
            var exampleLoc = path.join(__dirname, 'example1.Vagrantfile');

            var Vagrantfile = fs.readFileSync(origLoc).toString();
            var exampleVagrantfile = fs.readFileSync(exampleLoc).toString();

            // for previewing purposes
            fs.writeFileSync(path.join(__dirname, 'out.example1.Vagrantfile'), Vagrantfile);

            expect(Vagrantfile.replace(/[\n\r]/gm, '')).to.equal(exampleVagrantfile.replace(/[\n\r]/gm, ''));
            fs.unlinkSync(origLoc);
            done();
        });
    });

    it('should test creation of example2 Vagranfile', function (done) {
        this.timeout(20000);
        var config = require('./example2.config.json');
        machine.init('ubuntu/trusty64', config, function (err, out) {
            expect(err).to.not.exist;

            machine.isInitialized = true;
            var origLoc = path.join(__dirname, 'Vagrantfile');
            var exampleLoc = path.join(__dirname, 'example2.Vagrantfile');

            var Vagrantfile = fs.readFileSync(origLoc).toString();
            var exampleVagrantfile = fs.readFileSync(exampleLoc).toString();

            // for previewing purposes
            fs.writeFileSync(path.join(__dirname, 'out.example2.Vagrantfile'), Vagrantfile);

            expect(Vagrantfile.replace(/[\n\r]/gm, '')).to.equal(exampleVagrantfile.replace(/[\n\r]/gm, ''));
            // fs.unlinkSync(origLoc);
            done();
        });
    });

    it('should destroy machine', function (done) {
        machine.destroy(function (err, res) {
            expect(err).to.not.exist;
            done();
        });
    });

    after(function (done) {
        this.timeout(20000);
        var filesToUnlink = [
            path.join(__dirname, 'out.example1.Vagrantfile'),
            path.join(__dirname, './out.example2.Vagrantfile')
        ];
        filesToUnlink.forEach(function (filename) {
            if (fs.existsSync(filename)) {
                // comment out this line to be able to see output example Vagrantfiles
                fs.unlinkSync(filename);
            }
            done();
        });
    });
});
