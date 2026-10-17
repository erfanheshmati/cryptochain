const express = require('express');
const Blockchain = require('./blockchain');
const Pubsub = require('./app/pubsub');
const tcpPortUsed = require('tcp-port-used');
const axios = require('axios');
const TransactionPool = require('./wallet/transaction-pool');
const Wallet = require('./wallet');
const TransactionMiner = require('./app/transaction-miner');

const app = express();
app.use(express.json()); // Parse incoming JSON requests

const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const pubsub = new Pubsub({ blockchain, transactionPool });
const wallet = new Wallet();
const transactionMiner = new TransactionMiner({
  blockchain,
  transactionPool,
  wallet,
  pubsub,
});

pubsub.run().catch((error) => {
  console.error('Redis Pub/Sub startup failed:', error);
});

// GET endpoints
app.get('/api/blocks', (req, res) => {
  res.json(blockchain.chain);
});

app.get('/api/transaction-pool-map', (req, res) => {
  res.json(transactionPool.transactionMap);
});

app.get('/api/mine-transactions', (req, res) => {
  transactionMiner.mineTransactions();
  res.redirect('/api/blocks');
});

app.get('/api/wallet-info', (req, res) => {
  res.json({ address: wallet.publicKey, balance: wallet.balance });
});

// POST endpoints
app.post('/api/mine', (req, res) => {
  const { data } = req.body;
  blockchain.addBlock({ data });
  pubsub.broadcastChain();
  res.redirect('/api/blocks');
});

app.post('/api/transact', async (req, res) => {
  let { recipient, amount } = req.body;
  let transaction = transactionPool.existingTransaction({
    inputAddress: wallet.publicKey,
  });
  amount = parseInt(amount); // Ensure amount is a number
  try {
    if (transaction) {
      transaction.update({ senderWallet: wallet, recipient, amount });
    } else {
      transaction = wallet.createTransaction({ recipient, amount });
    }
  } catch (error) {
    return res.json({ type: 'error', message: error.message });
  }

  transactionPool.setTransaction(transaction);
  await pubsub.broadcastTransaction(transaction);
  res.json({ transaction });
});

const rootPort = 3000;
let PORT = 3000;

const syncOnConnect = async () => {
  let response = await axios.get(`http://localhost:${rootPort}/api/blocks`);
  blockchain.replaceChain(response.data);

  response = await axios.get(
    `http://localhost:${rootPort}/api/transaction-pool-map`,
  );
  transactionPool.setMap(response.data);
};

tcpPortUsed.check(PORT, '127.0.0.1').then((inUse) => {
  if (inUse) {
    PORT = 3001; // Fallback port
  }

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    if (PORT !== rootPort) syncOnConnect();
  });
});
