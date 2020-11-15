const contract = require('@truffle/contract');
const UniswapV2FactoryJson = require('@uniswap/v2-core/build/UniswapV2Factory.json');
const UniswapV2Router02Json = require('@uniswap/v2-periphery/build/UniswapV2Router02.json');
const UniswapV2Factory = contract(UniswapV2FactoryJson);
const UniswapV2Router02 = contract(UniswapV2Router02Json);
UniswapV2Factory.setProvider(web3.currentProvider);
UniswapV2Router02.setProvider(web3.currentProvider);

module.exports.setupUniswap = async (wethAddress, from) => {
  const factory = await UniswapV2Factory.new(
    from,
    {
      from
    }
  );
  // const pairs = await Promise.all(
  //   pairsConfig.map(async p => {
  //     const pair = await factory
  //       .createPair(
  //         p.tokens[0],
  //         p.tokens[1],
  //         {
  //           from
  //         }
  //       );
  //     const { pair: address, token0, token1 } = pair.logs[0].args;
  //     return [p.name, { address, token0, token1 }];
  //   })
  // );
  const router = await UniswapV2Router02.new(
    factory.address,
    wethAddress,
    {
      from
    }
  );
  return {
    factory,
    router,
    // pairs: Object.fromEntries(pairs)
  };
};
