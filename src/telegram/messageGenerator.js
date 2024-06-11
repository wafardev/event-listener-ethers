const { sendMessage } = require("./index");

async function buildAndSendMessage(messageObject, chain) {
  let explorer;
  let explorerName;
  if (chain === "ethereum") {
    explorer = "etherscan.io";
    explorerName = "Etherscan";
  } else if (chain === "base") {
    explorer = "basescan.org";
    explorerName = "Basescan";
  } else if (chain === "cronos") {
    explorer = "cronoscan.com";
    explorerName = "Cronoscan";
  }
  messageObject.buy = `<a href="https://vvs.finance/swap?outputCurrency=${messageObject.address}">Buy</a>`;
  messageObject.chart = `<a href="https://dexscreener.com/${messageObject.chain}/${messageObject.address}">Chart</a>`;
  messageObject.explorer = `<a href="https://${explorer}/token/${messageObject.address}#code">${explorerName}</a>`;
  messageObject.ttfscan = `<a href="https://t.me/ttfbotbot?start=${messageObject.address}">TTF Scan</a>`;
  messageObject.honeypot = `<a href="https://honeypot.is/${chain}?address=${messageObject.address}">Honeypot</a>`;
  messageObject.address = `🏷️ <b>Token Address</b>: <code>${messageObject.address}</code>`;
  messageObject.deployer = messageObject.deployer
    ? `\n🧑‍💼 <b>Deployer</b>: ${messageObject.deployer}`
    : "";
  messageObject.ttfbot = messageObject.ttfbot
    ? `<b> ${messageObject.ttfbot}</b>`
    : "";

  const honeypotAndSnifferText =
    chain !== "cronos"
      ? `| 🕵️ ${messageObject.ttfscan} | 🍯 ${messageObject.honeypot}`
      : `| 💰 ${messageObject.buy}`;
  if (messageObject.socialLinks) {
    messageObject.socialLinks = messageObject.socialLinks.map((link) => {
      if (link.includes("https://t.me")) {
        return `<a href="${link}">📬 Telegram</a>`;
      } else if (
        link.includes("https://twitter.com") ||
        link.includes("https://x.com")
      ) {
        return `<a href="${link}">🐦 Twitter</a>`;
      } else {
        return `<a href="${link}">🌐 Other</a>`;
      }
    });
  }
  let message = `${messageObject.type}

🪙 <b>${messageObject.name} (${messageObject.symbol})</b>
${messageObject.lock ? "\n" + messageObject.lock : ""}${
    messageObject.amount ? "\n" + messageObject.amount : ""
  }
${messageObject.address}
${messageObject.deployer}

${messageObject.renounced}
${messageObject.marketcap} | ${messageObject.liquidity} | ${
    messageObject.volume
  }

💰 <b>Buy Tax</b>: ${messageObject.buyTax}% | 💸 <b>Sell Tax</b>: ${
    messageObject.sellTax
  }%
  
📈 ${messageObject.chart} | 🔍 ${
    messageObject.explorer
  } ${honeypotAndSnifferText}

${
  messageObject.socialLinks
    ? messageObject.socialLinks.join(" | ")
    : "🔗 <b>No social links found.</b>"
}

${messageObject.ttfbot}`;

  console.log(message);
  try {
    console.log("Sending message...");
    await sendMessage(message, chain);
    console.log("Message sent successfully.");
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

module.exports = { buildAndSendMessage };
