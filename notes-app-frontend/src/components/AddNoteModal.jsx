import React, { useState, useEffect } from 'react'
import { createNote, getSubjects, getTags } from '../services/api'


function AddNoteModal({ isOpen, onClose, onNoteAdded }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    subjectId: '',
    courseDate: '',
    keywords: '',
    isPublic: false,
    sourceType: '',
    sourceUrl: '',
    tagIds: []
  })
  
  const [subjects, setSubjects] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')


  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])


  const loadData = async () => {
    try {
      const [subjectsData, tagsData] = await Promise.all([
        getSubjects(),
        getTags()
      ])
      setSubjects(subjectsData || [])
      setTags(tagsData || [])
    } catch (err) {
      console.error('Eroare la încărcarea datelor:', err)
    }
  }


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }


  const handleTagToggle = (tagId) => {
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...prev.tagIds, tagId]
    }))
  }


  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const noteData = {
        title: formData.title,
        content: formData.content,
        subjectId: formData.subjectId || null,
        courseDate: formData.courseDate ? new Date(formData.courseDate).toISOString() : null,
        keywords: formData.keywords ? formData.keywords.split(',').map(k => k.trim()) : [],
        isPublic: formData.isPublic,
        sourceType: formData.sourceType || null,
        sourceUrl: formData.sourceUrl || null,
        tagIds: formData.tagIds
      }

      const newNote = await createNote(noteData)
      onNoteAdded(newNote)
      handleClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Eroare la crearea notiței')
    } finally {
      setLoading(false)
    }
  }


  const handleClose = () => {
    setFormData({
      title: '',
      content: '',
      subjectId: '',
      courseDate: '',
      keywords: '',
      isPublic: false,
      sourceType: '',
      sourceUrl: '',
      tagIds: []
    })
    setError('')
    onClose()
  }

  if (!isOpen) return null

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
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '24px'
      }}>
        <h2 style={{ margin: '0 0 20px 0' }}>📝 Adaugă Notița Nouă</h2>

        <form onSubmit={handleSubmit}>
          {/* Titlu */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
              Titlu *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              placeholder="Ex: Curs 1 - Introducere în Web Technologies"
            />
          </div>

          {/* Conținut */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
              Conținut (Markdown) *
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows={8}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'monospace'
              }}
              placeholder="Scrie notițele aici... Poți folosi Markdown pentru formatare!"
            />
          </div>

          {/* Materie */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
              Materie
            </label>
            <select
              name="subjectId"
              value={formData.subjectId}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="">-- Selectează materia --</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} {subject.code ? `(${subject.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Data cursului */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
              Data cursului
            </label>
            <input
              type="datetime-local"
              name="courseDate"
              value={formData.courseDate}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Cuvinte cheie */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
              Cuvinte cheie (separate prin virgulă)
            </label>
            <input
              type="text"
              name="keywords"
              value={formData.keywords}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              placeholder="Ex: react, hooks, components"
            />
          </div>

          {/* Tag-uri */}
          {tags.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                Tag-uri
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagToggle(tag.id)}
                    style={{
                      padding: '6px 12px',
                      border: formData.tagIds.includes(tag.id) ? '2px solid #3b82f6' : '1px solid #d1d5db',
                      borderRadius: '16px',
                      background: formData.tagIds.includes(tag.id) ? '#eff6ff' : 'white',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sursă */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
              Sursă (opțional)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px' }}>
              <select
                name="sourceType"
                value={formData.sourceType}
                onChange={handleChange}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="">Tip</option>
                <option value="youtube">YouTube</option>
                <option value="kindle">Kindle</option>
                <option value="conference">Conferință</option>
                <option value="article">Articol</option>
                <option value="other">Altele</option>
              </select>
              <input
                type="url"
                name="sourceUrl"
                value={formData.sourceUrl}
                onChange={handleChange}
                placeholder="URL sursă"
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          {/* Notița publică */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleChange}
                style={{ marginRight: '8px' }}
              />
              <span style={{ fontSize: '14px' }}>🌐 Fă notița publică (poate fi vizualizată printr-un link)</span>
            </label>
          </div>

          {/* Eroare */}
          {error && (
            <div style={{ 
              padding: '12px', 
              background: '#fee2e2', 
              color: '#dc2626',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* Butoane */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              style={{
                padding: '10px 20px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                background: '#3b82f6',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {loading ? 'Se salvează...' : 'Salvează notița'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddNoteModal
