var fs = require('fs');
var expect = require('chai').expect;

var parsers = require('../src/parsers');

describe('test parsers', function () {
    it('should test download parser', function () {
        var downloadProgressStr = '    default: Progress: 19% (Rate: 619k/s, Estimated time remaining: 0:11:38)';
        var result = parsers.downloadStatusParser(downloadProgressStr);
        expect(result).to.deep.equal({
            machine: 'default',
            progress: '19',
            rate: '619k/s',
            remaining: '0:11:38'
        });
    });
    it('should test download parser - error', function () {
        var downloadProgressStr = '   default: Progress: 19% (Rate: 619k/s,Estimated time remaining: 0:11:38)';
        var result = parsers.downloadStatusParser(downloadProgressStr);
        expect(result).to.equal(null);
    });
    describe('Vagrant status parsing', function () {
        it('should parse all status information', function () {
            var exStats = fs.readFileSync(__dirname + '/data/status').toString();
            var machStats = parsers.statusParser(exStats);
            expect(Object.keys(machStats).length).to.equal(2);
            expect(machStats['my_server'].status).to.equal('running');
            expect(machStats['my_server'].provider).to.equal('docker');
            expect(machStats['rethinkDB'].status).to.equal('not created');
            expect(machStats['rethinkDB'].provider).to.equal('virtualbox');
        });
    });
    it('should test global status parser', function () {
        var data = fs.readFileSync(__dirname + '/data/global-status.txt').toString();
        var res = parsers.globalStatusParser(data);
        expect(res).to.deep.equal([{
            id: 'baa72b8',
            name: 'default',
            provider: 'virtualbox',
            state: 'saved',
            cwd: '/Users/edin-m/node-vagrant/edin-m/node-vagrant/example'
        }, {
            id: '454ace7',
            name: 'default',
            provider: 'virtualbox',
            state: 'poweroff',
            cwd: '/Users/edin-m/node-vagrant/edin-m/node-vagrant/del1'
        }]);
    });
    it('should test sshConfig parser', function () {
        var data = fs.readFileSync(__dirname + '/data/ssh-config.txt').toString();
        var res = parsers.sshConfigParser(data);
        expect(res).to.deep.equal([{
            host: 'default',
            port: '2222',
            hostname: '127.0.0.1',
            user: 'vagrant',
            private_key: '/Users/edin-m/node-vagrant/edin-m/node-vagrant/del1/.vagrant/machines/default/virtualbox/private_key'
        }]);
    });
    it('should test sshConfig parser', function () {
        var data = fs.readFileSync(__dirname + '/data/ssh-config-nokey.txt').toString();
        var res = parsers.sshConfigParser(data);
        expect(res).to.deep.equal([{
            host: 'default',
            port: '2222',
            hostname: '127.0.0.1',
            user: 'vagrant',
            private_key: null
        }]);
    });
    it('should test box list parser', function () {
        var data = fs.readFileSync(__dirname + '/data/boxes.txt').toString();
        var res = parsers.boxListParser(data);
        expect(res).to.deep.equal([{
            name: 'my_box',
            provider: 'virtualbox',
            version: '0',
        }, {
            name: 'ubuntu/trusty64',
            provider: 'virtualbox',
            version: '20170818.0.0',
        }]);
    });
    it('should test box list parser - no box installed', function () {
        var data = fs.readFileSync(__dirname + '/data/box-no-box-installed.txt').toString();
        var res = parsers.boxListOutdatedParser(data);
        expect(res).to.deep.equal([]);
    });
    it('should test box outdated parser', function () {
        var data = fs.readFileSync(__dirname + '/data/box-outdated.txt').toString();
        var res = parsers.boxListOutdatedParser(data);
        expect(res).to.deep.equal([{
            name: 'ubuntu/trusty64',
            status: 'up to date',
            currentVersion: 'v20170818.0.0',
            latestVersion: 'v20170818.0.0'
        }, {
            name: 'my_box',
            status: 'unknown',
            currentVersion: null,
            latestVersion: null
        }, {
            name: 'laravel/homestead',
            status: 'out of date',
            currentVersion: '2.2.0',
            latestVersion: '3.0.0'
        }]);
    });
    it('should test version status parser', function () {
        var versionStatus = 'Vagrant 2.0.3\n';
        var version = parsers.versionStatusParser(versionStatus);
        expect(version.status).to.equal('2.0.3');
        expect(version.major).to.equal(2);
        expect(version.minor).to.equal(0);
        expect(version.patch).to.equal(3);
    });
});
