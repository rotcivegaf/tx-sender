module.exports.modelAddress = '0x41e9D0B6a8Ce88989c2e7b3CaE42ECFAc44c9603';

module.exports.initContracts = async () => {
  process.contracts.uniswapOracle = await new process.web3.eth.Contract(
    require('../abis/uniswapOracleABI.json'),
    '0x01a65a0f19eC127D0DB1Bb83aBcA2B8B0Bef2669'
  );

  process.contracts.model = await new process.web3.eth.Contract(
    require('../abis/ModelAbi.json'),
    '0x41e9D0B6a8Ce88989c2e7b3CaE42ECFAc44c9603'
  );

  process.contracts.erc20 = await new process.web3.eth.Contract(require('../abis/erc20Abi.json'));
};