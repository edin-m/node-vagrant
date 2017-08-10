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
        var exStats = fs.readFileSync('./test/status').toString();
        it('should parse all status information', function () {
            var mach_stats = parsers.statusParser(exStats);
            expect(Object.keys(mach_stats).length).to.equal(2);
            expect(mach_stats['my_server'].status).to.equal('running');
            expect(mach_stats['my_server'].provider).to.equal('docker');
            expect(mach_stats['rethinkDB'].status).to.equal('not created');
            expect(mach_stats['rethinkDB'].provider).to.equal('virtualbox');
        });
    });
});
