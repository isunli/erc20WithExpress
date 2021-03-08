var DappToken = artifacts.require("./DappToken.sol");
contract("DappToken", function (accounts) {
  it("initializes the contract with the correct values", async () => {
    const token = await DappToken.deployed();
    const tokenName = await token.name();
    const symbol = await token.symbol();
    const standard = await token.standard();
    assert.equal(symbol, "DAPP", "correct symbol");
    assert.equal(tokenName, "DappToken", "correct name");
    assert.equal(standard, "Dapp Token v1.0", "has the correct standard");
  });
  it("sets the total supply upon deployment", async () => {
    const token = await DappToken.deployed();
    const totalSupply = await token.totalSupply();

    // console.log(totalSupply);
    assert.equal(
      totalSupply.toNumber(),
      1000000,
      "sets the total supply to 1000000"
    );
    const adminBalance = await token.balanceOf(accounts[0]);
    assert.equal(
      adminBalance.toNumber(),
      1000000,
      "it allocate the initial supply to the admin account"
    );
  });
  it("transfers token ownership", async () => {
    // test require statement first by transfering something larger than the sender's balance
    const token = await DappToken.deployed();
    try {
      await token.transfer.call(accounts[1], 9999999999999); //.call return the actual function return
      assert.fail;
    } catch (e) {
      assert(
        e.message.indexOf("revert") >= 0,
        "error message must contain revert"
      );
    }
    const receipt = await token.transfer(accounts[1], 250000, {
      from: accounts[0],
    });
    const success = await token.transfer.call(accounts[1], 250000, {
      from: accounts[0],
    });
    assert.equal(success, true, "returns true");
    //console.log(receipt.logs[0]);
    assert.equal(receipt.logs.length, 1, "triggers one event");
    assert.equal(
      receipt.logs[0].event,
      "Transfer",
      'should be the "Transfer" event'
    );
    assert.equal(
      receipt.logs[0].args._from,
      accounts[0],
      "logs the account the tokens are transferred from"
    );
    assert.equal(
      receipt.logs[0].args._to,
      accounts[1],
      "logs the account the tokens are transferred to"
    );
    assert.equal(
      receipt.logs[0].args._value.toNumber(),
      250000,
      "logs the transfer amount"
    );
    const receiverbalance = await token.balanceOf(accounts[1]);
    assert.equal(
      receiverbalance.toNumber(),
      250000,
      "adds the amount to the receiving account"
    );
    const newbalance = await token.balanceOf(accounts[0]);
    assert.equal(
      newbalance.toNumber(),
      750000,
      "decucts the amount to the receiving account"
    );
  });

  it("approves tokens for delegated transfer", async () => {
    const token = await DappToken.deployed();
    const success = await token.approve.call(accounts[1], 100);
    const receipt = await token.approve(accounts[1], 100, {
      from: accounts[0],
    });
    const allowance = await token.allowance(accounts[0], accounts[1]);
    assert.equal(success, true, "return true");
    assert.equal(receipt.logs.length, 1, "triggers one event");
    assert.equal(
      receipt.logs[0].event,
      "Approval",
      'should be the "Approval" event'
    );
    assert.equal(
      receipt.logs[0].args._owner,
      accounts[0],
      "logs the account the tokens are authorized by"
    );
    assert.equal(
      receipt.logs[0].args._spender,
      accounts[1],
      "logs the account the tokens are authorized to"
    );
    assert.equal(
      receipt.logs[0].args._value.toNumber(),
      100,
      "logs the transfer amount"
    );
    assert.equal(
      allowance.toNumber(),
      100,
      "stores the allowance for delegated transfer"
    );
  });
  it("handles delegated token transfers", async () => {
    const token = await DappToken.deployed();
    const fromAccount = accounts[2];
    const toAccount = accounts[3];
    const spendingAccount = accounts[4];
    // transfer some tokens to fromAccount
    await token.transfer(fromAccount, 100, { from: accounts[0] });
    // approve spendingAccount to spend 10 tokens from fromAccount
    await token.approve(spendingAccount, 10, { from: fromAccount });
    try {
      await token.transferFrom(fromAccount, toAccount, 99999, {
        from: spendingAccount,
      });
    } catch (e) {
      assert(
        e.message.indexOf("revert") >= 0,
        "cannot transfer value larger than 100"
      );
    }
    try {
      await token.transferFrom(fromAccount, toAccount, 20, {
        from: spendingAccount,
      });
    } catch (e) {
      assert(
        e.message.indexOf("revert") >= 0,
        "cannot transfer value larger than approved amount"
      );
    }
    const success = await token.transferFrom.call(fromAccount, toAccount, 10, {
      from: spendingAccount,
    });
    assert.equal(success, true, "success transfer amount");
    const receipt = await token.transferFrom(fromAccount, toAccount, 10, {
      from: spendingAccount,
    });
    assert.equal(receipt.logs.length, 1, "triggers one event");
    assert.equal(
      receipt.logs[0].event,
      "Transfer",
      'should be the "Transfer" event'
    );
    assert.equal(
      receipt.logs[0].args._from,
      fromAccount,
      "logs the account the tokens are authorized by"
    );
    assert.equal(
      receipt.logs[0].args._to,
      toAccount,
      "logs the account the tokens are authorized to"
    );
    assert.equal(
      receipt.logs[0].args._value.toNumber(),
      10,
      "logs the transfer amount"
    );
    const frombBalance = await token.balanceOf(fromAccount);
    assert.equal(
      frombBalance.toNumber(),
      90,
      "deducts the amount from the sending account"
    );
    const toBalance = await token.balanceOf(toAccount);
    assert.equal(
      toBalance.toNumber(),
      10,
      "add the amount to the receiving account"
    );
    const allowance = await token.allowance(fromAccount, spendingAccount);
    assert.equal(allowance.toNumber(), 0, "dedcutes the amount from allowance");
  });
});
