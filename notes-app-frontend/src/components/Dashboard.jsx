import React, { useState, useEffect } from 'react'
import { getNotes, deleteNote, getNoteById, getPublicNoteById } from '../services/api'
import { formatDateTime } from '../lib/utils'
import AddNoteModal from './AddNoteModal'
import ViewNoteModal from './ViewNoteModal'
import GroupsView from './GroupsView'
import GroupDetailView from './GroupDetailView'
import SubjectsView from './SubjectsView'


function Dashboard({ user, onLogout }) {
  const [myNotes, setMyNotes] = useState([])
  const [sharedNotes, setSharedNotes] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [currentView, setCurrentView] = useState('notes') // 'notes' or 'groups' or 'group-detail' or 'subjects'
  const [selectedGroupId, setSelectedGroupId] = useState(null)
  const [subjectFilter, setSubjectFilter] = useState(null)

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      const params = new URLSearchParams(hash.split('?')[1])
      const subjectParam = params.get('subject')
      
      if (hash === 'groups') {
        setCurrentView('groups')
        setSelectedGroupId(null)
        setSubjectFilter(null)
      } else if (hash === 'subjects') {
        setCurrentView('subjects')
        setSelectedGroupId(null)
        setSubjectFilter(null)
      } else if (hash.startsWith('/group/')) {
        setCurrentView('group-detail')
        setSelectedGroupId(hash.replace('/group/', ''))
        setSubjectFilter(null)
      } else {
        setCurrentView('notes')
        setSelectedGroupId(null)
        setSubjectFilter(subjectParam)
      }
    }
    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px',
        borderBottom: '2px solid #e5e7eb',
        paddingBottom: '20px'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px' }}>Notițele Mele</h1>
          <p style={{ margin: '5px 0 0 0', color: '#6b7280' }}>
            {user?.name || user?.email}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={onLogout}
            style={{ 
              padding: '8px 16px', 
              background: '#dc3545', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Deconectare
          </button>
        </div>
      </div>

      {/* Navigare taburi */}
      <div style={{ 
        marginBottom: '20px',
        display: 'flex',
        gap: '8px',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <button
          onClick={() => window.location.hash = 'notes'}
          style={{
            padding: '12px 24px',
            background: window.location.hash === '' || window.location.hash === '#notes' ? '#3b82f6' : 'transparent',
            color: window.location.hash === '' || window.location.hash === '#notes' ? 'white' : '#374151',
            border: 'none',
            borderBottom: window.location.hash === '' || window.location.hash === '#notes' ? '3px solid #3b82f6' : '3px solid transparent',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            marginBottom: '-2px'
          }}
        >
          📝 Notițe
        </button>
        <button
          onClick={() => window.location.hash = 'groups'}
          style={{
            padding: '12px 24px',
            background: window.location.hash === '#groups' ? '#8b5cf6' : 'transparent',
            color: window.location.hash === '#groups' ? 'white' : '#374151',
            border: 'none',
            borderBottom: window.location.hash === '#groups' ? '3px solid #8b5cf6' : '3px solid transparent',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            marginBottom: '-2px'
          }}
        >
          👥 Grupuri de Studiu
        </button>
        <button
          onClick={() => window.location.hash = 'subjects'}
          style={{
            padding: '12px 24px',
            background: window.location.hash === '#subjects' ? '#10b981' : 'transparent',
            color: window.location.hash === '#subjects' ? 'white' : '#374151',
            border: 'none',
            borderBottom: window.location.hash === '#subjects' ? '3px solid #10b981' : '3px solid transparent',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            marginBottom: '-2px'
          }}
        >
          📚 Materii
        </button>
      </div>

      {/* Buton adaugă notița */}
      {(window.location.hash === '' || window.location.hash === '#notes') && (
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              padding: '12px 24px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            + Adaugă Notița Nouă
          </button>
        </div>
      )}

      {currentView === 'notes' && (
        <>
          {/*  state */}
          {loading && <p>Se încarcă notițele...</p>}

      {/* Error state */}
      {error && <p style={{ color: '#dc3545' }}>{error}</p>}

      {/* Lista de notițe */}
      {!loading && !error && (
        <div>
          {subjectFilter && (
            <div style={{ marginBottom: '16px', padding: '12px', background: '#eff6ff', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#1e40af', fontSize: '14px' }}>
                📚 Filtrat după materie
              </span>
              <button
                onClick={() => window.location.hash = 'notes'}
                style={{
                  padding: '4px 12px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                ✖ Şterge filtru
              </button>
            </div>
          )}
          {myNotes.filter(note => !subjectFilter || note.subjectId === subjectFilter).length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              background: '#f9fafb',
              borderRadius: '8px'
            }}>
              <p style={{ fontSize: '18px', color: '#6b7280' }}>
                {subjectFilter ? 'Nu există notițe pentru această materie.' : 'Nu ai nicio notiță încă. Creează prima ta notiță!'}
              </p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gap: '16px',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
            }}>
              {myNotes.filter(note => !subjectFilter || note.subjectId === subjectFilter).map((note) => (
                <div
                  key={note.id}
                  onClick={() => handleViewNote(note)}
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
                  {/* Titlu notită */}
                  <h3 style={{ 
                    margin: '0 0 10px 0', 
                    fontSize: '18px',
                    color: '#111827'
                  }}>
                    {note.title}
                  </h3>

                  {/* Materie și data */}
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#6b7280',
                    marginBottom: '12px',
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'wrap'
                  }}>
                    {note.subject && (
                      <span style={{ 
                        background: note.subject.color || '#3b82f6',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        {note.subject.name}
                      </span>
                    )}
                    {note.courseDate && (
                      <span>📅 {formatDateTime(note.courseDate)}</span>
                    )}
                    {note.isPublic && (
                      <span>🌐 Publică</span>
                    )}
                  </div>

                  {/* Preview conținut */}
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
                    {getPlainTextPreview(note.content, 150)}
                  </p>

                  {/* Tag-uri */}
                  {note.tags && note.tags.length > 0 && (
                    <div style={{ 
                      display: 'flex', 
                      gap: '6px', 
                      flexWrap: 'wrap',
                      marginBottom: '12px'
                    }}>
                      {note.tags.map((noteTag) => (
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

                  {/* Acțiuni */}
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
                      🔗 Distribuie
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
                      🗑️ Șterge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
        </>
      )}

      {currentView === 'groups' && (
        <GroupsView user={user} />
      )}

      {currentView === 'subjects' && (
        <SubjectsView />
      )}

      {currentView === 'group-detail' && selectedGroupId && (
        <GroupDetailView 
          groupId={selectedGroupId} 
          user={user} 
          onBack={() => window.location.hash = 'groups'}
        />
      )}

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