const init = require('./src/init.js');

const { bn, sleepThread, address0x } = require('./src/utils.js');

async function main() {
  await init();
  process.callManager.processCalls();

  const loan = await getBasicLoan();
  await approve(loan)
  await requestLoan(loan);
  await lend(loan);


  for (;;) {
    const tx = await process.walletManager.sendTx(
      process.contracts.debtEngine.methods.pay(
        loan.id,
        1,
        address0x,
        []
      )
    );

    if (tx instanceof Error) {
      console.log(tx);
    }

    await sleepThread();
  }
}

main();

function random32() {
  return bn(process.web3.utils.randomHex(32));
}

function random32bn() {
  return bn(random32());
}

async function getBasicLoan() {
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

  loan.loanData = await process.contracts.installmentsModel.methods.encodeData(
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
    { t: 'address', v: process.contracts.debtEngine._address },
    { t: 'address', v: process.contracts.loanManager._address },
    { t: 'address', v: process.contracts.installmentsModel._address },
    { t: 'address', v: address0x },
    { t: 'uint256', v: internalSalt },
    { t: 'bytes', v: loan.loanData }
  );

  return loan;
};

async function requestLoan(loan) {
  await process.walletManager.sendTx(
    process.contracts.loanManager.methods.requestLoan(
      loan.model.amount,
      process.contracts.installmentsModel._address,
      address0x,
      process.walletManager.address,
      address0x,
      loan.salt,
      loan.expiration,
      loan.loanData,
    )
  );
};

async function lend(loan) {
  await process.walletManager.sendTx(
    process.contracts.loanManager.methods.lend(
      loan.id,
      '0x',
      address0x,
      0,
      '0x',
      '0x'
    ));
};

async function approve(loan) {
  const balance = await process.contracts.erc20.methods.balanceOf(process.walletManager.address).call();

  if (bn(balance).lt(loan.model.amount))
    throw new Error('Dont have balance of ' + process.contracts.erc20._address + ' token: ' + balance);

  const allowanceDebtEngine = await process.contracts.erc20.methods.allowance(
    process.walletManager.address, process.contracts.debtEngine._address
  ).call();
  if (bn(allowanceDebtEngine).lt(loan.model.amount))
    throw new Error('Collateral: ' + process.contracts.debtEngine._address + ' Dont have allowance of ' + process.contracts.erc20._address + ' token: ' + allowanceDebtEngine);

  const allowanceLoanManager = await process.contracts.erc20.methods.allowance(
    process.walletManager.address, process.contracts.debtEngine._address
  ).call();
  if (bn(allowanceLoanManager).lt(loan.model.amount))
    throw new Error('Collateral: ' + process.contracts.debtEngine._address + ' Dont have allowance of ' + process.contracts.erc20._address + ' token: ' + allowanceLoanManager);
}