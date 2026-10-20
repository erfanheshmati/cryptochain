import axios from 'axios';
import { useEffect, useState } from 'react';
import Blocks from './blocks';

export default function App() {
  const [walletInfo, setWalletInfo] = useState({
    address: '',
    balance: 0,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    axios
      .get('http://localhost:3000/api/wallet-info')
      .then((response) => {
        setWalletInfo(response.data);
      })
      .catch(() => {
        setError(
          'Unable to load wallet info. Make sure the API server is running.',
        );
      });
  }, []);

  return (
    <>
      <div className='wallet'>
        <div>
          <img src='/images/wallet.png' />
        </div>
        <div>
          <h1>Your Wallet</h1>
          {error && <p role='alert'>{error}</p>}
          <div className='address'>
            <i className='fas fa-key'></i>
            Address: {walletInfo.address}
          </div>
          <div className='balance'>
            <i className='fas fa-coins'></i>
            Balance: {walletInfo.balance}
          </div>
        </div>
      </div>
      <Blocks />
    </>
  );
}
