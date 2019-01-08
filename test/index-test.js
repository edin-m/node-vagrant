var EventEmitter = require('events').EventEmitter;
var expect = require('chai').expect;
var sinon = require('sinon');
var rewire = require('rewire');

var vagrant = rewire('../src/index');

/* eslint no-unused-vars: ["error", { "args": "none" }] */
/* eslint quotes: "off" */

describe('it should test node-vagrant', function () {
    describe('should test vagrant box commands', function () {
        var runFuncBeforeVagrant;

        before(function (done) {
            runFuncBeforeVagrant = vagrant._run;
            done();
        });

        it('should test box add', function (done) {
            vagrant._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(4);
                expect(command[0]).to.equal('box');
                expect(command[1]).to.equal('add');
                expect(command[2]).to.equal('-f');
                expect(command[3]).to.equal('ubuntu/trusty64');
                done();
                return { stdout: { on: function () { } }, stderr: { } };
            };
            vagrant.boxAdd('ubuntu/trusty64');
        });
        it('should test box add emit progress', function (done) {
            var dataStr = '    default: Progress: 97% (Rate: 899k/s, Estimated time remaining: 0:00:24)';
            var ee = new EventEmitter;
            var spy = sinon.spy();
            vagrant._run = function (command) {
                return { stdout: ee, stderr: { } };
            };
            vagrant.boxAdd('ubuntu/trusty64')
                .once('progress', spy);
            ee.emit('data', dataStr);
            expect(spy.calledOnce).to.equal(true);
            expect(spy.getCall(0).args).to.deep.equal(['default', '97', '899k/s', '0:00:24']);
            done();
        });
        it('should test box list', function (done) {
            vagrant._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(2);
                expect(command[0]).to.equal('box');
                expect(command[1]).to.equal('list');
                done();
            };
            vagrant.boxList();
        });
        it('should test box outdated', function (done) {
            vagrant._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(3);
                expect(command[0]).to.equal('box');
                expect(command[1]).to.equal('outdated');
                expect(command[2]).to.equal('--global');
                done();
            };
            vagrant.boxOutdated();
        });
        it('should test box prune', function (done) {
            vagrant._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(3);
                expect(command[0]).to.equal('box');
                expect(command[1]).to.equal('prune');
                expect(command[2]).to.equal('-f');
                done();
            };
            vagrant.boxPrune();
        });
        it('should test box remove', function (done) {
            vagrant._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(4);
                expect(command[0]).to.equal('box');
                expect(command[1]).to.equal('remove');
                expect(command[2]).to.equal('-f');
                expect(command[3]).to.equal('ubuntu/trusty64');
                done();
            };
            vagrant.boxRemove('ubuntu/trusty64');
        });
        it('should test box update', function (done) {
            vagrant._run = function (command) {
                expect(command).to.be.an('array');
                expect(command.length).to.equal(6);
                expect(command[0]).to.equal('box');
                expect(command[1]).to.equal('update');
                expect(command[2]).to.equal('--box');
                expect(command[3]).to.equal('ubuntu/trusty64');
                expect(command[4]).to.equal('--provider');
                expect(command[5]).to.equal('virtualbox');
                done();
                return { stdout: { on: function () { } }, stderr: { } };
            };
            vagrant.boxUpdate('ubuntu/trusty64', 'virtualbox');
        });
        it('should test box list calling parser', function (done) {
            var spy = sinon.spy();
            var revert = vagrant.__set__('parsers', { boxListParser: spy });
            vagrant._run = function (command, cb) {
                cb(null, 'There are no installed boxes! Use `vagrant box add` to add some.');
                expect(spy.calledOnce).to.equal(true);
                revert();
                done();
            };

            vagrant.boxList(function () {});
        });
        it('should test box outdated calling parser', function (done) {
            var spy = sinon.spy();
            var revert = vagrant.__set__('parsers', { boxListOutdatedParser: spy });
            vagrant._run = function (command, cb) {
                cb(null, 'There are no installed boxes! Use `vagrant box add` to add some.');
                expect(spy.calledOnce).to.equal(true);
                revert();
                done();
            };

            vagrant.boxOutdated(function () {});
        });
        it('should test box update emit progress', function (done) {
            var dataStr = '    default: Progress: 97% (Rate: 899k/s, Estimated time remaining: 0:00:24)';
            var ee = new EventEmitter;
            var spy = sinon.spy();
            vagrant._run = function (command) {
                return { stdout: ee, stderr: { } };
            };
            vagrant.boxUpdate('ubuntu/trusty64', 'virtualbox')
                .once('progress', spy);
            ee.emit('data', dataStr);
            expect(spy.calledOnce).to.equal(true);
            expect(spy.getCall(0).args).to.deep.equal(['default', '97', '899k/s', '0:00:24']);
            done();
        });

        after(function (done) {
            vagrant._run = runFuncBeforeVagrant;
            done();
        });
    });
});
