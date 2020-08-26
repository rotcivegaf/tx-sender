const defaultConfig = {
  AWAIT_THREAD: 100,
  AWAIT_GET_BLOCK: 1000,
  // CallManager
  AWAIT_CALL: 1000,
  MAX_CALLS: 50,
};

module.exports = () => {
  const config = {// strings, no require cast
    BOT_PK: process.env.BOT_PK || '0x6995C137E0A4F7DD2BDABD30E13A7ABACD077E180EEA1DA2E4DF040D608DFFF5',
    URL_NODE_ETHEREUM: process.env.URL_NODE_ETHEREUM || 'https://ropsten.infura.io/v3/f6427a6723594cdd8affb596d357d268',
    MULTICALL_ADDRESS: process.env.MULTICALL_ADDRESS || '0x53C43764255c17BD724F74c4eF150724AC50a3ed',
  };

  config.AWAIT_THREAD = toInt(process.env.AWAIT_THREAD, defaultConfig.AWAIT_THREAD);
  config.AWAIT_GET_BLOCK = toInt(process.env.AWAIT_GET_BLOCK, defaultConfig.AWAIT_GET_BLOCK);

  // CallManager
  config.AWAIT_CALL = toInt(process.env.AWAIT_CALL, defaultConfig.AWAIT_CALL);
  config.MAX_CALLS = toInt(process.env.MAX_CALLS, defaultConfig.MAX_CALLS);

  return config;
};

function toBool(str, defaultValue) {
  if (!str && defaultValue)
    return defaultValue;
  else
    return str === 'true';
}

function toInt(str, defaultValue) {
  return str ? parseInt(str) : defaultValue;
}