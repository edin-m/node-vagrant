var expect = require('chai').expect;
var provisionerAdapters = require('../provisioners');

function trimAndRemoveEmpty(result) {
    return result.split(/\n|\r/).map(function(item) {
        return item.trim();
    }).filter(function(item) {
        return item.length > 0;
    });
}

describe('Test provisioner adapters', function() {
    it('Generic name value adapter', function(done) {
        done();
    });
    describe('Docker adapter', function() {
        it('Docker build_image, pull_images', function(done) {
            var provisionerConfig = {
                name: 'docker1',
                type: 'docker',
                config: {
                    build_image: "'/vagrant/app'",
                    pull_images: "'ubuntu'"
                }
            };
            var result = provisionerAdapters.get('docker').createTemplate(provisionerConfig);
            var lines = trimAndRemoveEmpty(result);
            expect(lines[0]).to.match(/build_image/);
            expect(lines[0]).to.match(/'\/vagrant\/app'/);
            expect(lines[1]).to.match(/pull_images/);
            expect(lines[1]).to.match(/'ubuntu'/);
            done();
        });
        it('Docker images array: empty, one, multiple', function(done) {
            var provisionerConfig = {
                name: 'docker1',
                type: 'docker',
                config: {
                    images: []
                }
            };
            var result = provisionerAdapters.get('docker').createTemplate(provisionerConfig);
            var lines = trimAndRemoveEmpty(result);
            expect(lines.length).to.equal(0);
            provisionerConfig.config.images = ['ubuntu'];
            result = provisionerAdapters.get('docker').createTemplate(provisionerConfig);
            lines = trimAndRemoveEmpty(result);
            expect(lines[0]).to.match(/images:/);
            expect(lines[0]).to.match(/\['ubuntu'\]/);
            provisionerConfig.config.images = ['ubuntu', 'gentoo', 'debian'];
            result = provisionerAdapters.get('docker').createTemplate(provisionerConfig);
            lines = trimAndRemoveEmpty(result);
            expect(lines[0]).to.match(/images:/);
            expect(lines[0]).to.match(/\['ubuntu', 'gentoo', 'debian'\]/);
            done();
        });
    });
    it.skip('Generic name/value adapter', function(done) {
        done();
    });
    it.skip('Custom adapter', function(done) {
        done();
    });
});