

module.exports = function(status_text){
  var lines = status_text.split('\n').slice(2).reduce(function(prev, curr) {
      if(prev.length > 0 && prev[prev.length - 1].length === 0)
          return prev;

      prev.push(curr.trim());
      return prev;
  }, []);

  lines.pop();

  var re = /^(\S+)\s+(\S+\s?\S*)+\s+\((\S+)\)$/;

  var statuses = {};
  lines.forEach(function(line) {
      var res = line.match(re);
      statuses[res[1]] = {
          status: res[2],
          provider: res[3]
      };
  });
  return statuses;
}
