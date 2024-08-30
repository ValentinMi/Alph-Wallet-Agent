import {
  DUST_AMOUNT,
  NodeProvider,
  ONE_ALPH,
  prettifyAttoAlphAmount,
} from "@alephium/web3";
import { PrivateKeyWallet } from "@alephium/web3-wallet";
import cron from "node-cron"

const BENEFICIARY_ADDRESS = process.env.BENEFICIARY_ADDRESS;
const privateKey = process.env.INTERMEDIARY_ADDRESS_PRIVATE_KEY;
const NODE_URL = process.env.NODE_URL;

const nodeProvider = new NodeProvider(NODE_URL);
const wallet = new PrivateKeyWallet({
  nodeProvider,
  privateKey,
});

const interval = process.env.CALL_INTERVAL_IN_MILLISECOND ||  6 * 60 * 60 * 1000 // Default is 6 hours;

main()
cron.schedule(convertMillisToCron(interval), async () => {
  await main()
});

// Prevent the Node.js process from exiting
setInterval(() => {}, 1 << 30);

async function main() {
  const balance = await getBalance(wallet.address);

  if (BigInt(balance) < ONE_ALPH)
    return log(
      `Balance is less than 1 ALPH. Current balance: ${prettifyAttoAlphAmount(balance)} ALPH`,
    );

  const transaction = await buildTransaction(
    BigInt(balance) - DUST_AMOUNT * 10n,
    BENEFICIARY_ADDRESS,
  );

  const txResult = await wallet.signAndSubmitUnsignedTx({
    signerAddress: wallet.address,
    unsignedTx: transaction.unsignedTx,
  });

  return log(`Transfer successful with txId: ${txResult.txId}`);
}

/**
 * @param {String} address
 * @returns {Promise<string>}
 */
async function getBalance(address) {
  const data = await nodeProvider.addresses.getAddressesAddressBalance(address);
  return data.balance;
}

/**
 * @param {bigint} amount
 * @param {string} destinationAddress
 * @returns {Promise<any>}
 */
async function buildTransaction(amount, destinationAddress) {
  return await wallet.buildTransferTx({
    signerAddress: wallet.address,
    destinations: [
      {
        address: destinationAddress,
        attoAlphAmount: amount,
      },
    ],
  });
}

function getFormattedDate() {
  const date = new Date();

  // Get day, month, year, hours, and minutes
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getUTCHours() + 2).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year}-${hours}:${minutes}`;
}

function log(message) {
  console.log(`[${getFormattedDate()}] -- ${message}`);
}


/**
 * @param {number} ms
 * @returns {string}
 */
function convertMillisToCron(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  if (totalSeconds < 60) {
    return `*/${totalSeconds} * * * * *`; // Every X seconds
  } else if (totalMinutes < 60) {
    return `0 */${totalMinutes} * * * *`; // Every X minutes at second 0
  } else if (totalHours < 24) {
    return `0 0 */${totalHours} * * *`;   // Every X hours at minute 0, second 0
  } else {
    return `0 0 0 */${totalDays} * *`;    // Every X days at 00:00:00
  }
}


