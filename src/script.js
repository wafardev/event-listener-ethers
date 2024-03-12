const ethers = require("ethers");
require("dotenv").config();

const provider = new ethers.providers.WebSocketProvider(process.env.RPC_URL);

function playAlertSound() {
  const sound = require("sound-play");
  sound.play("SoundEffect.mp3");
}

function timestampToDate(unixTimestamp) {
  // Convert to milliseconds
  const date = new Date(unixTimestamp * 1000);

  // Format the date
  const formattedDate = date.toLocaleString(); // Adjust locale and options as needed

  console.log("Locked until: ", formattedDate);
}

async function main() {
  // Addresses which we want to listen for transactions
  const lockV2Address = "0x77110f67C0EF3c98c43570BADe06046eF6549876";
  const lockV3Address = "0x231278eDd38B00B07fBd52120CEf685B9BaEBCC1";

  provider.on("block", async (blockNumber) => {
    const block = await provider.getBlockWithTransactions(blockNumber);
    for (const tx of block.transactions) {
      if (tx.to === lockV2Address) {
        await checkTxHashV2(tx.hash);
      }
      if (tx.to === lockV3Address) {
        await checkTxHashV3(tx.hash, blockNumber);
      }
    }
  });

  /*const blockNumber = 11724322;
  const block = await provider.getBlockWithTransactions(blockNumber);
  for (const tx of block.transactions) {
    if (tx.to === lockV3Address) {
      await checkTxHashV3(tx.hash, blockNumber);
    }
    if (tx.to === lockV2Address) {
      await checkTxHashV2(tx.hash);
    }
  }*/
}

async function checkTxHashV2(txHash) {
  const tx = await provider.getTransaction(txHash);
  // Check if the transaction is a lock method
  if (tx.data.startsWith("0xcde7cced")) {
    const txReceipt = await provider.getTransactionReceipt(txHash);
    const timestamp = parseInt(
      "0x" + txReceipt.logs[txReceipt.logs.length - 1].data.slice(-10)
    );
    timestampToDate(timestamp);
    const topics = txReceipt.logs[txReceipt.logs.length - 1].topics;
    const tokenAddresses = topics.slice(2);
    await getLogData(tokenAddresses);
  }
}

async function checkTxHashV3(txHash, blockNumber) {
  const tx = await provider.getTransaction(txHash);
  // Check if the transaction is a lock method
  if (tx.data.startsWith("0xa35a96b8")) {
    const txReceipt = await provider.getTransactionReceipt(txHash);
    const poolAddress =
      "0x" + txReceipt.logs[txReceipt.logs.length - 1].data.slice(602, 642);
    console.log("New pool locked: ", poolAddress);
    playAlertSound();
    const unixTimestamp = parseInt(
      "0x" + txReceipt.logs[txReceipt.logs.length - 1].data.slice(440, 450)
    );

    timestampToDate(unixTimestamp);

    const exactLog = await getLogs(poolAddress, blockNumber);

    const topics = [exactLog[0].topics[1], exactLog[0].topics[2]];
    await getLogData(topics);
  }
}

async function getLogs(poolAddress, blockNumber) {
  return new Promise((resolve, reject) => {
    // Event signature related to the pool creation
    const eventSignature =
      "0x783cca1c0412dd0d695e784568c96da2e9c22ff989357a2e8b1d9b2b4e6b7118";
    // Uniswap V3 Factory address on Base Mainnet
    const uniswapV3Factory = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD";

    // Filter oƒptions
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

async function getLogData(topics) {
  // WETH Address on Base Mainnet encoded and padded to 32 bytes
  const wethAddress =
    "0x0000000000000000000000004200000000000000000000000000000000000006";
  if (topics[0] === wethAddress) {
    console.log("Locked token: 0x" + topics[1].slice(26));
  } else if (topics[1] === wethAddress) {
    console.log("Locked token: 0x" + topics[0].slice(26));
  } else {
    console.log("Custom LP without WETH");
  }
}

main();
