import React, { useState, useEffect } from 'react'
import { getNotes, deleteNote, getNoteById, getPublicNoteById } from '../services/api'
import { formatDateTime } from '../lib/utils'
import AddNoteModal from './AddNoteModal'
import ViewNoteModal from './ViewNoteModal'
import Sidebar from './Sidebar'
import { useLanguage } from '../i18n/LanguageContext'


function Dashboard({ user, onLogout }) {
  const { t } = useLanguage()
  const [myNotes, setMyNotes] = useState([])
  const [sharedNotes, setSharedNotes] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [subjectFilter, setSubjectFilter] = useState(null)
  const [tagFilter, setTagFilter] = useState(null)
  const [activeFilter, setActiveFilter] = useState({ type: 'all' })
  const [selectedGroupId, setSelectedGroupId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

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
    if (!window.confirm(t('confirmDeleteNote'))) return
    
    try {
      await deleteNote(id)
      setMyNotes(myNotes.filter(note => note.id !== id))
    } catch (err) {
      alert(t('errorDeleting'))
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

  const handleFilterChange = (filter) => {
    setActiveFilter(filter)
    
    // reset filters
    if (filter.type === 'all') {
      setSubjectFilter(null)
      setSelectedGroupId(null)
    } else if (filter.type === 'group') {
      setSelectedGroupId(filter.id)
      setSubjectFilter(null)
    } else if (filter.type === 'subject') {
      setSubjectFilter(filter.id)
      setSelectedGroupId(null)
    }
  }

  const getFilteredNotes = () => {
    let filteredNotes = [...myNotes]
    
    // search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filteredNotes = filteredNotes.filter(note => {
        const titleMatch = note.title?.toLowerCase().includes(query)
        const contentMatch = getPlainTextPreview(note.content, 1000).toLowerCase().includes(query)
        const tagMatch = note.tags?.some(nt => nt.tag.name.toLowerCase().includes(query))
        const subjectMatch = note.subject?.name.toLowerCase().includes(query)
        return titleMatch || contentMatch || tagMatch || subjectMatch
      })
    }
    
    // group filter
    if (selectedGroupId) {
      filteredNotes = filteredNotes.filter(note => 
        note.groupNotes?.some(gn => gn.groupId === selectedGroupId)
      )
    }
    
    // subject filter
    if (subjectFilter) {
      filteredNotes = filteredNotes.filter(note => note.subjectId === subjectFilter)
    }
    
    // tag filter
    if (tagFilter) {
      filteredNotes = filteredNotes.filter(note => 
        note.tags?.some(nt => nt.tag.id === tagFilter)
      )
    }
    
    return filteredNotes
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
        {/* Afișează grupurile asociate notiței */}
        {!isShared && note.groupNotes && note.groupNotes.length > 0 && (
          <span style={{ 
            background: '#374151',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px'
          }}>
            {note.groupNotes[0].group?.name || 'Grup'}
          </span>
        )}
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
        {!isShared && note.user && note.userId !== user?.id && (
          <span style={{ fontStyle: 'italic' }}>
            de {note.user.name || note.user.email}
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
              onClick={(e) => {
                e.stopPropagation()
                window.location.hash = `my-notes?tag=${noteTag.tag.id}`
              }}
              style={{
                fontSize: '12px',
                background: noteTag.tag.color || '#f3f4f6',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              #{noteTag.tag.name}
            </span>
          ))}
        </div>
      )}

      {!isShared && note.userId === user?.id && (
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
            {t('share')}
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
            {t('delete')}
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: '1600px', 
        margin: '0 auto',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        overflow: 'hidden',
        minHeight: 'calc(100vh - 40px)'
      }}>
        {/* sidebar */}
        <Sidebar 
          onFilterChange={handleFilterChange}
          activeFilter={activeFilter}
          onNavigateToGroups={() => {}}
          onNavigateToSubjects={() => {}}
        />

        {/* content */}
        <div style={{ 
          flex: 1,
          padding: '30px',
          overflowY: 'auto'
        }}>
          {/* header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '30px',
            paddingBottom: '20px',
            borderBottom: '2px solid #f0f0f0'
          }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '28px', color: '#1f2937', fontWeight: '600' }}>
                {t('myNotes')}
              </h1>
              <p style={{ margin: '5px 0 0', color: '#6b7280' }}>
                {t('welcome')}, <strong>{user?.name || user?.email}</strong>
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
              {t('logout')}
            </button>
          </div>

        {/* note content */}
        {(
          <div>
            {/* search bar */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 16px',
                    fontSize: '15px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#1f2937'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#6b7280',
                      cursor: 'pointer',
                      fontSize: '18px',
                      padding: '4px 8px'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#1f2937'}
                    onMouseLeave={(e) => e.target.style.color = '#6b7280'}
                  >
                    ×
                  </button>
                )}
                {!searchQuery && (
                  <span style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af',
                    pointerEvents: 'none'
                  }}>
                    🔍
                  </span>
                )}
              </div>
            </div>
            
            {/* active filter */}
            {activeFilter.type !== 'all' && (
              <div style={{ 
                marginBottom: '20px', 
                padding: '12px 16px', 
                background: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#6b7280',
                    marginBottom: '2px'
                  }}>
                    {activeFilter.type === 'group' ? t('filteredByGroup') : t('filteredBySubject')}
                  </div>
                  <div style={{ 
                    fontSize: '15px', 
                    fontWeight: '600',
                    color: '#1f2937'
                  }}>
                    {activeFilter.name}
                  </div>
                </div>
                <button
                  onClick={() => handleFilterChange({ type: 'all' })}
                  style={{
                    padding: '8px 16px',
                    background: 'white',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f9fafb'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white'
                  }}
                >
                  Șterge filtru
                </button>
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <button
                onClick={() => setIsAddModalOpen(true)}
                style={{
                  padding: '10px 20px',
                  background: '#1f2937',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#374151'
                }}
                onMouseOut={(e) => {
                  e.target.style.background = '#1f2937'
                }}
              >
                {t('addNoteButton')}
              </button>
            </div>

            {loading && <p>{t('loadingNotes')}</p>}
            {error && <p style={{ color: '#dc3545' }}>{error}</p>}

            {!loading && !error && (
              <>
                {getFilteredNotes().length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    background: 'white',
                    borderRadius: '12px',
                    border: '2px dashed #e5e7eb'
                  }}>
                    <p style={{ fontSize: '18px', color: '#6b7280', margin: 0 }}>
                      {activeFilter.type === 'all'
                        ? t('noNotesYet')
                        : (activeFilter.type === 'group' ? t('noNotesInGroup') : t('noNotesInSubject'))
                      }
                    </p>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gap: '16px',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))'
                  }}>
                    {getFilteredNotes().map((note) => renderNoteCard(note, false))}
                  </div>
                )}

                {/* Shared notes section */}
                {activeFilter.type === 'all' && sharedNotes.length > 0 && (
                  <div style={{ marginTop: '40px' }}>
                    <h2 style={{
                      fontSize: '22px',
                      color: '#1f2937',
                      marginBottom: '20px',
                      paddingBottom: '10px',
                      borderBottom: '2px solid #e5e7eb'
                    }}>
                      {t('sharedWithMe') || 'Partajate cu mine'}
                    </h2>
                    <div style={{
                      display: 'grid',
                      gap: '16px',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))'
                    }}>
                      {sharedNotes.map((sharedNote) => renderNoteCard(sharedNote, true, sharedNote.permission))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        </div>
      </div>

      <AddNoteModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onNoteAdded={handleNoteAdded}
        preselectedGroupId={activeFilter?.type === 'group' ? activeFilter.id : null}
        preselectedSubjectId={activeFilter?.type === 'subject' ? activeFilter.id : null}
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