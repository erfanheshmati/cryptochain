import axios from 'axios';
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import Transaction from './transaction'

export default function TransactionPool() {
    const [transactionMap, setTransactionMap] = useState({})
    const [error, setError] = useState('')

    const navigate = useNavigate()

    const getTransactions = async () => {
        await axios.get(`${document.location.origin}/api/transaction-pool-map`).then((response) => {
            setTransactionMap(response.data)
        }).catch(() => {
            setError('Unable to load the transaction pool. Make sure the API server is running.')
        })
    }

    useEffect(() => {
        getTransactions();

        const intervalId = setInterval(getTransactions, 1000);

        return () => clearInterval(intervalId);
    }, []);

    const handleMine = async () => {
        await axios.get(`${document.location.origin}/api/mine-transactions`)
        alert('Success')
        navigate('/')
    }

    return (
        <div className='transaction-pool'>
            <img src="/images/pool.png" alt="" />
            <Link to="/">
                <button>Back to home</button>
            </Link>
            <button onClick={handleMine}>Mine transactions</button>

            {error && <p role='alert'>{error}</p>}

            {Object.values(transactionMap).map(transaction => {
                return <div key={transaction.id}>
                    <hr />
                    <Transaction transaction={transaction} />
                </div>
            })}
        </div>
    )
}
