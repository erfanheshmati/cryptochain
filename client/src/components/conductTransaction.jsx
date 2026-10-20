import axios from "axios"
import { useRef, useState } from "react"

export default function ConductTransaction() {
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const recipient = useRef()
    const amount = useRef()

    const handleFormSubmit = async (e) => {
        e.preventDefault()

        const recipientValue = recipient.current?.value
        const amountValue = amount.current?.value

        if (!recipientValue || !amountValue) {
            setError('Both fields are required')
            return
        }

        setError('')
        setLoading(true)

        axios
            .post("http://localhost:3000/api/transact", {
                recipient: recipientValue,
                amount: Number(amountValue),
            })
            .then((response) => {
                if (response.data.type === 'error') {
                    alert(response.data.message)
                } else {
                    alert('Success')
                }
            })
            .catch((err) => {
                alert(err.response?.data?.message || 'Transaction failed')
            })
            .finally(() => {
                setLoading(false)
            })
    }

    return (
        <form className='form' onSubmit={handleFormSubmit}>
            <input type="text" ref={recipient} placeholder='recipient' />
            <input type="number" ref={amount} placeholder='amount' />
            {error && <div className="error">*{error}</div>}
            <button type='submit'>{loading ? "Sending..." : "Send"}</button>
        </form>
    )
}
