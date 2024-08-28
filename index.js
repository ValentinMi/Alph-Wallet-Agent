import {
  DUST_AMOUNT,
  NodeProvider,
  convertAlphAmountWithDecimals,
} from "@alephium/web3";
import { PrivateKeyWallet } from "@alephium/web3-wallet";

const beneficiaryAddress = process.env.BENEFICIARY_ADDRESS;
const privateKey = process.env.INTERMEDIARY_ADDRESS_PRIVATE_KEY;
const NODE_URL = process.env.NODE_URL;

const nodeProvider = new NodeProvider(NODE_URL);
const wallet = new PrivateKeyWallet({
  nodeProvider,
  privateKey,
});

const interval =  process.env.CALL_INTERVAL_IN_HOUR * 60 * 60 * 1000;

main().then(() => {
setInterval(main, interval)
})

async function main() {
  const balance = await getBalance(wallet.address);
  if (BigInt(balance) < DUST_AMOUNT * 10n)
    return console.log("Insufficient balance to transfer");

  const transaction = await buildTransaction(
    BigInt(balance) - DUST_AMOUNT * 10n,
    beneficiaryAddress,
  );

  const txResult = await wallet.signAndSubmitUnsignedTx({
    signerAddress: wallet.address,
    unsignedTx: transaction.unsignedTx,
  });

  console.log("Transfer successful with txId: ", txResult.txId);
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
