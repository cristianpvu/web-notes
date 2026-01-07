import React, { useState, useEffect } from 'react'
import { getNotes, deleteNote } from '../services/api'
import { formatDateTime } from '../lib/utils'
import AddNoteModal from './AddNoteModal'
import ViewNoteModal from './ViewNoteModal'


function Dashboard({ user, onLogout }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)


  useEffect(() => {
    loadNotes()
  }, [])


  const loadNotes = async () => {
    try {
      setLoading(true)
      const data = await getNotes()
      setNotes(data.notes || [])
    } catch (err) {
      setError('Eroare la încărcarea notițelor')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }


  /**
   * Șterge o notița
   */
  const handleDelete = async (id) => {
    if (!window.confirm('Sigur vrei să ștergi această notița?')) return
    
    try {
      await deleteNote(id)
      setNotes(notes.filter(note => note.id !== id))
    } catch (err) {
      alert('Eroare la ștergerea notiței')
    }
  }


  const handleNoteAdded = (newNote) => {
    setNotes([newNote, ...notes])
  }


  const handleViewNote = (note) => {
    setSelectedNote(note)
    setIsViewModalOpen(true)
  }


  const handleNoteUpdated = (updatedNote) => {
    setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n))
    setSelectedNote(updatedNote)
  }


  const handleShare = (note) => {
    const shareUrl = `${window.location.origin}/note/${note.id}`
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert(`✓ Link copiat în clipboard!\n\n${shareUrl}\n\nPoți distribui acest link colegilor.`)
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

      {/* Buton adaugă notița */}
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

      {/* Loading state */}
      {loading && <p>Se încarcă notițele...</p>}

      {/* Error state */}
      {error && <p style={{ color: '#dc3545' }}>{error}</p>}

      {/* Lista de notițe */}
      {!loading && !error && (
        <div>
          {notes.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              background: '#f9fafb',
              borderRadius: '8px'
            }}>
              <p style={{ fontSize: '18px', color: '#6b7280' }}>
                Nu ai nicio notița încă. Creează prima ta notița!
              </p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gap: '16px',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
            }}>
              {notes.map((note) => (
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
                    {note.content.substring(0, 150)}...
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

      {/* Modal adăugare notița */}
      <AddNoteModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onNoteAdded={handleNoteAdded}
      />

      {/* Modal vizualizare/editare notița */}
      <ViewNoteModal
        note={selectedNote}
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        onNoteUpdated={handleNoteUpdated}
        onShare={handleShare}
      />
    </div>
  )
}

export default Dashboard
