const express = require("express");
const app = express();
const Web3 = require("web3");
const contract = require("@truffle/contract");
const fs = require("fs");
const web3 = new Web3.providers.HttpProvider("http://localhost:8545");
//const web3 = new Web3("ws://localhost:8545");
// Should use web3 directly in the client app, here we just show a demo
// new Web3(window.ethereum)
const TokenSaleABI = JSON.parse(
  fs.readFileSync("./build/contracts/DappTokenSale.json")
);
const TokenABI = JSON.parse(
  fs.readFileSync("./build/contracts/DappToken.json")
);
const Token = contract(TokenABI);
const TokenSale = contract(TokenSaleABI);
Token.setProvider(web3);
TokenSale.setProvider(web3);

app.get("/", async (req, res) => {
  const tokenSale = await TokenSale.deployed();
  const token = await Token.deployed();
  const tokenPrice = await tokenSale.tokenPrice();
  res.json({
    tokenAddress: token.address,
    tokenSaleContractAddress: tokenSale.address,
    tokenPrice: tokenPrice / 10 ** 18,
  });
});
app.get("/balance/:accountId", async (req, res) => {
  const token = await Token.deployed();

  res.json({
    balance: (await token.balanceOf(req.params.accountId)).toNumber(),
  });
});
app.get("/transfer", async (req, res) => {
  const { from, to, value } = req.query;
  const token = await Token.deployed();
  const receipt = await Token.transfer(from, to, value);
  res.json({
    receipt,
  });
});
app.get("/purchase", async (req, res) => {
  const { from, numberOfToken } = req.query;
  const token = await Token.deployed();
  const receipt = await Token.transfer(from, to, value);
  res.json({
    receipt,
  });
});
app.listen(3000, () => {
  console.log("on port 3000");
});
