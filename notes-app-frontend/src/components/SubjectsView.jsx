import React, { useState, useEffect } from 'react'
import { getSubjects, createSubject, updateSubject, deleteSubject } from '../services/api'

const PRESET_COLORS = [
  { name: 'Albastru', value: '#3b82f6' },
  { name: 'Verde', value: '#10b981' },
  { name: 'Roșu', value: '#ef4444' },
  { name: 'Portocaliu', value: '#f59e0b' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Roz', value: '#ec4899' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Indigo', value: '#6366f1' },
]

function SubjectsView() {
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingSubject, setEditingSubject] = useState(null)

  useEffect(() => {
    loadSubjects()
  }, [])

  const loadSubjects = async () => {
    try {
      setLoading(true)
      const data = await getSubjects()
      setSubjects(data)
    } catch (err) {
      console.error('Eroare la încărcarea materiilor:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSubject = async (subjectData) => {
    try {
      await createSubject(subjectData)
      loadSubjects()
      setShowCreateModal(false)
      alert('✓ Materie creată cu succes!')
    } catch (err) {
      alert(err.response?.data?.error || 'Eroare la crearea materiei')
    }
  }

  const handleUpdateSubject = async (id, subjectData) => {
    try {
      await updateSubject(id, subjectData)
      loadSubjects()
      setEditingSubject(null)
      alert('✓ Materie actualizată!')
    } catch (err) {
      alert(err.response?.data?.error || 'Eroare la actualizarea materiei')
    }
  }

  const handleDeleteSubject = async (id) => {
    if (!confirm('Sigur vrei să ștergi această materie? Notițele nu vor fi șterse, doar asocierea cu materia.')) return
    try {
      await deleteSubject(id)
      loadSubjects()
      alert('✓ Materie ștearsă')
    } catch (err) {
      alert('Eroare la ștergerea materiei')
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>Se încarcă...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', color: '#111827' }}>
            📚 Materiile Mele
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
            Organizează-ți notițele pe materii
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
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
          ➕ Adaugă Materie
        </button>
      </div>

      {subjects.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          background: '#f9fafb',
          borderRadius: '8px'
        }}>
          <p style={{ fontSize: '18px', color: '#6b7280' }}>
            Nu ai adăugat încă nicio materie. Creează prima ta materie!
          </p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '20px' 
        }}>
          {subjects.map(subject => (
            <div
              key={subject.id}
              style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                borderLeft: `4px solid ${subject.color}`
              }}
            >
              <div style={{ marginBottom: '12px' }}>
                <h3 style={{ 
                  margin: '0 0 4px 0', 
                  fontSize: '18px', 
                  fontWeight: '600',
                  color: '#111827'
                }}>
                  {subject.name}
                </h3>
                {subject.code && (
                  <p style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '13px', 
                    color: '#6b7280',
                    fontFamily: 'monospace'
                  }}>
                    {subject.code}
                  </p>
                )}
                {subject.description && (
                  <p style={{ 
                    margin: '8px 0 0 0', 
                    fontSize: '14px', 
                    color: '#4b5563',
                    lineHeight: '1.4'
                  }}>
                    {subject.description}
                  </p>
                )}
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '12px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>
                  📝 {subject._count.notes} notițe
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => window.location.hash = `notes?subject=${subject.id}`}
                    style={{
                      padding: '6px 12px',
                      background: '#ecfdf5',
                      color: '#059669',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    👁️ Vezi notițe
                  </button>
                  <button
                    onClick={() => setEditingSubject(subject)}
                    style={{
                      padding: '6px 12px',
                      background: '#eff6ff',
                      color: '#2563eb',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    ✏️ Editează
                  </button>
                  <button
                    onClick={() => handleDeleteSubject(subject.id)}
                    style={{
                      padding: '6px 12px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Creare Materie */}
      {showCreateModal && (
        <SubjectModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateSubject}
        />
      )}

      {/* Modal Editare Materie */}
      {editingSubject && (
        <SubjectModal
          subject={editingSubject}
          onClose={() => setEditingSubject(null)}
          onSave={(data) => handleUpdateSubject(editingSubject.id, data)}
        />
      )}
    </div>
  )
}

function SubjectModal({ subject, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: subject?.name || '',
    code: subject?.code || '',
    color: subject?.color || '#3b82f6',
    description: subject?.description || ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '24px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>
          {subject ? 'Editează Materia' : 'Adaugă Materie Nouă'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Nume Materie *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="ex: Matematică, Fizică, Programare..."
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Cod Materie
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="ex: MAT101, FIZ201..."
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'monospace'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Culoare
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {PRESET_COLORS.map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  title={color.name}
                  style={{
                    width: '40px',
                    height: '40px',
                    background: color.value,
                    border: formData.color === color.value ? '3px solid #111827' : '2px solid #e5e7eb',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                />
              ))}
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                style={{
                  width: '40px',
                  height: '40px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Descriere
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              placeholder="Detalii despre materie..."
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Anulează
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {subject ? 'Actualizează' : 'Creează'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SubjectsView
