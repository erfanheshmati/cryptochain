const redis = require('redis');

const CHANNELS = {
  TEST: 'TEST',
  BLOCKCHAIN: 'BLOCKCHAIN',
  TRANSACTION: 'TRANSACTION',
};

class PubSub {
  constructor({ blockchain, transactionPool }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.publisher = redis.createClient();
    this.subscriber = redis.createClient();

    this.publisher.on('error', (error) => {
      console.error('Redis publisher error:', error);
    });
    this.subscriber.on('error', (error) => {
      console.error('Redis subscriber error:', error);
    });
  }

  async run() {
    await Promise.all([this.publisher.connect(), this.subscriber.connect()]);

    await this.subscriber.subscribe(CHANNELS.TEST, (message, channel) => {
      this.handleMessage(channel, message);
    });

    await this.subscriber.subscribe(CHANNELS.BLOCKCHAIN, (message, channel) => {
      this.handleMessage(channel, message);
    });

    await this.subscriber.subscribe(
      CHANNELS.TRANSACTION,
      (message, channel) => {
        this.handleMessage(channel, message);
      },
    );
  }

  async publish({ channel, message }) {
    if (!this.publisher.isOpen) {
      await this.publisher.connect();
    }

    await this.publisher.publish(channel, message);
  }

  async broadcastChain() {
    await this.publish({
      channel: CHANNELS.BLOCKCHAIN,
      message: JSON.stringify(this.blockchain.chain),
    });
  }

  async broadcastTransaction(transaction) {
    await this.publish({
      channel: CHANNELS.TRANSACTION,
      message: JSON.stringify(transaction),
    });
  }

  handleMessage(channel, message) {
    const parsedMessage = JSON.parse(message);

    switch (channel) {
      case CHANNELS.BLOCKCHAIN:
        this.blockchain.replaceChain(parsedMessage);
        break;
      case CHANNELS.TRANSACTION:
        this.transactionPool.setTransaction(parsedMessage);
        break;
      default:
        return;
    }
  }
}

if (require.main === module) {
  async function main() {
    const testPubSub = new PubSub({ blockchain: null });

    await testPubSub.run();
    await testPubSub.publish({
      channel: CHANNELS.TEST,
      message: 'Hello, Redis Pub/Sub!',
    });
  }

  main().catch((error) => {
    console.error('Redis Pub/Sub failed:', error);
    process.exitCode = 1;
  });
}

module.exports = PubSub;
