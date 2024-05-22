const {
  checkVerifiedSourceCode,
  checkContractSafety,
} = require("../misc/apiCalls");
const { buildAndSendMessage } = require("../telegram/messageGenerator");
const {
  checkUNCXTxHashV2,
  checkTxHashV2,
  checkLockedLP,
  checkBurnedSupply,
} = require("../main/uniswapV2");
const { getTokenInfoWithRetry } = require("../misc/apiCalls");
const { checkUNCXTxHashV3 } = require("../main/uniswapV3");
const { checkRenounced, waitForRenounce } = require("../misc/rpcCalls");

async function checkVerifiedAndSafe(baseTokenAddress, chain, message) {
  return (
    (await checkVerifiedSourceCode(baseTokenAddress, chain, message)) &&
    (await checkContractSafety(baseTokenAddress, chain, message))
  );
}

async function checkUNCXLock(tx, provider, version, chain, message) {
  let poolAddress;
  let amount;

  if (version === 2) {
    ({ poolAddress, amount } = await checkTxHashV2(tx, chain, "UNCX", message));
  } else if (version === 3) {
    poolAddress = await checkUNCXTxHashV3(tx, provider, chain, message);
  }

  if (poolAddress) {
    if (amount) {
      await checkLockedLP(poolAddress, provider, amount, message);
    }
    await coreFunctionChecker(tx, chain, provider, message);
  }
}

async function checkBurnedLPTx(tx, provider, chain, message) {
  message.chain = chain;
  message.type = `🔥 NEW V2 BURN ON ${chain.toUpperCase()} DETECTED 🔥`;
  console.log("Uniswap V2 pair burn transaction detected");
  const burnedPercentage = await checkBurnedSupply(
    tx.to,
    tx.data,
    provider,
    message
  );
  if (burnedPercentage < 50) {
    console.log("Not enough LP tokens have been burned.");
    return;
  }
  await coreFunctionChecker(tx, chain, provider, message);
}

async function coreFunctionChecker(tx, chain, provider, message) {
  setTimeout(async () => {
    const tokenAddress = await getTokenInfoWithRetry(tx.to, chain, message);
    if (tokenAddress) {
      const isVerifiedAndSafe = await checkVerifiedAndSafe(
        tokenAddress,
        chain,
        message
      );
      if (isVerifiedAndSafe) {
        const isRenounced = await checkRenounced(
          tokenAddress,
          provider,
          message
        );
        if (isRenounced) {
          console.log(`The token (${tokenAddress}) is safe to buy`);
          const socialLinks = await checkVerifiedSourceCode(
            tokenAddress,
            chain,
            message,
            true
          );
          if (typeof socialLinks === "object" && socialLinks !== null) {
            console.log("Social links:");
            console.log(socialLinks);
          }
          await buildAndSendMessage(message);
        } else {
          console.log(
            `The token (${tokenAddress}) has not been renounced yet.`
          );
          await waitForRenounce(tokenAddress, provider, message);
          await buildAndSendMessage(message);
        }
      }
    }
  }, 10000);
}

module.exports = {
  checkVerifiedAndSafe,
  checkUNCXLock,
  checkBurnedLPTx,
  coreFunctionChecker,
};
