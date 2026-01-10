import React, { useState } from 'react'

function CreateSubjectModal({ isOpen, onClose, onSubjectCreated }) {
  const [subjectName, setSubjectName] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const predefinedColors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
    '#10b981', '#06b6d4', '#6366f1', '#84cc16', '#f43f5e'
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!subjectName.trim()) {
      setError('Numele materiei este obligatoriu')
      return
    }

    try {
      setLoading(true)
      setError('')
      const response = await fetch('https://web-notes-nine.vercel.app/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: subjectName,
          color: color
        })
      })

      if (!response.ok) {
        throw new Error('Eroare la crearea materiei')
      }

      const newSubject = await response.json()
      onSubjectCreated(newSubject)
      setSubjectName('')
      setColor('#3b82f6')
      onClose()
    } catch (err) {
      setError(err.message || 'Eroare la crearea materiei')
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
        borderRadius: '12px',
        padding: '24px',
        width: '90%',
        maxWidth: '500px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', color: '#111827' }}>
          Creează Materie Nouă
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
              Nume Materie *
            </label>
            <input
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="ex: Matematică, Fizică, Chimie"
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
              Culoare
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '12px'
            }}>
              {predefinedColors.map((c) => (
                <div
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    background: c,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: color === c ? '3px solid #111827' : '2px solid #e5e7eb',
                    transition: 'all 0.2s',
                    transform: color === c ? 'scale(1.1)' : 'scale(1)'
                  }}
                />
              ))}
            </div>
          </div>

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
                background: loading ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              {loading ? 'Se creează...' : 'Creează Materie'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateSubjectModal
