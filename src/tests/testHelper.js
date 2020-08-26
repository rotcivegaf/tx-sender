const { bn, address0x } = require('../utils.js');
const { modelAddress } = require('./testEnv.js');

const collateralAddress = process.configDefault.COLLATERAL_ADDRESS;
const debtEngineAddress = process.contracts.debtEngine._address;
const loanManagerAddress = process.contracts.loanManager._address;

function random32() {
  return bn(process.web3.utils.randomHex(32));
}

function random32bn() {
  return bn(random32());
}

function toBytes32(source) {
  source = process.web3.utils.toHex(source);
  const rl = 64;
  source = source.toString().replace('0x', '');
  if (source.length < rl) {
    const diff = 64 - source.length;
    source = '0'.repeat(diff) + source;
  }
  return '0x' + source;
}

module.exports.approveContracts = async () => {
  // debt engine contract
  const allowance = await process.contracts.baseToken.methods.allowance(
    process.walletManager.address,
    process.contracts.debtEngine._address
  ).call();
  const maxBytes32 = bn(2).pow(bn(256)).sub(bn(1));

  if (bn(allowance).lt(bn(2).pow(bn(128))))
    await process.walletManager.sendTx(
      process.contracts.baseToken.methods.approve(
        process.contracts.debtEngine._address,
        maxBytes32
      )
    );

  // collateral contract
  process.contracts.erc20._address = await process.contracts.uniswapOracle.methods.token().call();
  const allowanceColl = await process.contracts.erc20.methods.allowance(
    process.walletManager.address,
    process.contracts.collateral._address
  ).call();

  if (bn(allowanceColl).lt(bn(2).pow(bn(128))))
    await process.walletManager.sendTx(
      process.contracts.erc20.methods.approve(
        process.contracts.collateral._address,
        maxBytes32
      )
    );

  process.contracts.erc20._address = await process.contracts.erc20WithOracle._address;
  const allowanceColl2 = await process.contracts.erc20.methods.allowance(
    process.walletManager.address,
    process.contracts.collateral._address
  ).call();

  if (bn(allowanceColl2).lt(bn(2).pow(bn(128))))
    await process.walletManager.sendTx(
      process.contracts.erc20.methods.approve(
        process.contracts.collateral._address,
        maxBytes32
      )
    );
};

module.exports.getBasicLoan = async () => {
  const loan = {};

  loan.salt = random32bn();
  loan.expiration = bn(157000000000),
  loan.model = {
    amount: bn(50000000000000),
    interestRate: bn(31104000000000),
    installments: bn(2),
    duration: bn(60 * 60 * 24 * 30), // 30 days
    timeUnit: bn(60 * 60 * 24), // a day
  };

  loan.loanData = await process.contracts.model.methods.encodeData(
    loan.model.amount,
    loan.model.interestRate,
    loan.model.installments,
    loan.model.duration,
    loan.model.timeUnit
  ).call();

  const internalSalt = process.web3.utils.hexToNumberString(
    process.web3.utils.soliditySha3(
      { t: 'uint128', v: loan.model.amount },
      { t: 'address', v: process.walletManager.address },
      { t: 'address', v: process.walletManager.address },
      { t: 'address', v: address0x },
      { t: 'uint256', v: loan.salt },
      { t: 'uint64', v: loan.expiration }
    )
  );

  loan.id = process.web3.utils.soliditySha3(
    { t: 'uint8', v: '0x02' },
    { t: 'address', v: debtEngineAddress },
    { t: 'address', v: loanManagerAddress },
    { t: 'address', v: modelAddress },
    { t: 'address', v: address0x },
    { t: 'uint256', v: internalSalt },
    { t: 'bytes', v: loan.loanData }
  );

  // collateral
  loan.collateralOracle = process.contracts.uniswapOracle._address;
  loan.entryAmount = bn(15000000000000000);
  loan.liquidationRatio = bn(6442450944);
  loan.balanceRatio = bn(8589934592);

  return loan;
};

