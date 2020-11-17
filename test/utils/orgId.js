const contract = require('@truffle/contract');
const OrgIdJson = require('@windingtree/org.id/build/contracts/OrgId.json');
const OrgId = contract(OrgIdJson);
OrgId.setProvider(web3.currentProvider);

/**
 * Generates random byte32 keccak hash
 */
const generateHashHelper = () => web3.utils.keccak256(Math.random().toString());
module.exports.generateHashHelper = generateHashHelper;

// Setup ORGiD instance with organization
module.exports.setupOrgId = async from => {
  const orgId = await OrgId.new({
    from
  });
  await orgId.initialize({
    from
  });
  const receipt = await orgId.createOrganization(
    generateHashHelper(),
    generateHashHelper(),
    'uri',
    '',
    '',
    {
      from
    }
  );
  const receipt2 = await orgId.createOrganization(
    generateHashHelper(),
    generateHashHelper(),
    'uri',
    '',
    '',
    {
      from
    }
  );
  await orgId.toggleActiveState(
    receipt2.logs[0].args.orgId,
    {
      from
    }
  );

  return {
    ...orgId,
    organizations: [
      receipt.logs[0].args.orgId,
      receipt2.logs[0].args.orgId
    ]
  };
};
