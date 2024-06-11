const ethers = require("ethers");
const { checkUNCXLock, checkBurnedLPTx } = require("../handler/globalHandler");
const { checkOnlyMoonsLock } = require("../handler/baseHandler");
const { checkTEAMV2Lock } = require("../handler/ethHandler");
const { checkBurnedLP } = require("./uniswapV2");
require("dotenv").config();

// Log when the script starts
console.log("Script started...");

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("exit", (code) => {
  if (code === 0) {
    console.log("Process exited peacefully.");
  } else {
    console.error(`Process exited with code: ${code}`);
  }
});

let chainName;
let lockUNCXV3Address;
let lockUNCXV2Address;
let teamV2Address;
let onlyMoonV2Address;
let rpc_url;

if (process.argv[2] === "base") {
  chainName = "base";
  lockUNCXV2Address = "0xc4E637D37113192F4F1F060DaEbD7758De7F4131";
  lockUNCXV3Address = "0x231278eDd38B00B07fBd52120CEf685B9BaEBCC1";
  teamV2Address = "0x4F0Fd563BE89ec8C3e7D595bf3639128C0a7C33A";
  onlyMoonV2Address = "0x77110f67C0EF3c98c43570BADe06046eF6549876";
  rpc_url = process.env.BASE_RPC_URL;
} else if (process.argv[2] === "eth") {
  chainName = "ethereum";
  lockUNCXV2Address = "0x663A5C229c09b049E36dCc11a9B0d4a8Eb9db214";
  lockUNCXV3Address = "0xFD235968e65B0990584585763f837A5b5330e6DE";
  teamV2Address = "0xE2fE530C047f2d85298b07D9333C05737f1435fB";
  onlyMoonV2Address = "0x7BF2f06D65b5C9f146ea79a4eCC7C7cdFC01B613";
  rpc_url = process.env.ETH_RPC_URL;
} else if (process.argv[2] === "cronos") {
  chainName = "cronos";
  lockUNCXV2Address = undefined;
  lockUNCXV3Address = undefined;
  teamV2Address = undefined;
  onlyMoonV2Address = undefined;
  rpc_url = process.env.CRONOS_RPC_URL;
} else {
  console.log(
    "Please provide a chain name as an argument. Either 'base', 'eth', or 'cronos'"
  );
  process.exit(1);
}

let provider;

function createProvider() {
  provider = new ethers.providers.WebSocketProvider(rpc_url);

  provider.on("block", async (blockNumber) => {
    await handleBlock(blockNumber);
  });

  provider._websocket.on("close", () => {
    console.error("WebSocket closed. Reconnecting...");
    setTimeout(createProvider, 1000);
  });

  provider._websocket.on("error", (err) => {
    console.error("WebSocket error:", err.message);
    provider._websocket.close();
  });

  provider._websocket.on("open", () => {
    console.log("WebSocket connection established.");
  });
}

async function handleBlock(blockNumber) {
  console.log("Block Number:", blockNumber);
  const block = await retryableGetBlockWithTransactions(provider, blockNumber);
  for (const tx of block.transactions) {
    let message = {};
    try {
      if (tx.to === lockUNCXV2Address) {
        await checkUNCXLock(tx, provider, 2, chainName, message);
      } else if (tx.to === lockUNCXV3Address) {
        await checkUNCXLock(tx, provider, 3, chainName, message);
      } else if (tx.to === teamV2Address) {
        await checkTEAMV2Lock(tx, provider, chainName, message);
      } else if (tx.to === onlyMoonV2Address) {
        await checkOnlyMoonsLock(tx, provider, chainName, message);
      } else if (await checkBurnedLP(tx, provider)) {
        await checkBurnedLPTx(tx, provider, chainName, message);
      }
    } catch (e) {
      console.error(`Error in handleBlock at block ${blockNumber}: ${e}`);
    }
  }
}

async function retryableGetBlockWithTransactions(
  provider,
  blockNumber,
  retries = 3,
  delay = 1000
) {
  for (let i = 0; i < retries; i++) {
    try {
      return await provider.getBlockWithTransactions(blockNumber);
    } catch (error) {
      console.error(
        `Error fetching block ${blockNumber} (attempt ${i + 1}):`,
        error.message
      );
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}

async function main() {
  createProvider();
}

// Uncomment this to run normally
main();

// Uncomment this to debug a specific block
/*const debugBlockNumber = 15659205;
handleBlock(debugBlockNumber)
  .then(() => console.log(`Finished processing block ${debugBlockNumber}`))
  .catch((error) =>
    console.error(`Error processing block ${debugBlockNumber}:`, error)
  );*/
