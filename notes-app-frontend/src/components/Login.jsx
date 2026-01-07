import React, { useState, useEffect } from 'react'
import { sendMagicLink, verifyToken } from '../services/api'

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    const hash = window.location.hash.substring(1) // Elimină #
    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')
    
    if (accessToken) {
      handleTokenVerification(accessToken)
    }
  }, [])


  const handleTokenVerification = async (token) => {
    setVerifying(true)
    setError('')
    
    try {
      const data = await verifyToken(token)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      window.history.replaceState({}, document.title, '/')
      onLogin(data.user)
    } catch (err) {
      setError(err.response?.data?.error || 'Token invalid sau expirat. Încearcă să te autentifici din nou.')
      setVerifying(false)
    }
  }


  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!email.endsWith('@stud.ase.ro')) {
      setError('Trebuie să folosești adresa de email instituțională (@stud.ase.ro)')
      return
    }

    setLoading(true)
    
    try {
      await sendMagicLink(email)
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Eroare la trimiterea email-ului. Încearcă din nou.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>NotesApp - Autentificare</h1>
      <p>Conectează-te cu contul instituțional</p>
      
      {verifying ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>Se verifică autentificarea...</p>
        </div>
      ) : !success ? (
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">Email instituțional:</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="numeprenume@stud.ase.ro"
              required
              disabled={loading}
            />
          </div>

          {error && <div style={{ color: 'red', margin: '10px 0' }}>{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Se trimite...' : 'Trimite link de autentificare'}
          </button>
        </form>
      ) : (
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#d4edda', 
          color: '#155724', 
          borderRadius: '4px',
          marginTop: '20px'
        }}>
          <h3>✓ Email trimis cu succes!</h3>
          <p>Am trimis un link de autentificare la <strong>{email}</strong></p>
          <p>Verifică inbox-ul și dă click pe link pentru a te autentifica.</p>
        </div>
      )}
    </div>
  )
}

export default Login
