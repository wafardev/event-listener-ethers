const ethers = require("ethers");
require("dotenv").config();

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
  message.renounced = `${emoji} Contract ${negation}Renounced ${emoji}`;
  return bool;
}

async function waitForRenounce(baseTokenAddress, provider, message) {
  let renounced = false;
  let currentTimestamp = Date.now();
  while (!renounced && Date.now() - currentTimestamp < 600000) {
    console.log(`The token (${baseTokenAddress}) is not renounced yet.`);
    await new Promise((resolve) => setTimeout(resolve, 10000));
    renounced = await checkRenounced(baseTokenAddress, provider, message);
  }
  if (renounced) {
  }
}

module.exports = { checkRenounced, waitForRenounce };
