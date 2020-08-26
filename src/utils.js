module.exports.address0x = '0x0000000000000000000000000000000000000000';
module.exports.bytes320x = '0x0000000000000000000000000000000000000000000000000000000000000000';

module.exports.sleepThread = async () => {
  return await this.sleep(process.configDefault.AWAIT_THREAD);
};

module.exports.sleep = async (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

module.exports.bn = (number) => {
  return process.web3.utils.toBN(number);
};

module.exports.bytes32 = (number) => {
  return process.web3.utils.toTwosComplement(number);
};

module.exports.getBlock = async (number = 'latest') => {
  for (let block, i = 0; ; await this.sleep(++i * 100)) {
    try {
      block = await process.web3.eth.getBlock(number);
    } catch (error) {
      console.log('#Utils/getBLock/Error', '\n', error.message);
    }

    if (block)
      return block;
  }
};
