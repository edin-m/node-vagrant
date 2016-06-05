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

module.exports = {
    _adapters: {},
    createTemplate: function(provisionerConfig) {
        return this.get(provisionerConfig.type).createTemplate(provisionerConfig);
    },
    get: function(type) {
        if (!this._adapters[type]) {
            this._adapters[type] = this._createBuiltInAdapter(type);
        }
        return this._adapters[type];
    },
    _createBuiltInAdapter: function (type) {
        if (type === 'docker') {
            return new DockerAdapter();
        }
        return new GenericAdapter();
    },
    removeAdapter: function(type) {
        if (type in this._adapters) {
            delete this._adapters[type];
        }
    },
    addAdapter: function(type, adapter, force) {
        force = force || false;
        if (force) {
            this._adapters[type] = adapter;
            return true;
        }
        if (!force && !!this._adapters[type]) {
            return false;
        }
        this._adapters[type] = adapter;
    }
};

