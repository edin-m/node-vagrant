var _ = require('lodash');

var MATCHERS = {
    download: /(\S+): Progress: (\d{1,2})% \(Rate: ([\dmgks\/]+), Estimated time remaining: ([\d\-:]+)\)/i
};

var SSH_CONFIG_MATCHERS = {
    host: /Host (\S+)$/mi,
    port: /Port (\S+)$/mi,
    hostname: /HostName (\S+)$/mi,
    user: /User (\S+)$/mi,
    private_key: /IdentityFile (\S+)$/mi,
};

var BOX_LIST_MATCHERS = {
    name: /^.*?(?=\s)/,
    provider: /[^(]+(?=,)/,
    version: /\S+(?=\))/,
};

/**
 *
 */
function downloadStatusParser(data) {
    var res = data.match(MATCHERS.download);
    if (res) {
        return {
            machine: res[1],
            progress: res[2],
            rate: res[3],
            remaining: res[4]
        };
    }
    return null;
}

/**
 *
 */
function statusParser(status_text) {
    var lines = status_text.split('\n').slice(2).reduce(function (prev, curr) {
        if (prev.length > 0 && prev[prev.length - 1].length === 0) {
            return prev;
        }

        prev.push(curr.trim());
        return prev;
    }, []);

    lines.pop();

    var re = /^(\S+)\s+(\S+\s?\S*)+\s+\((\S+)\)$/;

    var statuses = {};
    lines.forEach(function (line) {
        var res = line.match(re);
        statuses[res[1]] = {
            status: res[2],
            provider: res[3]
        };
    });
    return statuses;
}

/**
 *
 */
function globalStatusParser(data) {
    var lines = data.split('\n').slice(2).reduce(function (prev, curr) {
        if (prev.length > 0 && prev[prev.length - 1].length === 0) {
            return prev;
        }
        prev.push(curr.trim());
        return prev;
    }, []);

    lines.pop();
    if (/no active Vagrant environments/.test(lines[0])) {
        lines = [];
    }

    var re = /(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)/;
    lines = lines.map(function (line) {
        var res = line.match(re);
        return {
            id: res[1],
            name: res[2],
            provider: res[3],
            state: res[4],
            cwd: res[5]
        };
    });
    return lines;
}

/**
 *
 */
function sshConfigParser(out) {
    return out.split('\n\n')
        .filter(function (out) {
            return !_.isEmpty(out);
        })
        .map(function (out) {
            var config = {};
            for (var key in SSH_CONFIG_MATCHERS) {
                var match = out.match(SSH_CONFIG_MATCHERS[key]);
                if (match) {
                    config[key] = match[1];
                } else {
                    config[key] = null;
                    if (process.env.NODE_DEBUG) {
                        console.warn('warning ssh-config could not parse key', key);
                    }
                }
            }
            return config;
        });
}

/**
 *
 */
function boxListParser(out) {
    return out.split('\n')
        .filter(function (out) {
            return !_.isEmpty(out);
        })
        .map(function (out) {
            var box = {};
            for (var key in BOX_LIST_MATCHERS) {
                box[key] = out.match(BOX_LIST_MATCHERS[key])[0];
            }
            return box;
        });
}
/**
 *
 */
function boxListOutdatedParser(out) {
    return out.split('\n')
        .filter(function (out) {
            return !_.isEmpty(out);
        })
        .map(function (out) {
            var box = {};

            box.name = out.match(/[^'*\s]+(?=')/)[0];

            if (out.match(/is up to date/)) {
                box.status = 'up to date';
                box.currentVersion = out.match(/[^(]+(?=\))/)[0];
                box.latestVersion = out.match(/[^(]+(?=\))/)[0];
            } else if (out.match(/is outdated!/)) {
                box.status = 'out of date';
                box.currentVersion = (out.match(/(Current: ).+(?=. L)/)[0]).split(/\s/)[1];
                box.latestVersion = (out.match(/(Latest: ).+/)[0]).split(/\s/)[1];
            } else {
                box.status = 'unknown';
                box.currentVersion = null;
                box.latestVersion = null;
            }
            return box;
        });
}

/**
 *
 */
module.exports = {
    downloadStatusParser: downloadStatusParser,
    statusParser: statusParser,
    globalStatusParser: globalStatusParser,
    sshConfigParser: sshConfigParser,
    boxListParser: boxListParser,
    boxListOutdatedParser: boxListOutdatedParser
};
