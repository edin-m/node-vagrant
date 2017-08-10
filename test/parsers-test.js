var expect = require('chai').expect;

var parsers = require('../src/parsers');

describe('test parsers', function () {
    it('should test download parser', function () {
        var downloadProgressStr = '    default: Progress: 19% (Rate: 619k/s, Estimated time remaining: 0:11:38)';
        var result = parsers.parseDownloadStatus(downloadProgressStr);
        expect(result).to.deep.equal({
            machine: 'default',
            progress: '19',
            rate: '619k/s',
            remaining: '0:11:38'
        });
    });
    it('should test download parser - error', function () {
        var downloadProgressStr = '   default: Progress: 19% (Rate: 619k/s,Estimated time remaining: 0:11:38)';
        var result = parsers.parseDownloadStatus(downloadProgressStr);
        expect(result).to.equal(null);
    });
});
