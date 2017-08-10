var expect = require('chai').expect;
var provisionerAdapters = require('../provisioners');
var path = require('path');
var fs = require('fs');
var _ = require('lodash');

/**
 * Split on newlines, trim lines and filter out empty lines
 */
function trimAndRemoveEmpty(result) {
    return result.split(/\n|\r/).map(function (item) {
        return item.trim();
    }).filter(function (item) {
        return item.length > 0;
    });
}

describe('Test provisioner adapters', function () {
    it('Generic name value adapter', function (done) {
        var provisionerConfig = {
            name: 'wtf',
            config: {
                name: 'value',
                name2: 'value2'
            }
        };
        var result = provisionerAdapters.createTemplate(provisionerConfig);
        var lines = trimAndRemoveEmpty(result);
        expect(lines.length).to.equal(2);
        done();
    });
    it('Commands provisioner adapter', function (done) {
        var provisionerConfig = {
            name: 'docker1',
            config: {
                commands: [
                    'pull_images "ubuntu"',
                    'pull_images "debian"',
                    'run "rabbitmq"'
                ]
            }
        };
        var result = provisionerAdapters.createTemplate(provisionerConfig);
        var lines = trimAndRemoveEmpty(result);
        for (var i = 0; i < provisionerConfig.config.commands.length; i++) {
            var reg = new RegExp(provisionerConfig.config.commands[i].replace('[', '\\[').replace(']', '\\]'));
            expect(lines[i]).to.match(reg);
        }
        done();
    });
    it('Docker adapter commands', function (done) {
        var provisionerConfig = {
            name: 'docker1',
            type: 'docker',
            config: {
                commands: [
                    'pull_images "ubuntu"',
                    'pull_images "ubuntu"',
                    'run "rabbitmq"',
                    'run "ubuntu", cmd: "bash -l", args: "-v \'/vagrant:/var/www\'"',
                    'run "db-1", image: "user/mysql"',
                    'images: ["ubuntu", "gentoo"]'
                ]
            }
        };
        var result = provisionerAdapters.createTemplate(provisionerConfig);
        var lines = trimAndRemoveEmpty(result);
        for (var i = 0; i < provisionerConfig.config.commands.length; i++) {
            var reg = new RegExp(provisionerConfig.config.commands[i].replace('[', '\\[').replace(']', '\\]'));
            expect(lines[i]).to.match(reg);
        }
        done();
    });
    it('Registering custom adapter', function (done) {
        /**
         * Custom adapter must implement createTemplate() which receives provisionerConfig
         */
        function CustomAdapter() {
            var tplFile = fs.readFileSync(path.join(__dirname, '../templates/commands.tpl')).toString();
            var compiled = _.template(tplFile);
            this.createTemplate = function (provisionerConfig) {
                return compiled({
                    provisioner: provisionerConfig,
                    settings: provisionerConfig.config
                });
            };
        }
        provisionerAdapters.addAdapter('customAdapter', new CustomAdapter());
        provisionerAdapters.removeAdapter('customAdapter');
        var provisionerConfig = {
            name: 'custom1',
            type: 'customAdapter',
            config: {
                commands: [
                    'pull_images "ubuntu"'
                ]
            }
        };
        var result = provisionerAdapters.createTemplate(provisionerConfig);
        var lines = trimAndRemoveEmpty(result);
        expect(lines[0]).to.match(new RegExp(provisionerConfig.config.commands[0]));
        done();
    });
});
