var fs = require('fs');
var _ = require('lodash');
var path = require('path');

/**
 * Each provisioner implements .createTemplate(provisionerConfig) which returns string which is text that will be
 * injected into each provisioner's config in Vagrantfile
 */

function CommandsAdapter() {
    var tplFile = fs.readFileSync(path.join(__dirname, 'templates/commands.tpl')).toString();
    var compiled = _.template(tplFile);
    this.createTemplate = function (provisionerConfig) {
        return compiled({
            config: provisionerConfig,
            commands: provisionerConfig.config.commands
        });
    };
}

function NameValueAdapter() {
    var tplFile = fs.readFileSync(path.join(__dirname, 'templates/name-value.tpl')).toString();
    var compiled = _.template(tplFile);
    this.createTemplate = function (provisionerConfig) {
        return compiled({
            rootConfig: provisionerConfig
        });
    };
}

module.exports = {
    _adapters: {},
    createTemplate: function (provisionerConfig) {
        /**
         * There are two types of provisioner adapters: commands and name-value
         * Assume commands if there is .config.commands array
         */
        var provisionerAdaterType = 'name-value';
        if (provisionerConfig.config && provisionerConfig.config.commands && Array.isArray(provisionerConfig.config.commands)) {
            provisionerAdaterType = 'commands';
        }
        return this._get(provisionerAdaterType).createTemplate(provisionerConfig);
    },
    _get: function (type) {
        if (!this._adapters[type]) {
            this._adapters[type] = this._createBuiltInAdapter(type);
        }
        return this._adapters[type];
    },
    _createBuiltInAdapter: function (type) {
        if (type === 'commands') {
            return new CommandsAdapter();
        }
        return new NameValueAdapter();
    },
    removeAdapter: function (type) {
        if (type in this._adapters) {
            delete this._adapters[type];
        }
    },
    addAdapter: function (type, adapter, force) {
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
