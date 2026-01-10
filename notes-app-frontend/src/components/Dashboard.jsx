import React, { useState, useEffect } from 'react'
import { getNotes, deleteNote, getNoteById, getPublicNoteById } from '../services/api'
import { formatDateTime } from '../lib/utils'
import AddNoteModal from './AddNoteModal'
import ViewNoteModal from './ViewNoteModal'


function Dashboard({ user, onLogout }) {
  const [myNotes, setMyNotes] = useState([])
  const [sharedNotes, setSharedNotes] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('my-notes')

  const getPlainTextPreview = (htmlContent, maxLength = 150) => {
    if (!htmlContent) return ''
    const withoutTags = htmlContent.replace(/<[^>]*>/g, ' ')
    const cleaned = withoutTags.replace(/\s+/g, ' ').trim()
    return cleaned.length > maxLength 
      ? cleaned.substring(0, maxLength) + '...' 
      : cleaned
  }

  useEffect(() => {
    loadAllData()
    checkNoteInUrl()
  }, [])

  const checkNoteInUrl = async () => {
    const path = window.location.pathname
    const match = path.match(/^\/note\/([a-f0-9-]+)$/i)
    
    if (match) {
      const noteId = match[1]
      try {
        const note = await getNoteById(noteId)
        setSelectedNote(note)
        setIsViewModalOpen(true)
        window.history.replaceState({}, document.title, '/')
      } catch (err) {
        try {
          const publicNote = await getPublicNoteById(noteId)
          setSelectedNote(publicNote)
          setIsViewModalOpen(true)
          window.history.replaceState({}, document.title, '/')
        } catch (publicErr) {
          console.error('Notița nu a fost găsită:', publicErr)
          alert('Notița nu a fost găsită sau nu este publică.')
          window.history.replaceState({}, document.title, '/')
        }
      }
    }
  }

  const loadAllData = async () => {
    try {
      setLoading(true)
      const [notesData, sharedData] = await Promise.all([
        getNotes(),
        fetch('https://web-notes-nine.vercel.app/api/notes/shared', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }).then(res => res.json())
      ])
      
      setMyNotes(notesData.notes || [])
      setSharedNotes(sharedData || [])
    } catch (err) {
      setError('Eroare la încărcarea datelor')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Sigur vrei să ștergi această notița?')) return
    
    try {
      await deleteNote(id)
      setMyNotes(myNotes.filter(note => note.id !== id))
    } catch (err) {
      alert('Eroare la ștergerea notiței')
    }
  }

  const handleNoteAdded = (newNote) => {
    setMyNotes([newNote, ...myNotes])
  }

  const handleViewNote = (note) => {
    setSelectedNote(note)
    setIsViewModalOpen(true)
  }

  const handleNoteUpdated = (updatedNote) => {
    setMyNotes(myNotes.map(n => n.id === updatedNote.id ? updatedNote : n))
    setSharedNotes(sharedNotes.map(sn => sn.note?.id === updatedNote.id ? { ...sn, note: updatedNote } : sn))
    setSelectedNote(updatedNote)
  }

  const handleShare = (note) => {
    const shareUrl = `${window.location.origin}/note/${note.id}`
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert(`Link copiat în clipboard!\n\n${shareUrl}\n\nPoți distribui acest link colegilor.`)
    }).catch(() => {
      alert(`Link pentru distribuire:\n\n${shareUrl}`)
    })
  }

  const renderNoteCard = (note, isShared = false, permission = null) => (
    <div
      key={note.id}
      onClick={() => handleViewNote(isShared ? note.note : note)}
      style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        transition: 'all 0.2s',
        cursor: 'pointer'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {isShared && permission && (
        <div style={{ marginBottom: '10px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase',
            padding: '3px 8px',
            borderRadius: '4px',
            background: permission === 'edit' ? '#dbeafe' : '#f3f4f6',
            color: permission === 'edit' ? '#1e40af' : '#6b7280',
            letterSpacing: '0.5px'
          }}>
            {permission === 'edit' ? 'Poate edita' : 'Doar citire'}
          </span>
        </div>
      )}

      <h3 style={{ 
        margin: '0 0 10px 0', 
        fontSize: '18px',
        color: '#111827'
      }}>
        {isShared ? note.note.title : note.title}
      </h3>

      <div style={{ 
        fontSize: '12px', 
        color: '#6b7280',
        marginBottom: '12px',
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap'
      }}>
        {(isShared ? note.note.subject : note.subject) && (
          <span style={{ 
            background: (isShared ? note.note.subject.color : note.subject.color) || '#4b5563',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '4px'
          }}>
            {isShared ? note.note.subject.name : note.subject.name}
          </span>
        )}
        {(isShared ? note.note.courseDate : note.courseDate) && (
          <span>{formatDateTime(isShared ? note.note.courseDate : note.courseDate)}</span>
        )}
        {(isShared ? note.note.isPublic : note.isPublic) && (
          <span>Publică</span>
        )}
        {isShared && note.note.user && (
          <span style={{ fontStyle: 'italic' }}>
            de {note.note.user.name || note.note.user.email}
          </span>
        )}
      </div>

      <p style={{ 
        fontSize: '14px',
        color: '#4b5563',
        marginBottom: '12px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical'
      }}>
        {getPlainTextPreview(isShared ? note.note.content : note.content, 150)}
      </p>

      {(isShared ? note.note.tags : note.tags) && (isShared ? note.note.tags : note.tags).length > 0 && (
        <div style={{ 
          display: 'flex', 
          gap: '6px', 
          flexWrap: 'wrap',
          marginBottom: '12px'
        }}>
          {(isShared ? note.note.tags : note.tags).map((noteTag) => (
            <span
              key={noteTag.tag.id}
              style={{
                fontSize: '12px',
                background: '#f3f4f6',
                color: '#374151',
                padding: '2px 8px',
                borderRadius: '12px'
              }}
            >
              #{noteTag.tag.name}
            </span>
          ))}
        </div>
      )}

      {!isShared && (
        <div style={{ 
          display: 'flex', 
          gap: '8px',
          borderTop: '1px solid #e5e7eb',
          paddingTop: '12px'
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleShare(note)
            }}
            style={{
              flex: 1,
              padding: '6px 12px',
              background: '#ecfdf5',
              color: '#059669',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Distribuie
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(note.id)
            }}
            style={{
              flex: 1,
              padding: '6px 12px',
              background: '#fee2e2',
              color: '#dc2626',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Șterge
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <div style={{
        background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '32px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '28px', color: 'white' }}>NoteShare</h1>
              <p style={{ margin: '5px 0 0 0', color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
                {user?.name || user?.email}
              </p>
            </div>
            <button 
              onClick={onLogout}
              style={{ 
                padding: '10px 20px', 
                background: 'rgba(255,255,255,0.1)', 
                color: 'white', 
                border: '1px solid rgba(255,255,255,0.2)', 
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.2)'
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.1)'
              }}
            >
              Deconectare
            </button>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('my-notes')}
              style={{
                padding: '10px 20px',
                background: activeTab === 'my-notes' ? 'white' : 'rgba(255,255,255,0.1)',
                color: activeTab === 'my-notes' ? '#1f2937' : 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              Notițele mele ({myNotes.length})
            </button>
            <button
              onClick={() => setActiveTab('shared')}
              style={{
                padding: '10px 20px',
                background: activeTab === 'shared' ? 'white' : 'rgba(255,255,255,0.1)',
                color: activeTab === 'shared' ? '#1f2937' : 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              Partajate cu mine ({sharedNotes.length})
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              style={{
                padding: '10px 20px',
                background: activeTab === 'groups' ? 'white' : 'rgba(255,255,255,0.1)',
                color: activeTab === 'groups' ? '#1f2937' : 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
            >
              Grupurile mele ({groups.length})
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px 40px' }}>
        {activeTab === 'my-notes' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <button
                onClick={() => setIsAddModalOpen(true)}
                style={{
                  padding: '12px 24px',
                  background: '#1f2937',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(31, 41, 55, 0.4)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 6px 16px rgba(31, 41, 55, 0.6)'
                  e.target.style.background = '#111827'
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 4px 12px rgba(31, 41, 55, 0.4)'
                  e.target.style.background = '#1f2937'
                }}
              >
                + Adaugă notița nouă
              </button>
            </div>

            {loading && <p>Se încarcă notițele...</p>}
            {error && <p style={{ color: '#dc3545' }}>{error}</p>}

            {!loading && !error && (
              myNotes.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '60px 20px',
                  background: 'white',
                  borderRadius: '12px',
                  border: '2px dashed #e5e7eb'
                }}>
                  <p style={{ fontSize: '18px', color: '#6b7280', margin: 0 }}>
                    Nu ai nicio notița încă. Creează prima ta notița!
                  </p>
                </div>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gap: '16px',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))'
                }}>
                  {myNotes.map((note) => renderNoteCard(note, false))}
                </div>
              )
            )}
          </div>
        )}

        {activeTab === 'shared' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px', color: '#111827' }}>
              Notițe partajate cu mine
            </h2>

            {loading && <p>Se încarcă notițele...</p>}
            {error && <p style={{ color: '#dc3545' }}>{error}</p>}

            {!loading && !error && (
              sharedNotes.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '60px 20px',
                  background: 'white',
                  borderRadius: '12px',
                  border: '2px dashed #e5e7eb'
                }}>
                  <p style={{ fontSize: '18px', color: '#6b7280', margin: 0 }}>
                    Nicio notița partajată cu tine încă.
                  </p>
                </div>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gap: '16px',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))'
                }}>
                  {sharedNotes.map((sharedNote) => renderNoteCard(sharedNote, true, sharedNote.permission))}
                </div>
              )
            )}
          </div>
        )}

        {activeTab === 'groups' && (
          <div>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', margin: 0, color: '#111827' }}>
                Grupurile mele
              </h2>
              <button
                style={{
                  padding: '12px 24px',
                  background: '#1f2937',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  boxShadow: '0 4px 12px rgba(31, 41, 55, 0.4)'
                }}
              >
                + Creează grup nou
              </button>
            </div>

            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              background: 'white',
              borderRadius: '12px',
              border: '2px dashed #e5e7eb'
            }}>
              <p style={{ fontSize: '18px', color: '#6b7280', margin: '0 0 8px 0' }}>
                Nu faci parte din niciun grup încă.
              </p>
              <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
                Grupurile permit colaborarea și partajarea notițelor cu colegii.
              </p>
            </div>
          </div>
        )}
      </div>

      <AddNoteModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onNoteAdded={handleNoteAdded}
      />

      <ViewNoteModal
        note={selectedNote}
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        onNoteUpdated={handleNoteUpdated}
        onShare={handleShare}
        readOnly={selectedNote && selectedNote.userId !== user?.id && sharedNotes.find(sn => sn.note?.id === selectedNote.id)?.permission !== 'edit'}
      />
    </div>
  )
}

export default Dashboard