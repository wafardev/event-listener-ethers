const { timestampToDate } = require("../misc/misc.js");

async function checkUNCXTxHashV3(tx, provider, chain, message) {
  if (tx.data.startsWith("0xa35a96b8")) {
    const txReceipt = await provider.getTransactionReceipt(tx.hash);
    if (txReceipt.logs.length === 0) {
      return;
    }
    const poolAddress =
      "0x" + txReceipt.logs[txReceipt.logs.length - 1].data.slice(602, 642);
    message.chain = chain;
    message.type = `🔒 NEW V3 POOL LOCKED ON ${chain.toUpperCase()} 🔒`;
    console.log("New pool locked: ", poolAddress);
    const unixTimestamp = parseInt(
      "0x" + txReceipt.logs[txReceipt.logs.length - 1].data.slice(440, 450)
    );

    timestampToDate(unixTimestamp, message);

    return poolAddress;
  }
}

module.exports = { checkUNCXTxHashV3 };
