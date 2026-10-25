import axios from 'axios';
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import Transaction from './transaction'

export default function TransactionPool() {
    const [transactionMap, setTransactionMap] = useState({})
    const [error, setError] = useState('')

    useEffect(() => {
        axios.get("http://localhost:3000/api/transaction-pool-map").then((response) => {
            setTransactionMap(response.data)
        }).catch(() => {
            setError('Unable to load the transaction pool. Make sure the API server is running.')
        })
    }, [])

    return (
        <div className='transaction-pool'>
            <img src="/images/pool.png" alt="" />
            <Link to="/">
                <button>Back to home</button>
            </Link>
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
