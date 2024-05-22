require("dotenv").config();
const { ETHERSCAN_API_TOKEN, BASESCAN_API_TOKEN, TOKENSNIFFER_API_TOKEN } =
  process.env;

async function getTokenInfo(pairAddress, chain, message) {
  let address;
  let name;
  let symbol;
  await fetch(
    `https://api.dexscreener.com/latest/dex/pairs/${chain}/${pairAddress}`
  )
    .then((response) => response.json())
    .then(async (data) => {
      if (!data.pairs) {
        console.log("The pair does not exist");
        return;
      }
      const pair = data.pairs[0];
      const volume = pair.volume.h24;
      const liquidity = pair.liquidity.usd;
      const marketcap = pair.fdv;
      ({ address, name, symbol } = pair.baseToken);
      message.volume = `Volume: ${volume}$`;
      message.marketcap = `Marketcap: ${marketcap}$`;
      message.liquidity = `Liquidity: ${liquidity}$`;
      message.address = `${address}`;
      message.name = `${name}`;
      message.symbol = `${symbol}`;
      if (liquidity < 1000 || volume < 100) {
        console.log("The pair has low volume or liquidity");
        address = null;
      }
      console.log("Base Token Address:", address);
    });

  return address;
}

async function getTokenInfoWithRetry(pairAddress, chain, message) {
  let baseTokenAddress;
  let attempt = 0;

  while (attempt < 10 && !baseTokenAddress) {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    baseTokenAddress = await getTokenInfo(pairAddress, chain, message);
    attempt++;
  }

  return baseTokenAddress;
}

async function checkVerifiedSourceCode(
  contractAddress,
  chain,
  message,
  socialLinks
) {
  let bool = true;
  let API_TOKEN;
  let API_LINK;
  if (chain === "ethereum") {
    API_LINK = "https://api.etherscan.io/";
    API_TOKEN = ETHERSCAN_API_TOKEN;
  } else if (chain === "base") {
    API_LINK = "https://api.basescan.org/";
    API_TOKEN = BASESCAN_API_TOKEN;
  }
  await fetch(
    `${API_LINK}api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${API_TOKEN}`
  )
    .then((response) => response.json())
    .then((data) => {
      const result = data.result[0];
      if (!result.SourceCode) {
        bool = false;
        console.log("The contract has not been verified");
      } else {
        if (socialLinks) {
          bool = result.SourceCode.match(
            /\bhttps?:\/\/(?!.*(?:github|openzeppelin|ethereum|soliditylang|stackexchange))\S+\b/g // filter common social links
          );

          if (!bool) {
            console.log("No social links found");
          } else {
            bool = bool.map((link) => link.replace(/\\n$/, ""));
            message.socialLinks = bool;
          }
        } else {
          console.log("The contract has been verified");
        }
      }
    });
  return bool;
}

async function checkContractSafety(contractAddress, chain, message) {
  let chainId;
  let bool = true;
  let buyTax;
  let sellTax;
  if (chain === "ethereum") {
    chainId = 1;
  } else if (chain === "base") {
    chainId = 8453;
  }

  await fetch(
    `https://tokensniffer.com/api/v2/tokens/${chainId}/${contractAddress}?apikey=${TOKENSNIFFER_API_TOKEN}&include_metrics=true&include_tests=true&block_until_ready=true`
  )
    .then((response) => response.json())
    .then(async (data) => {
      if (data.is_flagged) {
        console.log(`The contract (${contractAddress}) has been flagged`);
        bool = false;
      }
      if (checkHoneypot(data)) {
        console.log(`The contract (${contractAddress}) is a honeypot`);
        bool = false;
      }
      const tax = data.swap_simulation;
      message.buyTax = tax.buy_fee;
      message.sellTax = tax.sell_fee;
      if (tax.buy_fee === undefined || tax.sell_fee === undefined) {
        ({ buyTax, sellTax } = await useHoneypotAPI(contractAddress));
        if (buyTax === 100 && sellTax === 100) {
          bool = false;
        } else {
          message.buyTax = buyTax;
          message.sellTax = sellTax;
        }
      }
    });
  return bool;
}

function checkHoneypot(jsonData) {
  let bool = false;
  const tests = jsonData.tests;
  for (let i = 0; i < tests.length; i++) {
    if (
      tests[i].id === "testForUnableToSell" ||
      tests[i].id === "testForHighBuyFee" ||
      tests[i].id === "testForHighSellFee"
    ) {
      if (tests[i].result === "true") {
        bool = true;
      }
    }
  }
  return bool;
}

async function useHoneypotAPI(contractAddress) {
  let buyTax = 100;
  let sellTax = 100;
  await fetch(
    `https://api.honeypot.is/v2/IsHoneypot?address=${contractAddress}`
  )
    .then((response) => response.json())
    .then((data) => {
      if (data.simulationSuccess === false) {
        console.log("The contract cannot be verified by Honeypot API");
      } else {
        if (data.honeypotResult.isHoneypot === true) {
          console.log("The contract is a honeypot");
        } else {
          buyTax = data.simulationResult.buyTax;
          sellTax = data.simulationResult.sellTax;
        }
      }
    });
  return { buyTax, sellTax };
}

module.exports = {
  checkVerifiedSourceCode,
  checkContractSafety,
  getTokenInfoWithRetry,
};
