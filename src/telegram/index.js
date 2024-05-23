require("dotenv").config();
const axios = require("axios");

const { TELEGRAM_TOKEN, CHAT_ID } = process.env;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

async function sendMessage(message, chain) {
  let thread_id;
  if (chain === "base") {
    thread_id = 5;
  } else if (chain === "ethereum") {
    thread_id = 2;
  }
  const response = await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: CHAT_ID,
    message_thread_id: thread_id,
    text: message,
    parse_mode: "HTML",
  });
  return response.data;
}

module.exports = { sendMessage };
