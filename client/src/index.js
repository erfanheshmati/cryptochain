import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router';
import App from './components/app';
import './style.css';
import ConductTransaction from './components/conductTransaction';
import TransactionPool from './components/transactionPool';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path='/' element={<App />} />
      <Route path='/transact' element={<ConductTransaction />} />
      <Route path='/transaction-pool' element={<TransactionPool />} />
    </Routes>
  </BrowserRouter>,
);
