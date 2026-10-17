const Wallet = require('./index');
const { verifySignature } = require('../utils');
const Transaction = require('./transaction');
const Blockchain = require('../blockchain');
const { STARTING_BALANCE } = require('../config');

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

    describe('calculateBalance()', () => {
      let blockchain;

      beforeEach(() => {
        blockchain = new Blockchain();
      });

      describe('and there are no outputs for the wallet', () => {
        it('returns the `STARTING_BALANCE`', () => {
          expect(
            Wallet.calculateBalance({
              chain: blockchain.chain,
              address: wallet.publicKey,
            }),
          ).toEqual(STARTING_BALANCE);
        });
      });

      describe('and there are outputs for the wallet', () => {
        let transactionOne, transactionTwo;

        beforeEach(() => {
          transactionOne = new Wallet().createTransaction({
            recipient: wallet.publicKey,
            amount: 50,
          });

          transactionTwo = new Wallet().createTransaction({
            recipient: wallet.publicKey,
            amount: 60,
          });

          blockchain.addBlock({ data: [transactionOne, transactionTwo] });
        });

        it('adds the sum of all outputs to the wallet balance', () => {
          expect(
            Wallet.calculateBalance({
              chain: blockchain.chain,
              address: wallet.publicKey,
            }),
          ).toEqual(
            STARTING_BALANCE +
              transactionOne.outputMap[wallet.publicKey] +
              transactionTwo.outputMap[wallet.publicKey],
          );
        });
      });

      describe('and a chain is passed', () => {
        it('calls calculateBalance()', () => {
          const calculateBalanceMock = jest
            .spyOn(Wallet, 'calculateBalance')
            .mockReturnValue(STARTING_BALANCE);

          wallet.createTransaction({
            amount: 10,
            recipient: 'recipient-public-key',
            chain: new Blockchain().chain,
          });

          expect(calculateBalanceMock).toHaveBeenCalled();
          calculateBalanceMock.mockRestore();
        });
      });
    });
  });
});
