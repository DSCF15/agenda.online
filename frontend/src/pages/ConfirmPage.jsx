import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

const ConfirmPage = () => {
  const { token } = useParams()
  const [searchParams] = useSearchParams()
  const tenantId = searchParams.get('tenant') // Precisamos disto para o header x-tenant
  const [status, setStatus] = useState('loading') // loading, success, error

  useEffect(() => {
    if (token && tenantId) {
      fetch('http://localhost:5000/api/appointments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant': tenantId
        },
        body: JSON.stringify({ token })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) setStatus('success')
        else setStatus('error')
      })
      .catch(() => setStatus('error'))
    }
  }, [token, tenantId])

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 text-center">
      {status === 'loading' && <p>A confirmar o seu horário...</p>}
      
      {status === 'success' && (
        <div>
          <h1 className="text-3xl text-yellow-500 font-bold mb-4">Confirmado! ✅</h1>
          <p>O seu agendamento está seguro. Esperamos por si.</p>
        </div>
      )}

      {status === 'error' && (
        <div>
          <h1 className="text-3xl text-red-500 font-bold mb-4">Ups! ⏳</h1>
          <p>O tempo limite expirou ou o link é inválido.</p>
          <p>Por favor, faça uma nova marcação.</p>
        </div>
      )}
    </div>
  )
}

export default ConfirmPage