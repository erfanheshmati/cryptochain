const express = require('express');
const Blockchain = require('./blockchain');
const Pubsub = require('./pubsub');
const tcpPortUsed = require('tcp-port-used');

const app = express();
app.use(express.json()); // Parse incoming JSON requests

const blockchain = new Blockchain();
const pubsub = new Pubsub({ blockchain });

pubsub.run().catch((error) => {
  console.error('Redis Pub/Sub startup failed:', error);
});

app.get('/api/blocks', (req, res) => {
  res.json(blockchain.chain);
});

app.post('/api/mine', (req, res) => {
  const { data } = req.body;
  blockchain.addBlock({ data });
  pubsub.broadcastChain();
  res.redirect('/api/blocks');
});

let PORT = 3000;

tcpPortUsed.check(PORT, '127.0.0.1').then((inUse) => {
  if (inUse) {
    PORT = 3001; // Fallback port
  }
  app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
});
