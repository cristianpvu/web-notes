import React, { useState, useRef, useEffect } from 'react'
import { formatDateTime } from '../lib/utils'
import { updateNote, shareNoteWithUser, uploadAttachment, deleteAttachment, getGroups, addNoteToGroup, getSubjects, getTags } from '../services/api'


function ViewNoteModal({ note, isOpen, onClose, onNoteUpdated, onShare, readOnly = false }) {
  const [isEditing, setIsEditing] = useState(false)
  const [showShareForm, setShowShareForm] = useState(false)
  const [showAddToGroupModal, setShowAddToGroupModal] = useState(false)
  const [showSharedWithList, setShowSharedWithList] = useState(false)
  const [shareEmail, setShareEmail] = useState('')
  const [sharePermission, setSharePermission] = useState('read')
  const [sharing, setSharing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showAttachmentPreviews, setShowAttachmentPreviews] = useState(false)
  const [groups, setGroups] = useState([])
  const [addingToGroup, setAddingToGroup] = useState(false)
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    h1: false,
    h2: false,
    h3: false,
    ul: false,
    ol: false
  })
  const fileInputRef = useRef(null)
  const editorRef = useRef(null)
  const [subjects, setSubjects] = useState([])
  const [tags, setTags] = useState([])
  const [editData, setEditData] = useState({
    title: '',
    content: '',
    subjectId: '',
    tagIds: []
  })
  const [saving, setSaving] = useState(false)

  // Load subjects and tags
  useEffect(() => {
    const loadData = async () => {
      try {
        const [subjectsData, tagsData, groupsData] = await Promise.all([
          getSubjects(),
          getTags(),
          getGroups()
        ])
        setSubjects(subjectsData)
        setTags(tagsData)
        setGroups(groupsData || [])
      } catch (err) {
        console.error('Eroare la încărcarea datelor:', err)
      }
    }
    loadData()
  }, [])

  // Update editData whenever note changes
  useEffect(() => {
    if (note) {
      setEditData({
        title: note.title || '',
        content: note.rawContent || note.content || '',
        subjectId: note.subjectId || '',
        tagIds: note.tags?.map(nt => nt.tag.id) || []
      })
    }
  }, [note])

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

  useEffect(() => {
    if (isEditing && editorRef.current && editData.content) {
      editorRef.current.innerHTML = editData.content
    }
  }, [isEditing])

  if (!isOpen || !note) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      // Capture current content from editor
      if (editorRef.current) {
        editData.content = editorRef.current.innerHTML
      }
      
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
      content: note.rawContent || note.content,
      subjectId: note.subjectId || '',
      tagIds: note.tags?.map(nt => nt.tag.id) || []
    })
    setIsEditing(false)
  }

  const handleTagToggle = (tagId) => {
    setEditData(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...prev.tagIds, tagId]
    }))
  }

  const handleUnshare = async (shareId) => {
    if (!confirm('Sigur vrei să oprești partajarea?')) return

    try {
      const response = await fetch(`https://web-notes-nine.vercel.app/api/notes/${note.id}/share/${shareId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!response.ok) throw new Error('Failed')
      
      // Reload note to get updated sharedWith list
      const updatedNoteResponse = await fetch(`https://web-notes-nine.vercel.app/api/notes/${note.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const updatedNote = await updatedNoteResponse.json()
      onNoteUpdated(updatedNote)
      alert('Partajare oprită')
    } catch (err) {
      alert('Eroare la oprirea partajării')
    }
  }

  const handleShareWithUser = async (e) => {
    e.preventDefault()
    if (!shareEmail.trim()) return

    setSharing(true)
    try {
      await shareNoteWithUser(note.id, shareEmail, sharePermission)
      alert(`Notița a fost partajată cu ${shareEmail} cu permisiune de ${sharePermission === 'read' ? 'citire' : 'editare'}`)
      setShareEmail('')
      setShowShareForm(false)
    } catch (err) {
      alert(err.response?.data?.error || 'Eroare la partajarea notiței')
    } finally {
      setSharing(false)
    }
  }

  const handleAddToGroup = async (groupId) => {
    setAddingToGroup(true)
    try {
      await addNoteToGroup(groupId, note.id)
      // Reload note to get updated groupNotes
      const updatedNoteResponse = await fetch(`https://web-notes-nine.vercel.app/api/notes/${note.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const updatedNote = await updatedNoteResponse.json()
      onNoteUpdated(updatedNote)
      setShowAddToGroupModal(false)
      alert('Notița a fost adăugată la grup')
    } catch (err) {
      alert(err.response?.data?.error || 'Eroare la adăugarea în grup')
    } finally {
      setAddingToGroup(false)
    }
  }

  const handleRemoveFromGroup = async (groupId) => {
    if (!confirm('Sigur vrei să elimini notița din acest grup?')) return
    try {
      const response = await fetch(`https://web-notes-nine.vercel.app/api/groups/${groupId}/notes/${note.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!response.ok) throw new Error('Failed')
      // Reload note
      const updatedNoteResponse = await fetch(`https://web-notes-nine.vercel.app/api/notes/${note.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const updatedNote = await updatedNoteResponse.json()
      onNoteUpdated(updatedNote)
      alert('Notița a fost eliminată din grup')
    } catch (err) {
      alert('Eroare la eliminarea din grup')
    }
  }

  const checkActiveFormats = () => {
    if (!editorRef.current) return
    
    const selection = window.getSelection()
    if (!selection.rangeCount) return
    
    // Get the actual node where the cursor is
    let node = selection.getRangeAt(0).commonAncestorContainer
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement
    }
    
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      h1: document.queryCommandValue('formatBlock') === 'h1',
      h2: document.queryCommandValue('formatBlock') === 'h2',
      h3: document.queryCommandValue('formatBlock') === 'h3',
      ul: document.queryCommandState('insertUnorderedList'),
      ol: document.queryCommandState('insertOrderedList'),
      code: node && !!node.closest('code'),
      blockquote: node && !!node.closest('blockquote')
    })
  }

  const applyFormat = (command, value = null) => {
    document.execCommand(command, false, value)
    setTimeout(checkActiveFormats, 10)
  }

  const handleEditorInput = (e) => {
    // Store content but don't trigger re-render
    editData.content = e.target.innerHTML
    checkActiveFormats()
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
      alert('Fișier încărcat cu succes')
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
      alert('Atașament șters')
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
        background: '#ffffff',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          background: '#1f2937',
          padding: '20px 24px',
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
                  background: 'rgba(255,255,255,0.95)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  marginRight: '16px',
                  outline: 'none'
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
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '20px',
                fontWeight: 'bold',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
              onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
            >
              ✕
            </button>
          </div>

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
                background: 'rgba(255,255,255,0.2)',
                padding: '4px 12px',
                borderRadius: '12px',
                fontWeight: '600',
                border: '1px solid rgba(255,255,255,0.3)'
              }}>
                Doar vizualizare
              </span>
            )}
            {note.subject && (
              <span style={{
                background: 'rgba(255,255,255,0.15)',
                padding: '4px 12px',
                borderRadius: '12px',
                fontWeight: '500'
              }}>
                {note.subject.name}
              </span>
            )}
            {note.courseDate && (
              <span>{formatDateTime(note.courseDate)}</span>
            )}
            <span>Actualizat {formatDateTime(note.updatedAt)}</span>
          </div>
        </div>

        {!readOnly && (
          <div style={{
            padding: '20px 32px',
            background: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: '12px',
            position: 'sticky',
            top: '110px',
            zIndex: 9
          }}>
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: '16px 12px',
                    background: 'white',
                    color: '#1f2937',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    textAlign: 'center'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#1f2937'
                    e.currentTarget.style.background = '#1f2937'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb'
                    e.currentTarget.style.background = 'white'
                    e.currentTarget.style.color = '#1f2937'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ pointerEvents: 'none' }}>
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  <span style={{ pointerEvents: 'none' }}>Editează</span>
                </button>
                <button
                  onClick={() => onShare(note)}
                  style={{
                    padding: '16px 12px',
                    background: 'white',
                    color: '#1f2937',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    textAlign: 'center'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#1f2937'
                    e.currentTarget.style.background = '#1f2937'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb'
                    e.currentTarget.style.background = 'white'
                    e.currentTarget.style.color = '#1f2937'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ pointerEvents: 'none' }}>
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                  <span style={{ pointerEvents: 'none' }}>Link</span>
                </button>
                <button
                  onClick={() => setShowShareForm(!showShareForm)}
                  style={{
                    padding: '16px 12px',
                    background: 'white',
                    color: '#1f2937',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    textAlign: 'center'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#1f2937'
                    e.currentTarget.style.background = '#1f2937'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb'
                    e.currentTarget.style.background = 'white'
                    e.currentTarget.style.color = '#1f2937'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ pointerEvents: 'none' }}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <span style={{ pointerEvents: 'none' }}>Partajează</span>
                </button>
                <button
                  onClick={() => setShowAddToGroupModal(!showAddToGroupModal)}
                  style={{
                    padding: '16px 12px',
                    background: 'white',
                    color: '#1f2937',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    textAlign: 'center'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#1f2937'
                    e.currentTarget.style.background = '#1f2937'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb'
                    e.currentTarget.style.background = 'white'
                    e.currentTarget.style.color = '#1f2937'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ pointerEvents: 'none' }}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <line x1="23" y1="11" x2="17" y2="11"></line>
                    <line x1="20" y1="8" x2="20" y2="14"></line>
                  </svg>
                  <span style={{ pointerEvents: 'none' }}>Grupuri</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{
                    padding: '16px 12px',
                    background: 'white',
                    color: uploading ? '#9ca3af' : '#1f2937',
                    border: uploading ? '2px solid #d1d5db' : '2px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    textAlign: 'center'
                  }}
                  onMouseOver={(e) => {
                    if (!uploading) {
                      e.currentTarget.style.borderColor = '#1f2937'
                      e.currentTarget.style.background = '#1f2937'
                      e.currentTarget.style.color = 'white'
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!uploading) {
                      e.currentTarget.style.borderColor = '#e5e7eb'
                      e.currentTarget.style.background = 'white'
                      e.currentTarget.style.color = '#1f2937'
                    }
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ pointerEvents: 'none' }}>
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                  </svg>
                  <span style={{ pointerEvents: 'none' }}>{uploading ? 'Se încarcă...' : 'Atașament'}</span>
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
                      padding: '16px 12px',
                      background: 'white',
                      color: '#1f2937',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      textAlign: 'center'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = '#1f2937'
                      e.currentTarget.style.background = '#1f2937'
                      e.currentTarget.style.color = 'white'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb'
                      e.currentTarget.style.background = 'white'
                      e.currentTarget.style.color = '#1f2937'
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ pointerEvents: 'none' }}>
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                    <span style={{ pointerEvents: 'none' }}>Sursă</span>
                  </a>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: '10px 18px',
                    background: saving ? '#d1d5db' : '#1f2937',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseOver={(e) => {
                    if (!saving) e.currentTarget.style.background = '#374151'
                  }}
                  onMouseOut={(e) => {
                    if (!saving) e.currentTarget.style.background = '#1f2937'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ pointerEvents: 'none' }}>
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span style={{ pointerEvents: 'none' }}>{saving ? 'Se salvează...' : 'Salvează'}</span>
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  style={{
                    padding: '10px 18px',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#4b5563'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#6b7280'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ pointerEvents: 'none' }}>
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  <span style={{ pointerEvents: 'none' }}>Anulează</span>
                </button>
              </>
            )}
          </div>
        )}

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
                    fontSize: '14px',
                    outline: 'none'
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
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="read">Doar citire</option>
                  <option value="edit">Poate edita</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={sharing}
                style={{
                  padding: '8px 20px',
                  background: sharing ? '#9ca3af' : '#1f2937',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: sharing ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {sharing ? 'Se partajează...' : 'Partajează'}
              </button>
            </form>

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
                      fontSize: '13px',
                      gap: '8px'
                    }}>
                      <span style={{ flex: 1 }}>{share.user.email}</span>
                      <span style={{
                        padding: '2px 8px',
                        background: share.permission === 'edit' ? '#dbeafe' : '#e5e7eb',
                        color: share.permission === 'edit' ? '#1e40af' : '#374151',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {share.permission === 'edit' ? 'Edit' : 'Read'}
                      </span>
                      <button
                        onClick={() => handleUnshare(share.id)}
                        style={{
                          padding: '4px 10px',
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        Oprește
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {showAddToGroupModal && !readOnly && (
          <div style={{
            padding: '20px 32px',
            background: '#f3f4f6',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
              Adaugă la grup
            </p>
            
            {groups.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>
                Nu faci parte din niciun grup
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {groups.map((group) => {
                  const isInGroup = note.groupNotes?.some(gn => gn.group?.id === group.id)
                  return (
                    <div key={group.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: 'white',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}>
                      <span>{group.name}</span>
                      {isInGroup ? (
                        <button
                          onClick={() => handleRemoveFromGroup(group.id)}
                          style={{
                            padding: '6px 12px',
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                        >
                          Elimină
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAddToGroup(group.id)}
                          disabled={addingToGroup}
                          style={{
                            padding: '6px 12px',
                            background: '#1f2937',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: addingToGroup ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                        >
                          {addingToGroup ? '...' : 'Adaugă'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {note.groupNotes && note.groupNotes.length > 0 && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #d1d5db' }}>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Notița e în grupurile:
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {note.groupNotes.map((gn) => (
                    <span key={gn.group?.id || gn.id} style={{
                      padding: '4px 10px',
                      background: '#dbeafe',
                      color: '#1e40af',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {gn.group?.name || 'Grup'}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{
          padding: '32px 48px 48px',
          background: '#ffffff',
          minHeight: '400px'
        }}>
          {!isEditing && (note.tags?.length > 0 || note.keywords?.length > 0) && (
            <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #e5e7eb' }}>
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
                        background: '#f3f4f6',
                        color: '#374151',
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

          {note.attachments && note.attachments.length > 0 && (
            <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '2px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <strong style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Atașamente ({note.attachments.length})
                </strong>
                <button
                  onClick={() => setShowAttachmentPreviews(!showAttachmentPreviews)}
                  style={{
                    padding: '4px 12px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {showAttachmentPreviews ? '▼ Ascunde preview' : '▶ Arată preview'}
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {note.attachments.map((attachment) => (
                  <div key={attachment.id}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      padding: '12px',
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      gap: '12px'
                    }}>
                      {attachment.fileType === 'image' && (
                        <img 
                          src={attachment.fileUrl} 
                          alt={attachment.fileName}
                          onClick={() => window.open(attachment.fileUrl, '_blank')}
                          style={{
                            width: '80px',
                            height: '80px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            border: '1px solid #e5e7eb',
                            cursor: 'pointer'
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
                            color: '#1f2937',
                            textDecoration: 'none',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {attachment.fileName}
                        </a>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                          {(attachment.fileSize / 1024).toFixed(2)} KB • {attachment.fileType}
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
                          Șterge
                        </button>
                      )}
                    </div>
                    
                    {/* Full-width preview for images */}
                    {showAttachmentPreviews && attachment.fileType === 'image' && (
                      <img 
                        src={attachment.fileUrl} 
                        alt={attachment.fileName}
                        onClick={() => window.open(attachment.fileUrl, '_blank')}
                        style={{
                          width: '100%',
                          maxHeight: '400px',
                          objectFit: 'contain',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                          cursor: 'pointer',
                          marginTop: '8px'
                        }}
                      />
                    )}
                    
                    {/* PDF preview */}
                    {showAttachmentPreviews && attachment.fileType === 'pdf' && (
                      <iframe
                        src={attachment.fileUrl}
                        style={{
                          width: '100%',
                          height: '500px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          marginTop: '8px'
                        }}
                        title={attachment.fileName}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isEditing ? (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Materie
                </label>
                <select
                  value={editData.subjectId}
                  onChange={(e) => setEditData({ ...editData, subjectId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">-- Fără materie --</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} {subject.code ? `(${subject.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {tags.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Tag-uri
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {tags.map(tag => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleTagToggle(tag.id)}
                        style={{
                          padding: '6px 14px',
                          border: editData.tagIds.includes(tag.id) ? '2px solid #1f2937' : '2px solid #e5e7eb',
                          borderRadius: '20px',
                          background: editData.tagIds.includes(tag.id) ? tag.color || '#10B981' : 'white',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          transition: 'all 0.2s',
                          color: editData.tagIds.includes(tag.id) ? 'white' : '#6b7280'
                        }}
                      >
                        #{tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bara de unelte Markdown */}
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                padding: '12px',
                background: '#f3f4f6',
                borderRadius: '8px',
                marginBottom: '12px',
                border: '1px solid #e5e7eb'
              }}>
                <button
                  type="button"
                  onClick={() => applyFormat('bold')}
                  style={{
                    padding: '6px 12px',
                    background: activeFormats.bold ? '#3b82f6' : 'white',
                    color: activeFormats.bold ? 'white' : 'black',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => !activeFormats.bold && (e.target.style.background = '#f9fafb')}
                  onMouseLeave={(e) => !activeFormats.bold && (e.target.style.background = 'white')}
                  title="Bold (îngroșat)"
                >
                  B
                </button>
                
                <button
                  type="button"
                  onClick={() => applyFormat('italic')}
                  style={{
                    padding: '6px 12px',
                    background: activeFormats.italic ? '#3b82f6' : 'white',
                    color: activeFormats.italic ? 'white' : 'black',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontStyle: 'italic',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => !activeFormats.italic && (e.target.style.background = '#f9fafb')}
                  onMouseLeave={(e) => !activeFormats.italic && (e.target.style.background = 'white')}
                  title="Italic"
                >
                  I
                </button>

                <button
                  type="button"
                  onClick={() => applyFormat('underline')}
                  style={{
                    padding: '6px 12px',
                    background: activeFormats.underline ? '#3b82f6' : 'white',
                    color: activeFormats.underline ? 'white' : 'black',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => !activeFormats.underline && (e.target.style.background = '#f9fafb')}
                  onMouseLeave={(e) => !activeFormats.underline && (e.target.style.background = 'white')}
                  title="Underline (subliniat)"
                >
                  U
                </button>

                <div style={{ width: '1px', background: '#d1d5db', margin: '0 4px' }}></div>

                <button
                  type="button"
                  onClick={() => applyFormat('formatBlock', 'h1')}
                  style={{
                    padding: '6px 12px',
                    background: activeFormats.h1 ? '#3b82f6' : 'white',
                    color: activeFormats.h1 ? 'white' : 'black',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => !activeFormats.h1 && (e.target.style.background = '#f9fafb')}
                  onMouseLeave={(e) => !activeFormats.h1 && (e.target.style.background = 'white')}
                  title="Heading 1"
                >
                  H1
                </button>

                <button
                  type="button"
                  onClick={() => applyFormat('formatBlock', 'h2')}
                  style={{
                    padding: '6px 12px',
                    background: activeFormats.h2 ? '#3b82f6' : 'white',
                    color: activeFormats.h2 ? 'white' : 'black',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => !activeFormats.h2 && (e.target.style.background = '#f9fafb')}
                  onMouseLeave={(e) => !activeFormats.h2 && (e.target.style.background = 'white')}
                  title="Heading 2"
                >
                  H2
                </button>

                <button
                  type="button"
                  onClick={() => applyFormat('formatBlock', 'h3')}
                  style={{
                    padding: '6px 12px',
                    background: activeFormats.h3 ? '#3b82f6' : 'white',
                    color: activeFormats.h3 ? 'white' : 'black',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => !activeFormats.h3 && (e.target.style.background = '#f9fafb')}
                  onMouseLeave={(e) => !activeFormats.h3 && (e.target.style.background = 'white')}
                  title="Heading 3"
                >
                  H3
                </button>

                <div style={{ width: '1px', background: '#d1d5db', margin: '0 4px' }}></div>

                <button
                  type="button"
                  onClick={() => applyFormat('insertUnorderedList')}
                  style={{
                    padding: '6px 12px',
                    background: activeFormats.ul ? '#3b82f6' : 'white',
                    color: activeFormats.ul ? 'white' : 'black',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => !activeFormats.ul && (e.target.style.background = '#f9fafb')}
                  onMouseLeave={(e) => !activeFormats.ul && (e.target.style.background = 'white')}
                  title="Listă cu puncte"
                >
                  • Listă
                </button>

                <button
                  type="button"
                  onClick={() => applyFormat('insertOrderedList')}
                  style={{
                    padding: '6px 12px',
                    background: activeFormats.ol ? '#3b82f6' : 'white',
                    color: activeFormats.ol ? 'white' : 'black',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => !activeFormats.ol && (e.target.style.background = '#f9fafb')}
                  onMouseLeave={(e) => !activeFormats.ol && (e.target.style.background = 'white')}
                  title="Listă numerotată"
                >
                  1. Listă
                </button>

                <div style={{ width: '1px', background: '#d1d5db', margin: '0 4px' }}></div>

                <button
                  type="button"
                  onClick={() => {
                    const url = prompt('Introdu URL-ul:')
                    if (url) applyFormat('createLink', url)
                  }}
                  style={{
                    padding: '6px 12px',
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.target.style.background = 'white'}
                  title="Link"
                >
                  Link
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const selection = window.getSelection()
                    if (!selection.rangeCount) return
                    
                    // Get the current node
                    let node = selection.getRangeAt(0).commonAncestorContainer
                    if (node.nodeType === Node.TEXT_NODE) {
                      node = node.parentElement
                    }
                    
                    // Check if already in code tag
                    const codeElement = node?.closest('code')
                    if (codeElement) {
                      // Remove code formatting - unwrap content
                      const parent = codeElement.parentNode
                      const fragment = document.createDocumentFragment()
                      while (codeElement.firstChild) {
                        fragment.appendChild(codeElement.firstChild)
                      }
                      parent.replaceChild(fragment, codeElement)
                    } else {
                      // Add code formatting
                      if (selection.toString()) {
                        const text = selection.toString()
                        document.execCommand('insertHTML', false, `<code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-family: monospace;">${text}</code>`)
                      } else {
                        document.execCommand('insertHTML', false, `<code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-family: monospace;">cod</code>`)
                      }
                    }
                    setTimeout(checkActiveFormats, 10)
                  }}
                  style={{
                    padding: '6px 12px',
                    background: activeFormats.code ? '#3b82f6' : 'white',
                    color: activeFormats.code ? 'white' : 'black',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => !activeFormats.code && (e.target.style.background = '#f9fafb')}
                  onMouseLeave={(e) => !activeFormats.code && (e.target.style.background = 'white')}
                  title="Cod inline"
                >
                  {'<>'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const selection = window.getSelection()
                    if (!selection.rangeCount) return
                    
                    // Get the current node - check both range container and anchor node
                    let node = selection.getRangeAt(0).commonAncestorContainer
                    if (node.nodeType === Node.TEXT_NODE) {
                      node = node.parentElement
                    }
                    
                    // Check if we're inside a blockquote
                    const blockquote = node?.closest('blockquote')
                    if (blockquote) {
                      // Remove blockquote formatting - unwrap all content
                      const parent = blockquote.parentNode
                      const fragment = document.createDocumentFragment()
                      while (blockquote.firstChild) {
                        fragment.appendChild(blockquote.firstChild)
                      }
                      parent.replaceChild(fragment, blockquote)
                      
                      // Restore selection
                      const range = document.createRange()
                      range.selectNodeContents(parent)
                      range.collapse(false)
                      selection.removeAllRanges()
                      selection.addRange(range)
                    } else {
                      // Add blockquote formatting
                      if (selection.toString()) {
                        // If there's selected text, wrap it
                        const text = selection.toString()
                        document.execCommand('insertHTML', false, `<blockquote style="border-left: 4px solid #d1d5db; padding-left: 16px; margin: 16px 0; color: #6b7280; font-style: italic;">${text}</blockquote>`)
                      } else {
                        // If no selection, insert placeholder
                        document.execCommand('insertHTML', false, `<blockquote style="border-left: 4px solid #d1d5db; padding-left: 16px; margin: 16px 0; color: #6b7280; font-style: italic;">citat</blockquote>`)
                      }
                    }
                    setTimeout(checkActiveFormats, 10)
                  }}
                  style={{
                    padding: '6px 12px',
                    background: activeFormats.blockquote ? '#3b82f6' : 'white',
                    color: activeFormats.blockquote ? 'white' : 'black',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => !activeFormats.blockquote && (e.target.style.background = '#f9fafb')}
                  onMouseLeave={(e) => !activeFormats.blockquote && (e.target.style.background = 'white')}
                  title="Citat"
                >
                  💬 Citat
                </button>
              </div>

              <div
                ref={editorRef}
                id="richTextEditor"
                contentEditable
                onInput={handleEditorInput}
                onMouseUp={checkActiveFormats}
                onKeyUp={checkActiveFormats}
                suppressContentEditableWarning
                style={{
                  width: '100%',
                  minHeight: '500px',
                  padding: '16px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '15px',
                  lineHeight: '1.8',
                  background: 'white',
                  outline: 'none',
                  boxSizing: 'border-box',
                  overflowY: 'auto'
                }}
                onFocus={(e) => e.target.style.borderColor = '#1f2937'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
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

        {!isEditing && (
          <div style={{
            padding: '16px 32px',
            background: '#f9fafb',
            borderTop: '1px solid #e5e7eb',
            fontSize: '13px',
            color: '#6b7280'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                Creat: {formatDateTime(note.createdAt)}
              </div>
              {note.isPublic && (
                <div style={{ color: '#10b981', fontWeight: '500' }}>
                  Notița publică
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