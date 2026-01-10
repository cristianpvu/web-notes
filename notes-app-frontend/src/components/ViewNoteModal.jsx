import React, { useState, useRef, useEffect } from 'react'
import { formatDateTime } from '../lib/utils'
import { updateNote, shareNoteWithUser, uploadAttachment, deleteAttachment } from '../services/api'


function ViewNoteModal({ note, isOpen, onClose, onNoteUpdated, onShare, readOnly = false }) {
  const [isEditing, setIsEditing] = useState(false)
  const [showShareForm, setShowShareForm] = useState(false)
  const [shareEmail, setShareEmail] = useState('')
  const [sharePermission, setSharePermission] = useState('read')
  const [sharing, setSharing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const [editData, setEditData] = useState({
    title: '',
    content: ''
  })
  const [saving, setSaving] = useState(false)

  // Update editData whenever note changes
  useEffect(() => {
    if (note) {
      setEditData({
        title: note.title || '',
        content: note.rawContent || note.content || ''
      })
    }
  }, [note])

  // Add global CSS for note content spacing
  useEffect(() => {
    const styleId = 'note-content-spacing-styles'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        .note-content-display br {
          display: block;
          line-height: 0.1em;
        }
        .note-content-display h1 {
          margin: 1em 0 0.5em 0 !important;
          line-height: 1.2 !important;
        }
        .note-content-display h2 {
          margin: 0.9em 0 0.4em 0 !important;
          line-height: 1.2 !important;
        }
        .note-content-display h3 {
          margin: 0.7em 0 0.3em 0 !important;
          line-height: 1.2 !important;
        }
        .note-content-display ul {
          margin: 0.5em 0 !important;
          padding-left: 1.5em !important;
        }
        .note-content-display li {
          margin: 0.2em 0 !important;
          line-height: 1.4 !important;
        }
        .note-content-display blockquote {
          margin: 0.7em 0 !important;
          padding: 0.6em 1em !important;
          line-height: 1.4 !important;
        }
        .note-content-display strong,
        .note-content-display em,
        .note-content-display u,
        .note-content-display del {
          line-height: inherit;
        }
      `
      document.head.appendChild(style)
    }
  }, [])

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

  const handleShareWithUser = async (e) => {
    e.preventDefault()
    if (!shareEmail.trim()) return

    setSharing(true)
    try {
      await shareNoteWithUser(note.id, shareEmail, sharePermission)
      alert(`✓ Notița a fost partajată cu ${shareEmail} cu permisiune de ${sharePermission === 'read' ? 'citire' : 'editare'}!`)
      setShareEmail('')
      setShowShareForm(false)
    } catch (err) {
      alert(err.response?.data?.error || 'Eroare la partajarea notiței')
    } finally {
      setSharing(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const attachment = await uploadAttachment(note.id, file)
      const updatedNote = {
        ...note,
        attachments: [...(note.attachments || []), attachment]
      }
      onNoteUpdated(updatedNote)
      alert('✓ Fișier încărcat cu succes!')
    } catch (err) {
      alert(err.response?.data?.error || 'Eroare la încărcarea fișierului')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteAttachment = async (attachmentId) => {
    if (!confirm('Sigur vrei să ștergi acest atașament?')) return

    try {
      await deleteAttachment(attachmentId)
      const updatedNote = {
        ...note,
        attachments: note.attachments.filter(a => a.id !== attachmentId)
      }
      onNoteUpdated(updatedNote)
      alert('✓ Atașament șters!')
    } catch (err) {
      alert('Eroare la ștergerea atașamentului')
    }
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
            {readOnly && (
              <span style={{
                background: 'rgba(255,255,255,0.3)',
                padding: '4px 12px',
                borderRadius: '12px',
                fontWeight: '600',
                border: '1px solid rgba(255,255,255,0.5)'
              }}>
                👁️ Doar vizualizare
              </span>
            )}
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
                <button
                  onClick={() => setShowShareForm(!showShareForm)}
                  style={{
                    padding: '8px 16px',
                    background: '#8b5cf6',
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
                  👥 Partajează cu coleg
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{
                    padding: '8px 16px',
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {uploading ? '⏳ Se încarcă...' : '📎 Adaugă atașament'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt,.xlsx,.pptx"
                />
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

        {/* Formular share cu user specific */}
        {showShareForm && !readOnly && (
          <div style={{
            padding: '20px 32px',
            background: '#f3f4f6',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <form onSubmit={handleShareWithUser} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>
                  Email coleg (@stud.ase.ro)
                </label>
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="exemplu@stud.ase.ro"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ minWidth: '150px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>
                  Permisiune
                </label>
                <select
                  value={sharePermission}
                  onChange={(e) => setSharePermission(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="read">👁️ Doar citire</option>
                  <option value="edit">✏️ Poate edita</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={sharing}
                style={{
                  padding: '8px 20px',
                  background: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: sharing ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {sharing ? '⏳...' : '✓ Partajează'}
              </button>
            </form>

            {/* Lista persoanelor cu care e partajată */}
            {note.sharedWith && note.sharedWith.length > 0 && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #d1d5db' }}>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Partajat cu:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {note.sharedWith.map((share) => (
                    <div key={share.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: 'white',
                      borderRadius: '6px',
                      fontSize: '13px'
                    }}>
                      <span>{share.user.email}</span>
                      <span style={{
                        padding: '2px 8px',
                        background: share.permission === 'edit' ? '#dbeafe' : '#e5e7eb',
                        color: share.permission === 'edit' ? '#1e40af' : '#374151',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {share.permission === 'edit' ? '✏️ Edit' : '👁️ Read'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
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

          {/* Atașamente */}
          {note.attachments && note.attachments.length > 0 && (
            <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #e8e6dd' }}>
              <strong style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '12px' }}>
                📎 Atașamente ({note.attachments.length})
              </strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {note.attachments.map((attachment) => (
                  <div key={attachment.id} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    padding: '12px',
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    gap: '12px'
                  }}>
                    {/* Preview pentru imagini */}
                    {attachment.fileType === 'image' && (
                      <img 
                        src={attachment.fileUrl} 
                        alt={attachment.fileName}
                        style={{
                          width: '80px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '4px',
                          border: '1px solid #e5e7eb'
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <a
                        href={attachment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '14px',
                          color: '#3b82f6',
                          textDecoration: 'none',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        {attachment.fileType === 'image' && '🖼️'}
                        {attachment.fileType === 'video' && '🎥'}
                        {attachment.fileType === 'document' && '📄'}
                        {attachment.fileType === 'other' && '📎'}
                        {attachment.fileName}
                      </a>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                        {(attachment.fileSize / 1024).toFixed(2)} KB • Click pentru vizualizare
                      </div>
                    </div>
                    {!readOnly && (
                      <button
                        onClick={() => handleDeleteAttachment(attachment.id)}
                        style={{
                          padding: '6px 12px',
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                ))}
              </div>
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
              className="note-content-display"
              style={{
                fontSize: '16px',
                lineHeight: '1',
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