const ethers = require("ethers");
require("dotenv").config();

const { ETH_RPC_URL, BASE_RPC_URL } = process.env;

async function checkRenounced(contractAddress, provider, message) {
  let bool = false;
  let owner;

  const zeroAddressArray = [
    "0x0000000000000000000000000000000000000000",
    "0x0000000000000000000000000000000000000001",
    "0x000000000000000000000000000000000000dEaD",
  ];
  const tokenABI = ["function owner() public view returns (address)"];
  const token = new ethers.Contract(contractAddress, tokenABI, provider);

  try {
    owner = await token.owner();
  } catch (error) {
    console.log("The contract doesn't have an owner.");
    bool = true;
  }

  if (zeroAddressArray.includes(owner)) {
    console.log(`The token (${contractAddress}) has been renounced`);
    bool = true;
  }
  let emoji = bool ? "✅" : "❌";
  let negation = bool ? "" : "Not ";
  message.renounced = `${emoji} <b>Contract ${negation}Renounced</b> ${emoji}`;
  return bool;
}

async function waitForRenounce(baseTokenAddress, provider, message) {
  let renounced = false;
  let checked = false;
  let currentTimestamp = Date.now();
  while (!renounced && Date.now() - currentTimestamp < 1800000) {
    if (checked) {
      console.log(`The token (${baseTokenAddress}) is not renounced yet.`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    renounced = await checkRenounced(baseTokenAddress, provider, message);
  }
  return renounced;
}

async function checkClog(contractAddress, poolAddress, provider) {
  const tokenABI = [
    "function balanceOf(address account) external view returns (uint256)",
  ];
  const tokenContract = new ethers.Contract(
    contractAddress,
    tokenABI,
    provider
  );

  const poolBalance = await tokenContract.balanceOf(poolAddress);
  const contractBalance = await tokenContract.balanceOf(contractAddress);

  const clog = contractBalance - poolBalance < 0;
  if (!clog) {
    console.log("The contract is clogged.");
  }
  return clog;
}

async function getBalance(contractAddress, walletAddress, decimals, chain) {
  let provider;
  if (chain === "ethereum") {
    provider = new ethers.providers.WebSocketProvider(ETH_RPC_URL);
  } else if (chain === "base") {
    provider = new ethers.providers.WebSocketProvider(BASE_RPC_URL);
  }
  const tokenABI = [
    "function balanceOf(address account) external view returns (uint256)",
  ];
  const tokenContract = new ethers.Contract(
    contractAddress,
    tokenABI,
    provider
  );

  const walletBalance = await tokenContract.balanceOf(walletAddress);

  return walletBalance / 10 ** decimals;
}

module.exports = { checkRenounced, waitForRenounce, checkClog, getBalance };
