import React, { useState, useEffect } from 'react'
import { sendMagicLink, verifyToken } from '../services/api'
import { useLanguage } from '../i18n/LanguageContext'

function Login({ onLogin }) {
  const { t } = useLanguage()
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
      setError(err.response?.data?.error || t('errorTokenInvalid'))
      setVerifying(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!email.endsWith('@stud.ase.ro')) {
      setError(t('errorInvalidEmail'))
      return
    }

    setLoading(true)
    
    try {
      await sendMagicLink(email)
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.error || t('errorSendingEmail'))
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
      background: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '48px',
        width: '100%',
        maxWidth: '480px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ 
            margin: '0 0 8px 0',
            fontSize: '28px',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            {t('appTitle')}
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
              borderTopColor: '#1f2937',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ fontSize: '16px', margin: 0 }}>{t('verifyingAuth')}</p>
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
                placeholder={t('emailPlaceholder')}
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
                onFocus={(e) => e.target.style.borderColor = '#1f2937'}
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
                padding: '12px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'white',
                background: loading ? '#9ca3af' : '#1f2937',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.background = '#374151'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.background = '#1f2937'
                }
              }}
            >
              {loading ? t('sending') : t('sendMagicLink')}
            </button>

            <p style={{
              marginTop: '24px',
              fontSize: '13px',
              color: '#6b7280',
              textAlign: 'center',
              lineHeight: '1.6'
            }}>
              {t('magicLinkInfo')}
            </p>
          </form>
        ) : (
          <div style={{ 
            padding: '32px 24px',
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: '#1f2937',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '24px',
              color: 'white'
            }}>
              ✓
            </div>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937'
            }}>
              {t('emailSentSuccess')}
            </h3>
            <p style={{
              margin: '0 0 8px 0',
              fontSize: '15px',
              color: '#047857',
              lineHeight: '1.6'
            }}>
              {t('magicLinkSentTo')}
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
              {t('checkInbox')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Login