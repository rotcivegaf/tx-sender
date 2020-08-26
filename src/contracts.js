module.exports = async () => {
  const contracts = {};

  contracts.loanManager = new process.web3.eth.Contract(
    require('./abis/loanManagerAbi.json'),
    '0x39E67f667eD83c8A2DB0b18189FE93f57081b9aE'
  );

  const debtEngineAddress = await contracts.loanManager.methods.debtEngine().call();
  contracts.debtEngine = new process.web3.eth.Contract(
    require('./abis/debtEngineAbi.json'),
    debtEngineAddress
  );

  const baseTokenAddress = await contracts.debtEngine.methods.token().call();
  contracts.baseToken = new process.web3.eth.Contract(
    require('./abis/erc20Abi.json'),
    baseTokenAddress
  );

  contracts.installmentsModel = new process.web3.eth.Contract(
    require('./abis/InstallmentsModelAbi.json'),
    '0x41e9D0B6a8Ce88989c2e7b3CaE42ECFAc44c9603'
  );

  contracts.erc20 = new process.web3.eth.Contract(
    require('./abis/erc20Abi.json'),
    '0x2f45b6Fb2F28A73f110400386da31044b2e953D4'
  );

  return contracts;
};
