const { sendMessage } = require("./index");

async function buildAndSendMessage(messageObject, chain) {
  console.log(messageObject);
  messageObject.chart = `<a href="https://dexscreener.com/${messageObject.chain}/${messageObject.address}">Chart</a>`;
  messageObject.buy = `<a href="https://app.uniswap.org/swap?outputCurrency=${messageObject.address}&chain=${messageObject.chain}">Buy</a>`;
  messageObject.address = `Token address: <code>${messageObject.address}</code>`;
  if (messageObject.socialLinks) {
    messageObject.socialLinks = messageObject.socialLinks.map((link) => {
      if (link.includes("https://t.me")) {
        return `<a href="${link}">Telegram</a>`;
      } else if (
        link.includes("https://twitter.com") ||
        link.includes("https://x.com")
      ) {
        return `<a href="${link}">Twitter</a>`;
      } else {
        return `<a href="${link}">Other</a>`;
      }
    });
  }
  let message = `${messageObject.type}

🪙 ${messageObject.name} (${messageObject.symbol})
${messageObject.lock ? "\n" + messageObject.lock : ""}${
    messageObject.amount ? "\n" + messageObject.amount : ""
  }
${messageObject.address}

${messageObject.renounced}
📊 ${messageObject.marketcap} | 💧 ${messageObject.liquidity} | 🏛️ ${
    messageObject.volume
  }

Buy tax: ${messageObject.buyTax}% | Sell tax: ${messageObject.sellTax}%
  
📈 ${messageObject.chart} | 💰 ${messageObject.buy}
${messageObject.socialLinks ? messageObject.socialLinks.join(" | ") : ""}`;

  console.log(message);
  await sendMessage(message, chain);
}

module.exports = { buildAndSendMessage };
