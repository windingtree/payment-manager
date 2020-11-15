const contract = require('@truffle/contract');
const WETHJson = require('canonical-weth/build/contracts/WETH9.json');
const WETH = contract(WETHJson);
WETH.setProvider(web3.currentProvider);
const ERC20 = artifacts.require('ERC20Configurable');

/**
 * Deploys a WETH token
 * @param {String} from Owner address
 */
module.exports.setupWeth = from => WETH.new(
  {
    from
  }
);

/**
 * Deploys set of tokens from config
 * @param {Array[Object]} config Tokens config
 * @param {String} from Supply owner address
  // Config example
  [
    {
      symbol: 'USDC',
      decimals: 6,
      supply: '1000000000000'
    },
    {
      symbol: 'WETH',
      decimals: 18,
      supply: '1000000000000000000000000'
    },
    {
      symbol: 'LIF',
      decimals: 18,
      supply: '1000000000000000000000000'
    }
  ]
 */
module.exports.setupTokens = async (config, from) => Object.fromEntries(
  await Promise.all(
    config.map(async t => {
      const token = await ERC20.new(
        t.symbol,
        t.symbol,
        t.decimals,
        t.supply,
        {
          from
        }
      );
      return [t.symbol, token];
    })
  )
);
