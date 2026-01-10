import React, { useState, useEffect } from 'react'

const COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
  '#10b981', '#06b6d4', '#6366f1', '#84cc16', '#f43f5e'
]

function ManageTagsModal({ isOpen, onClose, onTagsUpdated }) {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingTag, setEditingTag] = useState(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [saving, setSaving] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#3b82f6')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadTags()
    }
  }, [isOpen])

  const loadTags = async () => {
    try {
      setLoading(true)
      const response = await fetch('https://web-notes-nine.vercel.app/api/tags', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      setTags(Array.isArray(data) ? data : [])
    } catch (err) {
      setError('Eroare la încărcarea tag-urilor')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTag = async (e) => {
    e.preventDefault()
    if (!newTagName.trim()) return
    try {
      setCreating(true)
      const response = await fetch('https://web-notes-nine.vercel.app/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: newTagName,
          color: newTagColor
        })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setTags([...tags, data])
      setNewTagName('')
      if (onTagsUpdated) onTagsUpdated()
    } catch (err) {
      setError(err.message || 'Eroare la crearea tag-ului')
    } finally {
      setCreating(false)
    }
  }

  const handleEditTag = (tag) => {
    setEditingTag(tag.id)
    setEditName(tag.name)
    setEditColor(tag.color || '#3b82f6')
  }

  const handleSaveEdit = async () => {
    if (!editName.trim()) return
    try {
      setSaving(true)
      const response = await fetch(`https://web-notes-nine.vercel.app/api/tags/${editingTag}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: editName,
          color: editColor
        })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setTags(tags.map(t => t.id === editingTag ? { ...t, name: editName, color: editColor } : t))
      setEditingTag(null)
      if (onTagsUpdated) onTagsUpdated()
    } catch (err) {
      setError(err.message || 'Eroare la salvare')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTag = async (tagId, tagName) => {
    if (!window.confirm(`Sigur vrei să ștergi tag-ul "${tagName}"?`)) return
    try {
      const response = await fetch(`https://web-notes-nine.vercel.app/api/tags/${tagId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error)
      }
      setTags(tags.filter(t => t.id !== tagId))
      if (onTagsUpdated) onTagsUpdated()
    } catch (err) {
      setError(err.message || 'Eroare la ștergere')
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
        width: '90%',
        maxWidth: '500px',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'white'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
            Gestionează tag-uri
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '24px' }}>
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
              <button 
                onClick={() => setError('')}
                style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}
              >×</button>
            </div>
          )}

          {/* Create new tag */}
          <form onSubmit={handleCreateTag} style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Nume tag nou"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
              <button
                type="submit"
                disabled={creating || !newTagName.trim()}
                style={{
                  padding: '10px 16px',
                  background: '#1f2937',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {creating ? '...' : 'Adaugă'}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewTagColor(color)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    background: color,
                    border: newTagColor === color ? '2px solid #1f2937' : '2px solid transparent',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </form>

          {/* Tags list */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
              Se încarcă...
            </div>
          ) : tags.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
              Nu ai niciun tag
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tags.map(tag => (
                <div
                  key={tag.id}
                  style={{
                    padding: '12px',
                    background: '#f9fafb',
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  {editingTag === tag.id ? (
                    <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {COLORS.slice(0, 5).map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setEditColor(color)}
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '4px',
                              background: color,
                              border: editColor === color ? '2px solid #1f2937' : '1px solid #e5e7eb',
                              cursor: 'pointer'
                            }}
                          />
                        ))}
                      </div>
                      <button
                        onClick={handleSaveEdit}
                        disabled={saving}
                        style={{
                          padding: '6px 12px',
                          background: '#1f2937',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        {saving ? '...' : 'Salvează'}
                      </button>
                      <button
                        onClick={() => setEditingTag(null)}
                        style={{
                          padding: '6px 12px',
                          background: '#f3f4f6',
                          color: '#374151',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Anulează
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '4px',
                          background: tag.color || '#10b981'
                        }} />
                        <span style={{ fontSize: '14px', color: '#111827' }}>{tag.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleEditTag(tag)}
                          style={{
                            padding: '4px 10px',
                            background: '#f3f4f6',
                            color: '#374151',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Editează
                        </button>
                        <button
                          onClick={() => handleDeleteTag(tag.id, tag.name)}
                          style={{
                            padding: '4px 10px',
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Șterge
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ManageTagsModal
