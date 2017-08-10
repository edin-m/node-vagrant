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
                config[key] = out.match(SSH_CONFIG_MATCHERS[key])[1];
            }
            return config;
        });
}

/**
 *
 */
module.exports = {
    downloadStatusParser: downloadStatusParser,
    statusParser: statusParser,
    globalStatusParser: globalStatusParser,
    sshConfigParser: sshConfigParser
};
