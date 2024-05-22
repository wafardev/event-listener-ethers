require("dotenv").config();
const axios = require("axios");

const { TELEGRAM_TOKEN, CHAT_ID } = process.env;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

async function sendMessage(message) {
  const response = await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: CHAT_ID,
    text: message,
    parse_mode: "HTML",
  });
  return response.data;
}

module.exports = { sendMessage };
