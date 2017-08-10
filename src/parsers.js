var MATCHERS = {
    download: /(\S+): Progress: (\d{1,2})% \(Rate: ([\dmgks\/]+), Estimated time remaining: ([\d\-:]+)\)/i
};

function parseDownloadStatus(data) {
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

module.exports = {
    parseDownloadStatus: parseDownloadStatus
};
