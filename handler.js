"use strict";

const fastly = require("./lib/fastly");
const aws = require("./lib/aws");
const helpers = require("./lib/helpers");

module.exports.sync = async event => {
  const vpcId = process.env.VPC_ID;

  // Create or grab the security group
  let sg = await aws.upsertSg(vpcId);

  // Get list of current fastly IPs
  let ips = await fastly.getFastlyIps();

  // Flatten current list of IPs
  let currentIps = aws.getIpsFromSg(sg);

  // Get list of rules to add
  let newIps = helpers.toAdd(currentIps, ips);
  console.log(`New IPs being added: ${JSON.stringify(newIps)}`);
  await aws.addSgRules(sg, newIps);

  // Get list of rules to delete
  let oldIps = helpers.toRemove(currentIps, ips);
  console.log(`Old IPs being removed: ${JSON.stringify(oldIps)}`);
  await aws.removeSgRules(sg, oldIps);

  return {
    message: "Security group updated",
    event
  };
};
