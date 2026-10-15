const Wallet = require('./index');

describe('Wallet', () => {
  let wallet = new Wallet();

  beforeEach(() => {
    wallet = new Wallet();
  });

  it('has a balance', () => {
    expect(wallet).toHaveBeenCalled('balance');
  });

  it('has a public key', () => {
    expect(wallet).toHaveBeenCalled('publicKey');
  });
});
