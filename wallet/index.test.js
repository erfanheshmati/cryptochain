const Wallet = require('./index');
const { verifySignature } = require('../utils');
const Transaction = require('./transaction');

describe('Wallet', () => {
  let wallet = new Wallet();

  beforeEach(() => {
    wallet = new Wallet();
  });

  it('has a balance', () => {
    expect(wallet).toHaveProperty('balance');
  });

  it('has a public key', () => {
    expect(wallet).toHaveProperty('publicKey');
  });

  describe('signing data', () => {
    const data = 'some-data';

    it('verifies a signature', () => {
      expect(
        verifySignature({
          publicKey: wallet.publicKey,
          signature: wallet.sign(data),
          data,
        }),
      ).toBe(true);
    });

    it('does not verify an invalid signature', () => {
      expect(
        verifySignature({
          publicKey: wallet.publicKey,
          signature: new Wallet().sign(data),
          data,
        }),
      ).toBe(false);
    });
  });

  describe('createTransaction()', () => {
    describe('and the amount exceeds the balance', () => {
      it('throws an error', () => {
        expect(() =>
          wallet.createTransaction({
            amount: 999999,
            recipient: 'recipient-public-key',
          }),
        ).toThrow('Amount exceeds balance');
      });
    });

    describe('and the amount is valid', () => {
      let transaction, amount, recipient;

      beforeEach(() => {
        amount = 50;
        recipient = 'recipient-public-key';
        transaction = wallet.createTransaction({ amount, recipient });
      });

      it('creates a transaction', () => {
        expect(transaction instanceof Transaction).toBe(true);
      });

      it('matches the transaction input with the wallet', () => {
        expect(transaction.input.address).toEqual(wallet.publicKey);
      });

      it('outputs the correct transaction amount', () => {
        expect(transaction.outputMap[recipient]).toEqual(amount);
      });
    });
  });
});
