import axios from 'axios';
import { useEffect, useState } from 'react';

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
    <div>
      <h3>
        Blocks
        {blocks.map((block) => {
          return <div key={block.hash}>{block.hash}</div>;
        })}
      </h3>
    </div>
  );
}
