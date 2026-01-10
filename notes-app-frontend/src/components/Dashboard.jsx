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
  const [activeTab, setActiveTab] = useState('my-notes')
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
        setActiveTab('groups')
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
        if (!hash || hash === 'notes' || hash === 'my-notes') {
          setActiveTab('my-notes')
        } else if (hash === 'shared') {
          setActiveTab('shared')
        }
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
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto',
        background: 'white',
        borderRadius: '16px',
        padding: '30px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '2px solid #f0f0f0'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '32px', color: '#1f2937' }}>📚 Notițele mele</h1>
            <p style={{ margin: '5px 0 0', color: '#6b7280' }}>
              Bine ai venit, <strong>{user?.name || user?.email}</strong>
            </p>
          </div>
          <button
            onClick={onLogout}
            style={{
              padding: '10px 20px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Logout
          </button>
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

        {currentView === 'notes' && activeTab === 'my-notes' && (
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
              <>
                {subjectFilter && (
                  <div style={{ 
                    marginBottom: '16px', 
                    padding: '12px', 
                    background: '#eff6ff', 
                    borderRadius: '6px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}>
                    <span style={{ color: '#1e40af', fontSize: '14px' }}>
                      📚 Filtrat după materie
                    </span>
                    <button
                      onClick={() => window.location.hash = 'my-notes'}
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
                      ✖ Șterge filtru
                    </button>
                  </div>
                )}

                {myNotes.filter(note => !subjectFilter || note.subjectId === subjectFilter).length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '60px 20px',
                    background: 'white',
                    borderRadius: '12px',
                    border: '2px dashed #e5e7eb'
                  }}>
                    <p style={{ fontSize: '18px', color: '#6b7280', margin: 0 }}>
                      {subjectFilter ? 'Nu există notițe pentru această materie.' : 'Nu ai nicio notița încă. Creează prima ta notița!'}
                    </p>
                  </div>
                ) : (
                  <div style={{ 
                    display: 'grid', 
                    gap: '16px',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))'
                  }}>
                    {myNotes.filter(note => !subjectFilter || note.subjectId === subjectFilter).map((note) => renderNoteCard(note, false))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {currentView === 'notes' && activeTab === 'shared' && (
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