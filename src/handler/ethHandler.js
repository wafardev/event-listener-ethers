const { checkTxHashV2 } = require("../main/uniswapV2");
const { checkLockedLP } = require("../main/uniswapV2");
const { coreFunctionChecker } = require("../handler/globalHandler");

async function checkTEAMV2Lock(tx, provider, chain, message) {
  const { poolAddress, amount } = await checkTxHashV2(
    tx,
    chain,
    "TEAM",
    message
  );

  if (poolAddress && amount) {
    await checkLockedLP(poolAddress, provider, amount, message);
    await coreFunctionChecker(poolAddress, chain, provider, message);
  }
}

module.exports = { checkTEAMV2Lock };
