var fs = require('fs');
var expect = require('chai').expect;

var exStats = fs.readFileSync('./test/status').toString();
var ps = require('../parseStatus');

describe('Vagrant status parsing', function(){
    it('should parse all status information',function(){
        var mach_stats = ps(exStats);
        expect(Object.keys(mach_stats).length).to.equal(2);
        expect(mach_stats['my_server'].status).to.equal('running');
        expect(mach_stats['my_server'].provider).to.equal('docker');
        expect(mach_stats['rethinkDB'].status).to.equal('not created');
        expect(mach_stats['rethinkDB'].provider).to.equal('virtualbox');
    });
});
