const axios = require("axios");

const { TELEGRAM_TOKEN, CHAT_ID } = process.env;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

async function sendMessage(message, chain, retries = 3, retryDelay = 1000) {
  let thread_id;

  if (chain === "base") {
    thread_id = 5;
  } else if (chain === "ethereum") {
    thread_id = 2;
  } else if (chain === "cronos") {
    thread_id = 182;
  }

  // For testing purposes only
  //thread_id = 1297;

  let attempt = 0;
  while (attempt < retries) {
    try {
      const response = await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: CHAT_ID,
        message_thread_id: thread_id,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      });
      return response.data;
    } catch (error) {
      if (error.code === "ECONNRESET" && attempt < retries - 1) {
        console.warn(
          `Connection reset. Retrying (${attempt + 1}/${retries})...`
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        attempt++;
      } else {
        throw error;
      }
    }
  }
  throw new Error(`Failed to send message after ${retries} retries.`);
}

module.exports = { sendMessage };
