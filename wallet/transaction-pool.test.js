const TransactionPool = require('./transaction-pool');
const Transaction = require('./transaction');
const Wallet = require('./index');

describe('TransactionPool', () => {
  let transactionPool, transaction, senderWallet;

  beforeEach(() => {
    transactionPool = new TransactionPool();
    senderWallet = new Wallet();
    transaction = new Transaction({
      senderWallet,
      recipient: 'recipient-address',
      amount: 50,
    });
  });

  describe('setTransaction()', () => {
    it('adds a transaction to the pool', () => {
      transactionPool.setTransaction(transaction);
      expect(transactionPool.transactionMap[transaction.id]).toBe(transaction);
    });
  });

  describe('existingTransaction()', () => {
    it('returns an existing transaction given an input address', () => {
      transactionPool.setTransaction(transaction);
      const existingTransaction = transactionPool.existingTransaction({
        inputAddress: senderWallet.publicKey,
      });
      expect(existingTransaction).toBe(transaction);
    });
  });
});
