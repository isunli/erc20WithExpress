const DappTokenSale = artifacts.require("./DappTokenSale.sol");
const DappToken = artifacts.require("./DappToken.sol");

contract("DappTokenSale", async (accounts) => {
  const buyer = accounts[1];
  const admin = accounts[0];
  const tokenPrice = 1000000000000000; //wei
  // Provide 75% of all tokens to the token sale
  const tokenAvailable = 750000;
  const numberOfTokens = 10;
  it("initializes the contract with the correct values", async () => {
    const tokenSale = await DappTokenSale.deployed();
    const address = await tokenSale.address;
    assert.notEqual(address, 0x0, "has contract address");
    const tokenContract = await tokenSale.tokenContract();
    assert.notEqual(tokenContract, 0x0, "has contract address");
    const price = await tokenSale.tokenPrice();
    assert.equal(price, tokenPrice, "has correct token price");
  });

  it("facilitates token buying", async () => {
    const tokenSale = await DappTokenSale.deployed();
    const token = await DappToken.deployed();
    await token.transfer(tokenSale.address, tokenAvailable, {
      from: admin,
    });
    const receipt = await tokenSale.buyTokens(numberOfTokens, {
      from: buyer,
      value: numberOfTokens * tokenPrice,
    });

    assert.equal(receipt.logs.length, 1, "triggers one event");
    assert.equal(receipt.logs[0].event, "Sell", 'should be the "Sell" event');
    assert.equal(
      receipt.logs[0].args._buyer,
      buyer,
      "logs the account that purchased the tokens"
    );
    assert.equal(
      receipt.logs[0].args._amount,
      numberOfTokens,
      "logs the number of tokens purchased"
    );

    const amount = await tokenSale.tokenSold();
    assert.equal(
      amount.toNumber(),
      numberOfTokens,
      "increments the number of tokens sold"
    );
    const tokenSaleBalance = await token.balanceOf(tokenSale.address);
    const buyerBalance = await token.balanceOf(buyer);
    assert.equal(tokenSaleBalance.toNumber(), tokenAvailable - numberOfTokens);
    assert.equal(buyerBalance.toNumber(), numberOfTokens);
    try {
      await tokenSale.buyTokens(numberOfTokens, {
        from: buyer,
        value: 1,
      });
      assert.fail;
    } catch (e) {
      assert(
        e.message.indexOf("revert") >= 0,
        "msg.value must equal number of tokens in wei"
      );
    }

    try {
      await tokenSale.buyTokens(800000, {
        from: buyer,
        value: 800000,
      });
      assert.fail;
    } catch (e) {
      // console.log(e);
      assert(
        e.message.indexOf("revert") >= 0,
        "cannot purchase more tokens than 750000"
      );
    }
  });
  it("ends token sale", async () => {
    const tokenSale = await DappTokenSale.deployed();
    const token = await DappToken.deployed();
    // try to end sale from account other thean the admin
    try {
      await tokenSale.endSale({ from: buyer });
      assert.fail;
    } catch (e) {
      assert(e.message.indexOf("revert") >= 0, "must be admin to end sale");
    }
    const receipt = await tokenSale.endSale({ from: admin });
    const balance = await token.balanceOf(admin);
    assert.equal(
      balance.toNumber(),
      999990,
      "returns all unsold dapp tokens to admin"
    );
    try {
      const newTokenPrice = await tokenSale.tokenPrice();
      assert.fail;
    } catch (e) {
      assert(e.message.indexOf("aren't valid") >= 0);
    }
  });
});
