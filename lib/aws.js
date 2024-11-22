const AWS = require("aws-sdk");

AWS.config.update({ region: process.env.REGION });

const ec2 = new AWS.EC2({ apiVersion: "2016-11-15" });

module.exports.getIpsFromSg = function(sg) {
  let permissions = sg.IpPermissions;

  if (Array.isArray(permissions) && permissions.length === 0) {
    return { ipv4: [], ipv6: [] };
  }

  let ipv4 = permissions[0]?.IpRanges.map(rule => rule.CidrIp) || [];
  let ipv6 = permissions[0]?.Ipv6Ranges.map(rule => rule.CidrIpv6) || [];

  return { ipv4, ipv6 };
};

module.exports.addSgRules = function(sg, ips) {
  if (!ips || (!ips.ipv4.length && !ips.ipv6.length)) {
    return;
  }

  let ipv4Ranges = (ips.ipv4 || []).map(ip => {
    return { CidrIp: ip };
  });

  let ipv6Ranges = (ips.ipv6 || []).map(ip => {
    return { CidrIpv6: ip };
  });

  let permissions = [];
  if (ipv4Ranges.length > 0) {
    permissions.push({
      IpProtocol: "tcp",
      FromPort: 80,
      ToPort: 80,
      IpRanges: ipv4Ranges
    },
    {
      IpProtocol: "tcp",
      FromPort: 443,
      ToPort: 443,
      IpRanges: ipv4Ranges
    });
  }
  if (ipv6Ranges.length > 0) {
    permissions.push({
      IpProtocol: "tcp",
      FromPort: 80,
      ToPort: 80,
      Ipv6Ranges: ipv6Ranges
    },
    {
      IpProtocol: "tcp",
      FromPort: 443,
      ToPort: 443,
      Ipv6Ranges: ipv6Ranges
    });
  }

  return ec2
    .authorizeSecurityGroupIngress({
      GroupId: sg.GroupId,
      IpPermissions: permissions
    })
    .promise();
};

module.exports.removeSgRules = function(sg, ips) {
  if (!ips || (!ips.ipv4.length && !ips.ipv6.length)) {
    return;
  }

  let ipv4Ranges = (ips.ipv4 || []).map(ip => {
    return { CidrIp: ip };
  });

  let ipv6Ranges = (ips.ipv6 || []).map(ip => {
    return { CidrIpv6: ip };
  });

  let permissions = [];
  if (ipv4Ranges.length > 0) {
    permissions.push({
      IpProtocol: "tcp",
      FromPort: 80,
      ToPort: 80,
      IpRanges: ipv4Ranges
    },
    {
      IpProtocol: "tcp",
      FromPort: 443,
      ToPort: 443,
      IpRanges: ipv4Ranges
    });
  }
  if (ipv6Ranges.length > 0) {
    permissions.push({
      IpProtocol: "tcp",
      FromPort: 80,
      ToPort: 80,
      Ipv6Ranges: ipv6Ranges
    },
    {
      IpProtocol: "tcp",
      FromPort: 443,
      ToPort: 443,
      Ipv6Ranges: ipv6Ranges
    });
  }

  return ec2
    .revokeSecurityGroupIngress({
      GroupId: sg.GroupId,
      IpPermissions: permissions
    })
    .promise();
};

module.exports.upsertSg = async function(vpcId) {
  // Does SG already exist?
  const groupName = "external-fastly-ips";

  try {
    let sg = await this.findSg(vpcId, groupName);

    if (Array.isArray(sg.SecurityGroups) && sg.SecurityGroups.length > 0) {
      return sg.SecurityGroups[0];
    }
  } catch (error) {
    console.log(error);
  }

  try {
    await ec2
      .createSecurityGroup({
        Description: "Public Fastly IPs",
        GroupName: groupName,
        VpcId: vpcId
      })
      .promise();

    let sg = await this.findSg(vpcId, groupName);

    return sg.SecurityGroups[0];
  } catch (error) {
    console.log(error);
  }
};

module.exports.findSg = function(vpcId, groupName) {
  return ec2
    .describeSecurityGroups({
      Filters: [
        {
          Name: "vpc-id",
          Values: [vpcId]
        },
        {
          Name: "group-name",
          Values: [groupName]
        }
      ]
    })
    .promise();
};
