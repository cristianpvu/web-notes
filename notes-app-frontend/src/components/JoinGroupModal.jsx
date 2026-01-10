import React, { useState } from 'react'

function JoinGroupModal({ isOpen, onClose, onGroupJoined }) {
  const [groupId, setGroupId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState('id') // 'id' or 'password'
  const [groupInfo, setGroupInfo] = useState(null)

  const handleCheckGroup = async (e) => {
    e.preventDefault()
    if (!groupId.trim()) {
      setError('Introdu ID-ul grupului')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      // Check if group exists and if it's private
      const checkResponse = await fetch(`https://web-notes-nine.vercel.app/api/groups/${groupId.trim()}/check`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const checkData = await checkResponse.json()

      if (!checkResponse.ok) {
        throw new Error(checkData.error || 'Grupul nu a fost găsit')
      }

      setGroupInfo(checkData)

      if (checkData.isPrivate) {
        // Group is private, ask for password
        setStep('password')
        setLoading(false)
      } else {
        // Group is public, join directly
        await joinGroup()
      }
    } catch (err) {
      setError(err.message || 'Eroare la verificarea grupului')
      setLoading(false)
    }
  }

  const joinGroup = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch(`https://web-notes-nine.vercel.app/api/groups/${groupId.trim()}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          password: password || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Eroare la alăturarea în grup')
      }

      // Fetch the full group data
      const groupResponse = await fetch(`https://web-notes-nine.vercel.app/api/groups/${groupId.trim()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const groupData = await groupResponse.json()

      onGroupJoined(groupData)
      handleClose()
    } catch (err) {
      setError(err.message || 'Eroare la alăturarea în grup')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (!password.trim()) {
      setError('Introdu parola grupului')
      return
    }
    await joinGroup()
  }

  const handleClose = () => {
    setGroupId('')
    setPassword('')
    setError('')
    setStep('id')
    setGroupInfo(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        width: '90%',
        maxWidth: '450px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#111827' }}>
          Alătură-te unui Grup
        </h2>
        <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#6b7280' }}>
          {step === 'id' 
            ? 'Introdu ID-ul grupului primit de la administratorul grupului'
            : `Grupul "${groupInfo?.name}" este privat. Introdu parola pentru a te alătura.`
          }
        </p>

        {error && (
          <div style={{
            padding: '12px',
            background: '#fee2e2',
            color: '#dc2626',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {step === 'id' ? (
          <form onSubmit={handleCheckGroup}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                ID Grup
              </label>
              <input
                type="text"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                placeholder="ex: abc123-def456-..."
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  boxSizing: 'border-box'
                }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Anulează
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  background: loading ? '#9ca3af' : '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {loading ? 'Se verifică...' : 'Continuă'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit}>
            <div style={{ 
              padding: '12px', 
              background: '#f0fdf4', 
              borderRadius: '8px', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '20px' }}>🔒</span>
              <span style={{ fontSize: '14px', color: '#15803d' }}>
                Grup privat: <strong>{groupInfo?.name}</strong>
              </span>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Parolă Grup
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Introdu parola grupului"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setStep('id')
                  setPassword('')
                  setError('')
                }}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Înapoi
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  background: loading ? '#9ca3af' : '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {loading ? 'Se procesează...' : 'Alătură-te'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default JoinGroupModal
