var expect = require('chai').expect;
var provisionerAdapters = require('../provisioners');
var path = require('path');
var fs = require('fs');
var _ = require('lodash');

function trimAndRemoveEmpty(result) {
    return result.split(/\n|\r/).map(function(item) {
        return item.trim();
    }).filter(function(item) {
        return item.length > 0;
    });
}

describe('Test provisioner adapters', function() {
    it('Generic name value adapter', function(done) {
        var result = provisionerAdapters.get('unknownAdapter').createTemplate({});
        expect(result.length).to.equal(0);
        done();
    });
    it('Docker adapter commands', function(done) {
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
        var result = provisionerAdapters.get('docker').createTemplate(provisionerConfig);
        var lines = trimAndRemoveEmpty(result);
        for (var i = 0; i < provisionerConfig.config.commands.length; i++) {
            var reg = new RegExp(provisionerConfig.config.commands[i].replace('[', '\\[').replace(']', '\\]'));
            expect(lines[i]).to.match(reg);
        }
        done();
    });
    it('Registering custom adapter', function(done) {
        function CustomDockerAdapter() {
            var tplFile = fs.readFileSync(path.join(__dirname, '../templates/docker.tpl')).toString();
            var compiled = _.template(tplFile);
            this.createTemplate = function (provisionerConfig) {
                return compiled({
                    provisionerAlias: provisionerConfig.alias || provisionerConfig.name,
                    settings: provisionerConfig.config
                });
            };
        }
        provisionerAdapters.addAdapter('customAdapter', new CustomDockerAdapter());
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
        var result = provisionerAdapters.get('docker').createTemplate(provisionerConfig);
        var lines = trimAndRemoveEmpty(result);
        done();
    });
});
