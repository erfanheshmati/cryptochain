const express = require('express');
const Blockchain = require('./blockchain');
const Pubsub = require('./app/pubsub');
const tcpPortUsed = require('tcp-port-used');
const axios = require('axios');
const TransactionPool = require('./wallet/transaction-pool');
const Wallet = require('./wallet');
const TransactionMiner = require('./app/transaction-miner');
const path = require('path');

const app = express();
const developmentOrigins = new Set([
  'http://localhost:1234',
  'http://127.0.0.1:1234',
]);
app.use(express.static(path.join(__dirname, './client/dist')));
app.use(express.json()); // Parse incoming JSON requests
app.use('/api', (req, res, next) => {
  const origin = req.get('Origin');

  if (developmentOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

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
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './client/dist/index.html'));
});

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

const walletFoo = new Wallet();
const walletBar = new Wallet();

const generateWalletTransaction = ({ wallet, recipient, amount }) => {
  const transaction = wallet.createTransaction({
    recipient,
    amount,
    chain: blockchain.chain,
  });
  transactionPool.setTransaction(transaction);
};

const walletAction = () =>
  generateWalletTransaction({
    wallet,
    recipient: walletFoo.publicKey,
    amount: 5,
  });

const walletFooAction = () =>
  generateWalletTransaction({
    wallet: walletFoo,
    recipient: walletBar.publicKey,
    amount: 10,
  });

const walletBarAction = () =>
  generateWalletTransaction({
    wallet: walletBar,
    recipient: wallet.publicKey,
    amount: 15,
  });

for (let i = 0; i < 10; i++) {
  if (i % 3 === 0) {
    walletAction();
    walletFooAction();
  } else if (i % 3 === 1) {
    walletAction();
    walletBarAction();
  } else {
    walletFooAction();
    walletBarAction();
  }

  transactionMiner.mineTransactions();
}

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
