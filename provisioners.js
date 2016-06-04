var fs = require('fs');
var _ = require('lodash');
var path = require('path');

function DockerAdapter() {
    var tplFile = fs.readFileSync(path.join(__dirname, 'templates/docker.tpl')).toString();
    var compiled = _.template(tplFile);
    this.createTemplate = function (provisionerConfig) {
        return compiled({
            provisionerAlias: provisionerConfig.alias || provisionerConfig.name,
            settings: provisionerConfig.config
        });
    };
}

function GenericAdapter() {
    this.createTemplate = function (provisionerConfig) {
        return '';
    };
}

var ProvisionAdapters = {
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
    return ProvisionAdapters.get(provisionerConfig.type).createTemplate(provisionerConfig);
};

module.exports.get = function (type) {
    return ProvisionAdapters.get(type);
};

module.exports.addAdapter = function (type, adapter, force) {
    force = force || false;
    if (force) {
        ProvisionAdapters.provisionerAdapter[type] = adapter;
        return true;
    }
    if (!force && !!ProvisionAdapters.provisionerAdapter[type]) {
        return false;
    }
    ProvisionAdapters.provisionerAdapter[type] = adapter;
};
