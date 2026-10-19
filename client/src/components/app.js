import axios from 'axios';
import { useEffect, useState } from 'react';

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
    <div>
      <h1>Wallet Info: </h1>
      {error && <p role='alert'>{error}</p>}
      <h3>Address: {walletInfo.address}</h3>
      <h3>Balance: {walletInfo.balance}</h3>
    </div>
  );
}
