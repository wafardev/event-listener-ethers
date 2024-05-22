const ethers = require("ethers");
const { checkUNCXLock, checkBurnedLPTx } = require("../handler/globalHandler");
const { checkOnlyMoonsLock } = require("../handler/baseHandler");
const { checkTEAMV2Lock } = require("../handler/ethHandler");
const { checkBurnedLP } = require("./uniswapV2");
require("dotenv").config();

let chainName;
let lockUNCXV3Address;
let lockUNCXV2Address;
let teamV2Address;
let onlyMoonV2Address;
let chainCounter = 0;
let rpc_url;

if (process.argv[2] === "base") {
  chainName = "base";
  lockUNCXV3Address = "0x231278eDd38B00B07fBd52120CEf685B9BaEBCC1";
  lockUNCXV2Address = "0xc4E637D37113192F4F1F060DaEbD7758De7F4131";
  teamV2Address = "0x4F0Fd563BE89ec8C3e7D595bf3639128C0a7C33A";
  onlyMoonV2Address = "0x77110f67C0EF3c98c43570BADe06046eF6549876";
  rpc_url = process.env.BASE_RPC_URL;
} else if (process.argv[2] === "eth") {
  chainName = "ethereum";
  chainCounter = 2;
  lockUNCXV2Address = "0x663A5C229c09b049E36dCc11a9B0d4a8Eb9db214";
  lockUNCXV3Address = "0xFD235968e65B0990584585763f837A5b5330e6DE";
  teamV2Address = "0xE2fE530C047f2d85298b07D9333C05737f1435fB";
  onlyMoonV2Address = undefined;
  rpc_url = process.env.ETH_RPC_URL;
} else {
  console.log(
    "Please proide a chain name as an argument. Either 'base' or 'eth'"
  );
  process.exit(1);
}

const provider = new ethers.providers.WebSocketProvider(rpc_url);

async function main() {
  provider.on("block", async (blockNumber) => {
    await handleBlock(blockNumber);
  });
}

async function handleBlock(blockNumber) {
  console.log("Block Number:", blockNumber);
  const block = await provider.getBlockWithTransactions(blockNumber);
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
      console.log(e.message);
    }
  }
}

main();
//handleBlock(14802833);
