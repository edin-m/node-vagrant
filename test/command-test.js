var EventEmitter = require('events').EventEmitter;

var expect = require('chai').expect;
var rewire = require('rewire');

var command = rewire('../src/command');

describe('test command', function () {
    var exSpawn;
    var spawnMock;

    before(function () {
        exSpawn = command.__get__('spawn');
        spawnMock = new EventEmitter();
        spawnMock.stdout = new EventEmitter();
        spawnMock.stderr = new EventEmitter();
    });

    after(function () {
        command.__set__('spawn', exSpawn);
    });

    it('tests command returns spawned child', function (done) {
        command.__set__('spawn', function () {
            return spawnMock;
        });

        var child = command.runCommand('vagrant up', function (err) {});

        expect(child === spawnMock);
        done();
    });

    it('test command emits error', function (done) {
        var errMock = new Error();
        command.__set__('spawn', function () {
            setTimeout(function () {
                spawnMock.emit('error', errMock);
            }, 5);
            return spawnMock;
        });

        command.runCommand('vagrant up', function (err) {
            expect(err).to.equal(errMock);
            done();
        });
    });
});
