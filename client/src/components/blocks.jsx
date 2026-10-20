import axios from 'axios';
import { useEffect, useState } from 'react';
import Block from './block';

export default function Blocks() {
  const [blocks, setBlocks] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get('http://localhost:3000/api/blocks')
      .then((response) => {
        setBlocks(response.data);
      })
      .catch(() => {
        setError('Unable to load blocks. Make sure the API server is running.');
      });
  }, []);

  return (
    <div className='blocks'>
      <div className='header'>
        <img src="/images/blockchain.png" alt="" />
        <h1>Cryptochain</h1>
      </div>
      {blocks.map((block) => {
        // return <div key={block.hash} className='block'>{block.hash}</div>;
        return <Block key={block.hash} block={block} />
      })}
    </div>
  );
}
