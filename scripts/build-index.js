const fs = require('fs');
const path = require('path');

const BASE_PATH = 'build/contracts';
const DEPLOYMENTS_PATH = '.openzeppelin';
const CONTRACTS_DIR = path.resolve(__dirname, `../${BASE_PATH}`);
const bundle = [
  '^PaymentManager.json',
  '^PaymentManagerInterface.json'
];

const files = fs.readdirSync(CONTRACTS_DIR);
const bundleRegex = new RegExp(bundle.join('|'));
const importStatements = [];
const exportStatements = [];

files
  .filter((f) => f.match(bundleRegex))
  .map((f) => {
    const name = f.split('.')[0];
    importStatements.push(`const ${name}Contract = require('./${BASE_PATH}/${f}');`);
    exportStatements.push(`  ${name}Contract: ${name}Contract,`);
  });

const addresses = [];
const deploymentsInfo = [
  {
    contract: 'PaymentManager',
    config: 'ropsten-PaymentManager.json'
  }
];
deploymentsInfo
  .map(info => {
    const network = info.config.split('-')[0];
    importStatements.push(`const ${network}${info.contract}Config = require('./${DEPLOYMENTS_PATH}/${info.config}');`);
    addresses.push(`    ${info.contract}: {\n      ${network}: ${network}${info.contract}Config.contract.proxy\n    }`);
  });
exportStatements.push(`  addresses: {\n${addresses.join('\n')}\n  }`);

const result = `${importStatements.join('\n')}

module.exports = {
${exportStatements.join('\n')}
};
`;

console.log(result);
