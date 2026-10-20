import { useState } from "react"

export default function Block({ block }) {
    const [displayTransaction, setDisplayTransaction] = useState(false)

    const { timestamp, hash, data } = block
    const hashDisplay = `${hash.substring(0, 15)}...`
    const stringifiedData = JSON.stringify(data)
    const dataDisplay = stringifiedData.length > 35 ? `${stringifiedData.substring(0, 15)}...` : stringifiedData

    const toggleTransaction = () => setDisplayTransaction(!displayTransaction)

    return (
        <div className="block">
            <div>Hash: {hashDisplay}</div>
            <div>Timestamp: {new Date(timestamp).toLocaleString()}</div>
            <div onClick={toggleTransaction} style={{ cursor: "pointer" }}>Data: {displayTransaction ? JSON.stringify(data) : dataDisplay}</div>
        </div>
    )
}
