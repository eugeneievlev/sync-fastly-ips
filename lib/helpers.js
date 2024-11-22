/**
 * Find which ips are new that need to be added
 */
module.exports.toAdd = function(current, latest) {
  return {
    ipv4: latest.ipv4.filter(x => !current.ipv4.includes(x)),
    ipv6: latest.ipv6.filter(x => !current.ipv6.includes(x))
  };
};

/**
 * Find which ips are new that need to be removed
 */
module.exports.toRemove = function(current, latest) {
  return {
    ipv4: current.ipv4.filter(x => !latest.ipv4.includes(x)),
    ipv6: current.ipv6.filter(x => !latest.ipv6.includes(x))
  };
};
