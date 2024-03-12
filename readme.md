## Event Listener for Ethereum Blocks with Sound Alert

### Overview

This Node.js script sets up an event listener to monitor Ethereum blocks for events associated with a specific address. When an event is triggered, such as a transaction or contract event, the script plays a sound alert.

### Steps

1. **Install Node.js**: Ensure Node.js is installed on your system.

2. **Install Dependencies**: Install the necessary dependencies using npm:

   ```bash
   npm install

   ```

3. **Add Environment Variables**: Create a .env file and add your RPC_URL inside, an example is provided in .env.sample :

   ```bash
   RPC_URL=wss://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY

   ```

4. **Launch The Script**: Launch the script with Node:
   ```bash
   node ./src/script.js
   ```

The node provided in the .env file will watch every single block until it finds the event specified in the code. Once the event is fetched, the intel is decoded and you get an address in return.