module.exports.getShortLoan = async () => {
  const loan = {};

  loan.salt = random32bn();
  loan.expiration = bn(157000000000),
  loan.model = {
    amount: bn('500000'),
    interestRate: bn(31104000000000),
    installments: bn(2),
    duration: bn(60), // a minute
    timeUnit: bn(30), // a half minute
  };

  loan.loanData = await process.contracts.model.methods.encodeData(
    loan.model.amount,
    loan.model.interestRate,
    loan.model.installments,
    loan.model.duration,
    loan.model.timeUnit
  ).call();

  const internalSalt = process.web3.utils.hexToNumberString(
    process.web3.utils.soliditySha3(
      { t: 'uint128', v: loan.model.amount },
      { t: 'address', v: process.walletManager.address },
      { t: 'address', v: process.walletManager.address },
      { t: 'address', v: address0x },
      { t: 'uint256', v: loan.salt },
      { t: 'uint64', v: loan.expiration }
    )
  );

  loan.id = process.web3.utils.soliditySha3(
    { t: 'uint8', v: '0x02' },
    { t: 'address', v: debtEngineAddress },
    { t: 'address', v: loanManagerAddress },
    { t: 'address', v: modelAddress },
    { t: 'address', v: address0x },
    { t: 'uint256', v: internalSalt },
    { t: 'bytes', v: loan.loanData }
  );

  // collateral
  //loan.collateralOracle = address0x;
  loan.collateralOracle = address0x;
  loan.entryAmount = bn('500000000');
  loan.liquidationRatio = bn(6442450944);
  loan.balanceRatio = bn(8589934592);

  return loan;
};

module.exports.requestLoan = async (loan) => {
  await process.walletManager.sendTx(
    process.contracts.loanManager.methods.requestLoan(
      loan.model.amount,
      modelAddress,
      address0x,
      process.walletManager.address,
      address0x,
      loan.salt,
      loan.expiration,
      loan.loanData,
    )
  );
};

module.exports.createCollateral = async (loan) => {
  if (loan.collateralOracle == address0x) {
    process.contracts.erc20._address = await process.contracts.collateral.methods.loanManagerToken().call();
  } else {
    process.contracts.erc20._address = await process.contracts.uniswapOracle.methods.token().call();
  }

  const balance = await process.contracts.erc20.methods.balanceOf(process.walletManager.address).call();
  if (bn(balance).lt(loan.entryAmount))
    throw new Error('Dont have balance of ' + process.contracts.erc20._address + ' token: ' + balance);

  const allowance = await process.contracts.erc20.methods.allowance(process.walletManager.address, process.contracts.collateral._address).call();
  if (bn(allowance).lt(loan.entryAmount))
    throw new Error('Collateral: ' + process.contracts.collateral._address + ' Dont have allowance of ' + process.contracts.erc20._address + ' token: ' + allowance);

  const collateralId = await process.contracts.collateral.methods.getEntriesLength().call();

  await process.walletManager.sendTx(
    process.contracts.collateral.methods.create(
      process.walletManager.address,
      loan.id,
      loan.collateralOracle,
      loan.entryAmount,
      loan.liquidationRatio,
      loan.balanceRatio,
    )
  );

  return collateralId;
};

module.exports.lendLoan = async (loan, collateralId) => {
  const balance = await process.contracts.baseToken.methods.balanceOf(process.walletManager.address).call();
  if (bn(balance).lt(loan.model.amount))
    throw new Error('Dont have balance of ' + process.contracts.baseToken._address + ' token: ' + balance);

  const allowance = await process.contracts.baseToken.methods.allowance(process.walletManager.address, process.contracts.loanManager._address).call();
  if (bn(allowance).lt(loan.model.amount))
    throw new Error('LoanManager: ' + process.contracts.loanManager._address + ' Dont have allowance of ' + process.contracts.baseToken._address + ' token: ' + allowance);

  await process.walletManager.sendTx(
    process.contracts.loanManager.methods.lend(
      loan.id,
      '0x',
      collateralId ? collateralAddress : address0x,
      0,
      collateralId ? toBytes32(collateralId) : '0x',
      '0x'
    ));
};

module.exports.setEquivalent = async (equivalent) => {
  await process.walletManager.sendTx(process.contracts.erc20WithOracle.methods.setEquivalent(equivalent));
};
