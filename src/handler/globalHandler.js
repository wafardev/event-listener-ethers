const { waitForVerifiedSourceCode, useTTFBotAPI } = require("../misc/apiCalls");
const { buildAndSendMessage } = require("../telegram/messageGenerator");
const {
  checkTxHashV2,
  checkLockedLP,
  checkBurnedSupply,
} = require("../main/uniswapV2");
const { getTokenInfoWithRetry, useHoneypotAPI } = require("../misc/apiCalls");
const { checkUNCXTxHashV3 } = require("../main/uniswapV3");
const {
  checkRenounced,
  waitForRenounce,
  checkClog,
} = require("../misc/rpcCalls");

async function checkVerified(baseTokenAddress, chain, message) {
  return await waitForVerifiedSourceCode(baseTokenAddress, chain, message);
}

async function checkUNCXLock(tx, provider, version, chain, message) {
  let poolAddress;
  let amount;

  if (version === 2) {
    ({ poolAddress, amount } = await checkTxHashV2(tx, chain, "UNCX", message));

    if (poolAddress) {
      const percentage = await checkLockedLP(
        poolAddress,
        provider,
        amount,
        message
      );
      if (percentage > 90) {
        await coreFunctionChecker(poolAddress, chain, provider, message);
      }
    }
  } else if (version === 3) {
    poolAddress = await checkUNCXTxHashV3(tx, provider, chain, message);

    if (poolAddress) {
      await coreFunctionChecker(poolAddress, chain, provider, message);
    }
  }
}

async function checkBurnedLPTx(tx, provider, chain, message) {
  message.chain = chain;
  console.log("New pool burned: ", tx.to);
  message.type = `🔥 <b>NEW V2 BURN ON ${chain.toUpperCase()} DETECTED</b> 🔥`;
  console.log(message.type);
  const burnedPercentage = await checkBurnedSupply(
    tx.to,
    tx.data,
    provider,
    message
  );
  if (burnedPercentage < 90) {
    console.log("Not enough LP tokens have been burned.");
    return;
  }
  await coreFunctionChecker(tx.to, chain, provider, message);
}

async function coreFunctionChecker(poolAddress, chain, provider, message) {
  setTimeout(async () => {
    const tokenAddress = await getTokenInfoWithRetry(
      poolAddress,
      chain,
      message
    );
    if (tokenAddress) {
      if (await waitForVerifiedSourceCode(tokenAddress, chain, message)) {
        const renouncedBool = await checkRenounced(
          tokenAddress,
          provider,
          message
        );
        const isSafe = await useTTFBotAPI(
          tokenAddress,
          renouncedBool,
          chain,
          message
        );

        if (isSafe === "renounce" || isSafe === "unverified") {
          if (isSafe === "unverified") {
            const { buyTax, sellTax } = await useHoneypotAPI(tokenAddress);
            message.buyTax = buyTax;
            message.sellTax = sellTax;
            if (
              !(await checkClog(tokenAddress, poolAddress, provider)) ||
              buyTax === 100 ||
              sellTax === 100
            ) {
              return;
            }
          }
          if (await waitForRenounce(tokenAddress, provider, message)) {
            if (
              await useTTFBotAPI(tokenAddress, renouncedBool, chain, message)
            ) {
              await buildAndSendMessage(message, chain);
            }
          }
        } else if (isSafe) {
          await buildAndSendMessage(message, chain);
        }
      }
    }
  }, 1000);
}

module.exports = {
  checkVerified,
  checkUNCXLock,
  checkBurnedLPTx,
  coreFunctionChecker,
};
