const { sortSocialLinks } = require("./misc");

require("dotenv").config();
const {
  ETHERSCAN_API_TOKEN,
  BASESCAN_API_TOKEN,
  CRONOSCAN_API_TOKEN,
  TOKENSNIFFER_API_TOKEN,
  TTF_API_TOKEN,
} = process.env;

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
      if (!pair.liquidity) {
        console.log("The pair has no liquidity");
        return;
      }
      const volume = pair.volume.h24;
      const liquidity = pair.liquidity.usd;
      const marketcap = pair.fdv;
      ({ address, name, symbol } = pair.baseToken);
      message.volume = `🏛️ <b>Volume</b>: ${volume}$`;
      message.marketcap = `📊 <b>Marketcap</b>: ${marketcap}$`;
      message.liquidity = `💧 <b>Liquidity</b>: ${liquidity}$`;
      message.address = `${address}`;
      message.name = `${name}`;
      message.symbol = `${symbol}`;
      if (liquidity < 5000 || volume < 1000) {
        console.log("The pair has low volume or liquidity");
        address = "ignore";
      }
      console.log("Base Token Address:", address);
    });

  return address;
}

async function getTokenInfoWithRetry(pairAddress, chain, message) {
  let baseTokenAddress;
  let currentTimestamp = Date.now();
  let checked = false;

  while (Date.now() - currentTimestamp < 600000 && !baseTokenAddress) {
    if (checked) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    baseTokenAddress = await getTokenInfo(pairAddress, chain, message);
    checked = true;
  }

  if (baseTokenAddress === "ignore") {
    return false;
  }

  return baseTokenAddress;
}

async function checkVerifiedSourceCode(contractAddress, chain, message) {
  let bool = true;
  let API_TOKEN;
  let API_LINK;
  if (chain === "ethereum") {
    API_LINK = "https://api.etherscan.io/";
    API_TOKEN = ETHERSCAN_API_TOKEN;
  } else if (chain === "base") {
    API_LINK = "https://api.basescan.org/";
    API_TOKEN = BASESCAN_API_TOKEN;
  } else if (chain === "cronos") {
    API_LINK = "https://api.cronoscan.com/";
    API_TOKEN = CRONOSCAN_API_TOKEN;
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
        let sourceCode;
        if (result.SourceCode.startsWith("{{")) {
          result.SourceCode = result.SourceCode.slice(1, -1);
          result.SourceCode = JSON.parse(result.SourceCode);

          for (const contract in result.SourceCode.sources) {
            sourceCode += result.SourceCode.sources[contract].content;
          }
        } else {
          sourceCode = result.SourceCode;
        }
        console.log("The contract has been verified");
        if (sourceCode.includes("abstract contract Platforme")) {
          // common scam contract
          console.log("The contract is a scam");
          return false;
        }
        const socialLinks = sourceCode.match(
          /\bhttps?:\/\/(?!.*(?:github|zeppelin|ethereum|solidity|stackexchange|docs|metamask|wiki|rpc|json))\S+\b/g // filter common social links
        );

        if (!socialLinks) {
          console.log("No social links found");
        } else {
          message.socialLinks = socialLinks.map((link) =>
            link.replace(/\\n$/, "")
          );
          message.socialLinks.sort(sortSocialLinks);
          console.log(message.socialLinks);
        }
      }
    });
  return bool;
}

async function waitForVerifiedSourceCode(contractAddress, chain, message) {
  let verified = false;
  let checked = false;
  let currentTimestamp = Date.now();
  while (!verified && Date.now() - currentTimestamp < 1800000) {
    if (checked) {
      console.log(`The token (${contractAddress}) is not verified yet.`);
      await new Promise((resolve) => setTimeout(resolve, 30000));
    }
    verified = await checkVerifiedSourceCode(contractAddress, chain, message);
    checked = true;
  }
  return verified;
}

/*async function checkContractSafety(contractAddress, chain, message) { // Token Sniffer API needed
  if (chain === "cronos") {
    message.buyTax = "?";
    message.sellTax = "?";
    return true;
  }
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
      if (data.status === "pending") {
        console.log("Cannot verify the contract.");
        bool = false;
      } else {
        if (data.is_flagged) {
          console.log(`The contract (${contractAddress}) has been flagged`);
          bool = false;
        }
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
}*/

