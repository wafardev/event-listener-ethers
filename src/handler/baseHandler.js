const { checkLockedLP, checkTxHashV2 } = require("../main/uniswapV2");
const { coreFunctionChecker } = require("./globalHandler");

async function checkOnlyMoonsLock(tx, provider, chain, message) {
  const { poolAddress, amount } = await checkTxHashV2(
    tx,
    chain,
    "ONLYMOONS",
    message
  );

  if (poolAddress && amount) {
    await checkLockedLP(poolAddress, provider, amount, message);
    await coreFunctionChecker(poolAddress, chain, provider, message);
  }
}

module.exports = { checkOnlyMoonsLock };
