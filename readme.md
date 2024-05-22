# Ethereum Block Event Listener with Telegram Notification

## Overview

This Node.js script sets up an event listener to monitor Ethereum blocks for LP (Liquidity Pool) Locks/Burns. When an event such as a transaction or contract event is detected, the script logs relevant information and sends a message to a specified Telegram channel via the Telegram Bot API. This tool leverages Etherscan, TokenSniffer, Honeypot, and a WebSocket RPC URL API to gather useful information to help prevent encountering scam tokens.

## Prerequisites

- **Node.js**: Ensure that Node.js is installed on your system. You can download it from [nodejs.org](https://nodejs.org/).

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/wafardev/event-listener-ethers
cd event-listener-ethers
```

### 2. Install Dependencies

Install the necessary dependencies using npm:

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory and add your RPC URL. An example is provided in `.env.sample`:

```bash
ETH_RPC_URL=wss://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
```

- `ETH_RPC_URL`: Your WebSocket RPC URL from a provider like Alchemy on Ethereum.
- `TELEGRAM_BOT_TOKEN`: Your Telegram Bot API token.
- `TELEGRAM_CHAT_ID`: The ID of the Telegram chat/channel where notifications will be sent.

## Usage

### 1. Launch the Script

Specify the chain you want to monitor and launch the script using npm:

```bash
npm run eth
```

## How It Works

The script will:

1. **Connect to the Ethereum Network**: Using the RPC URL provided in the `.env` file.
2. **Monitor Blocks**: Watch every block for specified events.
3. **Decode and Log Information**: When an event is detected, decode the intel and log it.
4. **Send Telegram Notification**: Format the information and send a readable message to the specified Telegram channel.

## Troubleshooting

- **Connection Issues**: Ensure your RPC URL is correct and your internet connection is stable.
- **Environment Variables**: Double-check your `.env` file for any typos or missing values.
- **Dependencies**: Ensure all dependencies are installed correctly by running `npm install`.

## Contributions

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
