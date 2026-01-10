import React, { useState, useEffect } from 'react'
import { sendMagicLink, verifyToken } from '../services/api'

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    const hash = window.location.hash.substring(1)
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        padding: '48px',
        width: '100%',
        maxWidth: '480px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ 
            margin: '0 0 8px 0',
            fontSize: '32px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            NoteShare
          </h1>
        </div>
        
        {verifying ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            color: '#6b7280'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e5e7eb',
              borderTopColor: '#667eea',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ fontSize: '16px', margin: 0 }}>Se verifică autentificarea...</p>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : !success ? (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="numeprenume@stud.ase.ro"
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            {error && (
              <div style={{ 
                padding: '12px 16px',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                borderRadius: '8px',
                marginBottom: '24px',
                fontSize: '14px',
                border: '1px solid #fecaca'
              }}>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '16px',
                fontWeight: '600',
                color: 'white',
                background: loading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)'
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)'
              }}
            >
              {loading ? 'Se trimite...' : 'Trimite link de autentificare'}
            </button>

            <p style={{
              marginTop: '24px',
              fontSize: '13px',
              color: '#6b7280',
              textAlign: 'center',
              lineHeight: '1.6'
            }}>
              Vei primi un email cu un link pentru autentificare.
            </p>
          </form>
        ) : (
          <div style={{ 
            padding: '32px 24px',
            backgroundColor: '#ecfdf5',
            border: '2px solid #10b981',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: '#10b981',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '32px',
              color: 'white'
            }}>
              ✓
            </div>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '20px',
              fontWeight: '700',
              color: '#065f46'
            }}>
              Email trimis cu succes
            </h3>
            <p style={{
              margin: '0 0 8px 0',
              fontSize: '15px',
              color: '#047857',
              lineHeight: '1.6'
            }}>
              Am trimis un link de autentificare la
            </p>
            <p style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: '#065f46'
            }}>
              {email}
            </p>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: '#047857',
              lineHeight: '1.6'
            }}>
              Verifică inbox-ul și dă click pe link pentru a te autentifica.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Login