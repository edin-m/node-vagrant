var fs = require('fs');
var _ = require('lodash');
var path = require('path');

function DockerAdapter() {
    var tplFile = fs.readFileSync(path.join(__dirname, 'templates/docker.tpl')).toString();
    var compiled = _.template(tplFile);
    this.createTemplate = function (provisionerConfig) {
        return compiled({
            provisionerAlias: provisionerConfig.alias,
            settings: provisionerConfig.config
        });
    };
}

function GenericAdapter() {
    this.createTemplate = function (provisionerConfig) {
        return '';
    };
}

var provisionAdapters = {
    provisionerAdapter: {},
    get: function(type) {
        if (!this.provisionerAdapter[type]) {
            this.provisionerAdapter[type] = this.createProvisionerAdapter(type);
        }
        return this.provisionerAdapter[type];
    },
    createProvisionerAdapter: function (type) {
        if (type === 'docker') {
            return new DockerAdapter();
        }
        return new GenericAdapter();
    }
};

module.exports.createTemplate = function (provisionerConfig) {
    return provisionAdapters.get(provisionerConfig.type).createTemplate(provisionerConfig);
};

module.exports.get = function (type) {
    return provisionAdapters.get(type);
};

module.exports.addAdapter = function (type, adapter, force) {
    force = force || false;
    if (force) {
        provisionAdapters.provisionerAdapter[type] = adapter;
        return true;
    }
    if (!force && !!provisionAdapters.provisionerAdapter[type]) {
        return false;
    }
    provisionAdapters.provisionerAdapter[type] = adapter;
};
