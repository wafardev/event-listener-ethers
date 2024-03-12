const ethers = require("ethers");
require("dotenv").config();

const provider = new ethers.providers.WebSocketProvider(process.env.RPC_URL);

function playAlertSound() {
  const sound = require("sound-play");
  sound.play("SoundEffect.mp3");
}

async function main() {
  // Address which we want to listen for transactions
  const lockAddress = "0x231278eDd38B00B07fBd52120CEf685B9BaEBCC1";

  provider.on("block", async (blockNumber) => {
    const block = await provider.getBlockWithTransactions(blockNumber);
    for (const tx of block.transactions) {
      if (tx.to === lockAddress) {
        await checkTxHash(tx.hash, blockNumber);
      }
    }
  });
}

async function checkTxHash(txHash, blockNumber) {
  const tx = await provider.getTransaction(txHash);
  if (tx.data.startsWith("0xa35a96b8")) {
    const txReceipt = await provider.getTransactionReceipt(txHash);
    const poolAddress =
      "0x" + txReceipt.logs[txReceipt.logs.length - 1].data.slice(602, 642);
    console.log("New pool locked: ", poolAddress);
    playAlertSound();
    const unixTimestamp = parseInt(
      "0x" + txReceipt.logs[txReceipt.logs.length - 1].data.slice(440, 450)
    );

    // Convert to milliseconds
    const date = new Date(unixTimestamp * 1000);

    // Format the date
    const formattedDate = date.toLocaleString(); // Adjust locale and options as needed

    console.log("Locked until: ", formattedDate);
    const exactLog = await getLogs(poolAddress, blockNumber);

    await getLogData(exactLog[0]);
  }
}

async function getLogs(poolAddress, blockNumber) {
  return new Promise((resolve, reject) => {
    // Event signature related to the pool creation
    const eventSignature =
      "0x783cca1c0412dd0d695e784568c96da2e9c22ff989357a2e8b1d9b2b4e6b7118";
    // Uniswap V3 Factory address on Base Mainnet
    const uniswapV3Factory = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD";

    // Filter options
    const filter = {
      fromBlock: 0,
      toBlock: blockNumber,
      address: uniswapV3Factory,
      topics: [eventSignature, null, null, null],
    };

    // Fetch logs
    provider
      .getLogs(filter)
      .then((logs) => {
        const matchingLogs = logs.filter((log) => {
          if (log.data.includes(poolAddress.slice(2))) {
            return log;
          }
        });
        resolve(matchingLogs); // Resolve the promise with filtered logs
      })
      .catch((error) => {
        reject(error); // Reject the promise if there's an error
      });
  });
}

async function getLogData(log) {
  // WETH Address on Base Mainnet encoded and padded to 32 bytes
  const wethAddress =
    "0x0000000000000000000000004200000000000000000000000000000000000006";
  const topics = [log.topics[1], log.topics[2]];
  if (topics[0] === wethAddress) {
    console.log("Locked token: 0x" + topics[1].slice(26));
  } else if (topics[1] === wethAddress) {
    console.log("Locked token: 0x" + topics[0].slice(26));
  } else {
    console.log("Custom LP without WETH");
  }
}

main();
