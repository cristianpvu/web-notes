import React, { useState } from 'react'

function CreateGroupModal({ isOpen, onClose, onGroupCreated }) {
  const [groupName, setGroupName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!groupName.trim()) {
      setError('Numele grupului este obligatoriu')
      return
    }

    if (isPrivate && !password.trim()) {
      setError('Parola este obligatorie pentru grupuri private')
      return
    }

    try {
      setLoading(true)
      setError('')
      const response = await fetch('https://web-notes-nine.vercel.app/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: groupName,
          description: description || null,
          isPrivate: isPrivate,
          password: isPrivate ? password : null
        })
      })

      if (!response.ok) {
        throw new Error('Eroare la crearea grupului')
      }

      const newGroup = await response.json()
      onGroupCreated(newGroup)
      setGroupName('')
      setDescription('')
      setIsPrivate(false)
      setPassword('')
      onClose()
    } catch (err) {
      setError(err.message || 'Eroare la crearea grupului')
    } finally {
      setLoading(false)
    }
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
        borderRadius: '8px',
        padding: '24px',
        width: '90%',
        maxWidth: '450px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#111827', fontWeight: '600' }}>
          Creează grup nou
        </h2>

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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151'
            }}>
              Nume Grup *
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="ex: Grupa 1A"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151'
            }}>
              Descriere (opțional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Scurtă descriere a grupului..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151'
            }}>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => {
                  setIsPrivate(e.target.checked)
                  if (!e.target.checked) setPassword('')
                }}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer'
                }}
              />
              <span>Grup Privat</span>
            </label>
            <p style={{ margin: '6px 0 0 28px', fontSize: '12px', color: '#6b7280' }}>
              Grupurile private necesită parolă pentru a te alătura
            </p>
          </div>

          {isPrivate && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Parolă Grup *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Introdu o parolă pentru grup"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
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
                background: loading ? '#9ca3af' : '#1f2937',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {loading ? 'Se creează...' : 'Creează Grup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateGroupModal
