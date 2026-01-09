import React, { useState } from 'react'
import { formatDateTime } from '../lib/utils'
import { updateNote } from '../services/api'


function ViewNoteModal({ note, isOpen, onClose, onNoteUpdated, onShare, readOnly = false }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    title: note?.title || '',
    content: note?.rawContent || note?.content || ''
  })
  const [saving, setSaving] = useState(false)

  if (!isOpen || !note) return null


  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await updateNote(note.id, editData)
      onNoteUpdated(updated)
      setIsEditing(false)
    } catch (err) {
      alert('Eroare la salvarea modificărilor')
    } finally {
      setSaving(false)
    }
  }


  const handleCancelEdit = () => {
    setEditData({
      title: note.title,
      content: note.rawContent || note.content
    })
    setIsEditing(false)
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      overflowY: 'auto'
    }}>
      <div style={{
        background: '#fffef7',
        borderRadius: '4px',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        border: '1px solid #d4d1c5'
      }}>
        {/* Header academic cu acțiuni */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '24px 32px',
          borderBottom: '3px solid #5a67d8',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            {isEditing ? (
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                style={{
                  flex: 1,
                  fontSize: '24px',
                  fontWeight: '600',
                  border: '2px solid white',
                  background: 'rgba(255,255,255,0.9)',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  marginRight: '16px'
                }}
              />
            ) : (
              <h2 style={{ 
                margin: 0, 
                fontSize: '24px', 
                fontWeight: '600',
                color: 'white',
                flex: 1,
                lineHeight: '1.4'
              }}>
                {note.title}
              </h2>
            )}
            
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '20px',
                fontWeight: 'bold'
              }}
            >
              ✕
            </button>
          </div>

          {/* Meta informații */}
          <div style={{ 
            marginTop: '12px',
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.9)'
          }}>
            {note.subject && (
              <span style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '4px 12px',
                borderRadius: '12px',
                fontWeight: '500'
              }}>
                📚 {note.subject.name}
              </span>
            )}
            {note.courseDate && (
              <span>📅 {formatDateTime(note.courseDate)}</span>
            )}
            <span>✏️ Actualizat {formatDateTime(note.updatedAt)}</span>
          </div>
        </div>

        {/* Bara de acțiuni */}
        {!readOnly && (
          <div style={{
            padding: '16px 32px',
            background: '#f9f8f3',
            borderBottom: '1px solid #e8e6dd',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            position: 'sticky',
            top: '110px',
            zIndex: 9
          }}>
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: '8px 16px',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  ✏️ Editează
                </button>
                <button
                  onClick={() => onShare(note)}
                  style={{
                    padding: '8px 16px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  🔗 Distribuie
                </button>
              {note.sourceUrl && (
                <a
                  href={note.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '8px 16px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  🔗 Sursă: {note.sourceType || 'Link'}
                </a>
              )}
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '8px 16px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {saving ? '⏳ Se salvează...' : '✓ Salvează'}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                style={{
                  padding: '8px 16px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                ✕ Anulează
              </button>
            </>
          )}
          </div>
        )}

        {/* Conținut notița - stil academic */}
        <div style={{
          padding: '32px 48px 48px',
          background: '#fffef7',
          minHeight: '400px'
        }}>
          {/* Tag-uri și cuvinte cheie */}
          {!isEditing && (note.tags?.length > 0 || note.keywords?.length > 0) && (
            <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #e8e6dd' }}>
              {note.tags?.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <strong style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Tag-uri:
                  </strong>
                  {' '}
                  {note.tags.map((noteTag) => (
                    <span
                      key={noteTag.tag.id}
                      style={{
                        display: 'inline-block',
                        fontSize: '13px',
                        background: '#eff6ff',
                        color: '#1e40af',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        marginRight: '6px',
                        marginBottom: '4px',
                        fontWeight: '500'
                      }}
                    >
                      #{noteTag.tag.name}
                    </span>
                  ))}
                </div>
              )}
              {note.keywords?.length > 0 && (
                <div>
                  <strong style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Cuvinte cheie:
                  </strong>
                  {' '}
                  <span style={{ fontSize: '14px', color: '#374151' }}>
                    {note.keywords.join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Conținut Markdown sau editor */}
          {isEditing ? (
            <textarea
              value={editData.content}
              onChange={(e) => setEditData({ ...editData, content: e.target.value })}
              style={{
                width: '100%',
                minHeight: '500px',
                padding: '16px',
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '15px',
                lineHeight: '1.8',
                fontFamily: 'Monaco, Menlo, "Courier New", monospace',
                background: '#f9fafb',
                resize: 'vertical'
              }}
              placeholder="Folosește markdown pentru formatare..."
            />
          ) : (
            <div 
              style={{
                fontSize: '16px',
                lineHeight: '1.8',
                color: '#1f2937',
                fontFamily: '"Georgia", "Times New Roman", serif'
              }}
              dangerouslySetInnerHTML={{ __html: note.content }}
            />
          )}
        </div>

        {/* Footer cu info suplimentare */}
        {!isEditing && (
          <div style={{
            padding: '16px 32px',
            background: '#f9f8f3',
            borderTop: '1px solid #e8e6dd',
            fontSize: '13px',
            color: '#6b7280'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                Creat: {formatDateTime(note.createdAt)}
              </div>
              {note.isPublic && (
                <div style={{ color: '#10b981', fontWeight: '500' }}>
                  🌐 Notița publică
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ViewNoteModal