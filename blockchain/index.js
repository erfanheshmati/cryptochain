const Block = require('./block');
const { cryptoHash } = require('../utils');
const { MINING_REWARD, REWARD_INPUT } = require('../config');
const Transaction = require('../wallet/transaction');
const Wallet = require('../wallet');

class Blockchain {
  constructor() {
    this.chain = [Block.genesis()];
  }

  addBlock({ data }) {
    const newBlock = Block.mineBlock({
      lastBlock: this.chain[this.chain.length - 1],
      data,
    });
    this.chain.push(newBlock);
  }

  validTransactionData({ chain }) {
    return Blockchain.validTransactionData({ chain });
  }

  static isValidChain(chain) {
    // object is reference type so must comapre their values not references
    if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis()))
      return false;

    for (let i = 1; i < chain.length; i++) {
      const block = chain[i];
      const actualLastHash = chain[i - 1].hash;
      const lastDifficulty = chain[i - 1].difficulty;

      const { timestamp, lastHash, hash, data, nonce, difficulty } = block;

      if (lastHash !== actualLastHash) return false;
      if (Math.abs(difficulty - lastDifficulty) > 1) return false;
      if (hash !== cryptoHash(timestamp, lastHash, data, nonce, difficulty))
        return false;
    }

    return true;
  }

  replaceChain(chain, onSuccess) {
    if (chain.length <= this.chain.length) {
      console.error('the incoming chain must be longer');
      return;
    }
    if (!Blockchain.isValidChain(chain)) {
      console.error('the incoming chain must be valid');
      return;
    }
    if (onSuccess) onSuccess();
    console.log('replacing chain with: ', chain);
    this.chain = chain;
  }

  static validTransactionData({ chain }) {
    for (let i = 1; i < chain.length; i++) {
      const block = chain[i];
      const transactionSet = new Set();
      let rewardTransactionCount = 0;

      if (!Array.isArray(block.data)) {
        console.error('Block data must be an array');
        return false;
      }

      for (const transaction of block.data) {
        if (
          !transaction ||
          typeof transaction !== 'object' ||
          !transaction.input ||
          typeof transaction.input !== 'object' ||
          !transaction.outputMap ||
          typeof transaction.outputMap !== 'object' ||
          Array.isArray(transaction.outputMap)
        ) {
          console.error('Malformed transaction');
          return false;
        }

        if (transaction.input.address === REWARD_INPUT.address) {
          rewardTransactionCount += 1;
          if (rewardTransactionCount > 1) {
            console.error('Miner rewards exceed limit');
            return false;
          }

          const rewardOutputs = Object.values(transaction.outputMap);
          if (
            rewardOutputs.length !== 1 ||
            rewardOutputs[0] !== MINING_REWARD
          ) {
            console.error('Miner reward amount is invalid');
            return false;
          }
        } else {
          if (!Transaction.validTransaction(transaction)) {
            console.error('Invalid transaction');
            return false;
          }

          const trueBalance = Wallet.calculateBalance({
            chain: chain.slice(0, i),
            address: transaction.input.address,
          });

          if (transaction.input.amount !== trueBalance) {
            console.error('Invalid input amount');
            return false;
          }
          const transactionKey = JSON.stringify(transaction);
          if (transactionSet.has(transactionKey)) {
            console.error(
              'An identical transaction appears more than once in the block',
            );
            return false;
          }
          transactionSet.add(transactionKey);
        }
      }
    }
    return true;
  }
}

module.exports = Blockchain;
