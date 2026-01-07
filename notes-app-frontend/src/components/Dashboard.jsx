import React, { useState, useEffect } from 'react'
import { getNotes, deleteNote } from '../services/api'
import { formatDateTime } from '../lib/utils'
import AddNoteModal from './AddNoteModal'

/**
 * Componenta Dashboard - afișează lista de notițe
 * Include funcționalități de vizualizare, filtrare și management notițe
 */
function Dashboard({ user, onLogout }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)


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

  /**
   * Callback când o notița nouă e adăugată
   */
  const handleNoteAdded = (newNote) => {
    setNotes([newNote, ...notes])
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
                  style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    transition: 'box-shadow 0.2s',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'}
                  onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'}
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
                        // Va fi implementat
                      }}
                      style={{
                        flex: 1,
                        padding: '6px 12px',
                        background: '#f3f4f6',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      ✏️ Editează
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
    </div>
  )
}

export default Dashboard
