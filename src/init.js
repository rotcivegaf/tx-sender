const Web3 = require('web3');

const WalletManager = require('./WalletManager.js');
const CallManager = require('./CallManager.js');

module.exports = async () => {
  console.log('Start Log:', Date().toString());

  process.configDefault = require('../configDefault.js')();
  console.log(process.configDefault);
  process.web3 = new Web3(new Web3.providers.HttpProvider(process.configDefault.URL_NODE_ETHEREUM));
  process.contracts = await require('./contracts.js')();

  process.walletManager = new WalletManager();
  process.callManager = new CallManager();
};