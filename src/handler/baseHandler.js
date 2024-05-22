const { checkLockedLP, checkTxHashV2 } = require("../main/uniswapV2");
const {
  getTokenInfoWithRetry,
  checkVerifiedSourceCode,
} = require("../misc/apiCalls");
const { buildAndSendMessage } = require("../telegram/messageGenerator");
const { checkVerifiedAndSafe } = require("./globalHandler");
const { checkRenounced, waitForRenounce } = require("../misc/rpcCalls");

async function checkOnlyMoonsLock(tx, provider, chain) {
  const { poolAddress, amount } = await checkTxHashV2(
    tx,
    chain,
    "ONLYMOONS",
    message
  );

  if (poolAddress && amount) {
    await checkLockedLP(poolAddress, provider, amount, message);
    setTimeout(async () => {
      const baseTokenAddress = await getTokenInfoWithRetry(
        poolAddress,
        chain,
        message
      );
      if (baseTokenAddress) {
        console.log("The token address is: ", baseTokenAddress);
        const isVerifiedAndSafe = await checkVerifiedAndSafe(
          baseTokenAddress,
          chain,
          message
        );
        if (isVerifiedAndSafe) {
          const isRenounced = await checkRenounced(
            baseTokenAddress,
            provider,
            message
          );
          if (isRenounced) {
            console.log(`The token (${baseTokenAddress}) is safe to buy`);
            const socialLinks = await checkVerifiedSourceCode(
              baseTokenAddress,
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
              `The token (${baseTokenAddress}) has not been renounced yet.`
            );
            await waitForRenounce(baseTokenAddress, provider, message);
            await buildAndSendMessage(message);
          }
        }
      }
    }, 10000);
  }
}

module.exports = { checkOnlyMoonsLock };
