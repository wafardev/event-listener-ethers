const { ethers } = require("ethers");
const { timestampToDate } = require("../misc/misc");

function checkReceiver(hexData) {
  const deadWalletArray = [
    "000000000000000000000000000000000000dead",
    "0000000000000000000000000000000000000001",
    "0000000000000000000000000000000000000000",
  ];
  let bool = false;
  const byteData = hexData.slice(34, 74);
  if (deadWalletArray.includes(byteData)) {
    bool = true;
  }
  return bool;
}

async function checkUniswapV2Pair(contractAddress, provider) {
  let bool = false;
  const uniswapV2ABI = [
    "function name() external pure returns (string memory)",
  ];

  const contract = new ethers.Contract(contractAddress, uniswapV2ABI, provider);

  const name = await contract.name();

  if (name === "Uniswap V2" || name === "SushiSwap LP Token") {
    bool = true;
  }
  return bool;
}

async function checkBurnedLP(tx, provider) {
  return (
    tx.data.startsWith("0xa9059cbb") &&
    checkReceiver(tx.data) &&
    (await checkUniswapV2Pair(tx.to, provider))
  );
}

async function checkBurnedSupply(contractAddress, hexData, provider, message) {
  const uniswapV2ABI = ["function totalSupply() external view returns (uint)"];
  const uniswapV2Pair = new ethers.Contract(
    contractAddress,
    uniswapV2ABI,
    provider
  );
  const totalSupply = await uniswapV2Pair.totalSupply();

  const burnedAmount = BigInt(`0x${hexData.slice(74)}`);

  const burnedPercentage = (
    (parseFloat(burnedAmount.toString()) / parseFloat(totalSupply.toString())) *
    100
  ).toFixed(2);
  message.amount = `Burned Percentage: ${burnedPercentage.toString()}%`;
  console.log("Burned Percentage:", burnedPercentage.toString());

  return burnedPercentage;
}

async function checkTxHashV2(tx, chain, lockType, message) {
  let methodHash;
  let hexDataNumbers = [138, 202, 74, 138];

  if (chain === "ethereum" && lockType === "UNCX") {
    methodHash = "0x8af416f6";
  } else if (chain === "base" && lockType === "UNCX") {
    methodHash = "0xeb35ed62";
  } else if (lockType === "TEAM") {
    methodHash = "0x5af06fed";
    hexDataNumbers = [202, 266, 138, 202];
  } else if (lockType === "ONLYMOONS") {
    methodHash = "0xcde7cced";
  }

  if (tx.data.startsWith(methodHash)) {
    const poolAddress = "0x" + tx.data.slice(34, 74);
    message.chain = chain;
    console.log("New pool locked: ", poolAddress);
    message.type = `🔒 NEW V2 POOL LOCKED ON ${chain.toUpperCase()} 🔒`;
    console.log(message.type);

    const unixTimestamp = parseInt(
      "0x" + tx.data.slice(hexDataNumbers[0], hexDataNumbers[1])
    );

    timestampToDate(unixTimestamp, message);

    const amount = BigInt(
      `0x${tx.data.slice(hexDataNumbers[2], hexDataNumbers[3])}`
    );

    return { poolAddress, amount };
  }
  return {};
}

async function checkLockedLP(poolAddress, provider, lockedAmount, message) {
  const uniswapV2ABI = ["function totalSupply() external view returns (uint)"];
  const uniswapV2Pair = new ethers.Contract(
    poolAddress,
    uniswapV2ABI,
    provider
  );
  const totalSupply = await uniswapV2Pair.totalSupply();

  const lockedPercentage = (
    (parseFloat(lockedAmount.toString()) / parseFloat(totalSupply.toString())) *
    100
  ).toFixed(2);
  message.amount = `Locked Percentage: ${lockedPercentage.toString()}%`;
  console.log("Locked Percentage:", lockedPercentage.toString(), "%");
  return lockedPercentage;
}

module.exports = {
  checkTxHashV2,
  checkBurnedSupply,
  checkLockedLP,
  checkBurnedLP,
};