async function useHoneypotAPI(contractAddress) {
  let buyTax = 100;
  let sellTax = 100;
  await fetch(
    `https://api.honeypot.is/v2/IsHoneypot?address=${contractAddress}`
  )
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
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

async function useTTFBotAPI(contractAddress, renouncedBool, chain, message) {
  if (chain === "ethereum") {
    chain = "eth";
  }

  const rug_list = [
    "Possible 100% Tax Trigger found!",
    "SUSPICIOUS CODE",
    "RUGGABLE",
    "Blacklist",
    "Whitelist",
    "Trading Disable",
    "<b>Possible Delayed Honeypot. BE CAREFUL</b>",
    "<b>VERY POSSIBLE Delayed Honeypot. BE CAREFUL</b>",
  ];

  const safeFunction = "_update";
  const safeFunction2 = "HARDCORE SELL LIMIT";

  const renounced_list = ["Blacklist", "Whitelist", "Trading Disable"];

  try {
    const response = await fetch(
      `https://ttfapiv2.ttfbot.com/coolscan?contract=${contractAddress}&chain=${chain}&apiKey=${TTF_API_TOKEN}&airdrops=true`
    );

    const data = await response.json();

    console.log(data);

    if (!data.token) {
      message.ttfbot = "The contract cannot be verified by TTF API";
      return "unverified";
    }

    let security;
    let liquidityTokens;
    let buyTax;
    let sellTax;
    let deployerNative;
    let top1Holder;
    let honeyPot;
    let contractBalance;
    let decimals;

    if (chain === "eth") {
      decimals = data.token.decimals;
      security = data.token.security;
      liquidityTokens = data.token.liquidity.liquidity_token / 10 ** decimals;
      buyTax = data.market.taxes.buy_tax;
      sellTax = data.market.taxes.sell_tax;
      deployerNative = data.token.deployerNative;
      top1Holder = data.token.holders.top10["1"].tokens;
      honeyPot = data.market.taxes.honeyPot;
      contractBalance = data.token.contractBalance.balance;
    } else if (chain === "base") {
      decimals = data.basic.decimals;
      security = data.security;
      liquidityTokens = data.liquidity_token;
      buyTax = data.tax.buyTax;
      sellTax = data.tax.sellTax;
      deployerNative = data.deployerNative;
      top1Holder = data.holders.holders["1"].tokens;
      honeyPot = data.tax.isHoneypot;
      contractBalance = data.contractBalance.balance;
    }

    let renounceCheck = false;

    for (const warning of security) {
      if (rug_list.includes(warning)) {
        if (renouncedBool) {
          if (!renounced_list.includes(warning)) {
            console.log("The contract is probably a scam");
            return false;
          }
        } else {
          if (renounced_list.includes(warning)) {
            console.log("The contract is probably a scam without renounce");
            renounceCheck = true;
          } else {
            console.log("The contract is probably a scam");
            return false;
          }
        }
      } else if (warning.includes("are external contracts")) {
        console.log("The contract is probably a scam");
        return false;
      } else if (warning.includes("FUNCTIONS:")) {
        if (
          !(warning.includes(safeFunction) || warning.includes(safeFunction2))
        ) {
          console.log("The contract is probably a scam");
          return false;
        }
      } else if (warning.includes("Honeypot")) {
        console.log("The contract is probably a honeypot");
        return false;
      } else if (warning.includes("BE CAREFUL")) {
        console.log("The contract is probably a scam");
        return false;
      }
    }

    if (contractBalance > liquidityTokens || top1Holder > liquidityTokens) {
      if (!renounceCheck) {
        console.log("Someone holds more than LP");
        return false;
      } else {
        console.log("Someone holds more than LP but still not renounced");
      }
    }

    if (honeyPot) {
      console.log("The contract is a honeypot");
      return false;
    }

    message.buyTax = buyTax;
    message.sellTax = sellTax;
    message.deployer = deployerNative + " ETH";

    if (renounceCheck) {
      return "renounce";
    } else {
      return true;
    }
  } catch (error) {
    console.error("Error fetching or processing data from TTF API:", error);
    return false;
  }
}

module.exports = {
  useTTFBotAPI,
  getTokenInfoWithRetry,
  useHoneypotAPI,
  waitForVerifiedSourceCode,
};
