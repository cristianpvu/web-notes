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
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
          padding: '24px',
          borderRadius: '12px 12px 0 0',
          borderBottom: '3px solid #374151'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, color: 'white', fontSize: '24px', fontWeight: '600' }}>
              Adaugă notița nouă
            </h2>
            <button
              onClick={handleClose}
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
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
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
                padding: '10px 14px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              placeholder="Ex: Curs 1 - Introducere în Web Technologies"
              onFocus={(e) => e.target.style.borderColor = '#1f2937'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
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
                padding: '10px 14px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'Monaco, Menlo, "Courier New", monospace',
                outline: 'none',
                transition: 'border-color 0.2s',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
              placeholder="Scrie notițele aici... Poți folosi Markdown pentru formatare!"
              onFocus={(e) => e.target.style.borderColor = '#1f2937'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
              Materie
            </label>
            <select
              name="subjectId"
              value={formData.subjectId}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '15px',
                outline: 'none',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
            >
              <option value="">Selectează materia</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} {subject.code ? `(${subject.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
              Data cursului
            </label>
            <input
              type="datetime-local"
              name="courseDate"
              value={formData.courseDate}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
              Cuvinte cheie (separate prin virgulă)
            </label>
            <input
              type="text"
              name="keywords"
              value={formData.keywords}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              placeholder="Ex: react, hooks, components"
              onFocus={(e) => e.target.style.borderColor = '#1f2937'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {tags.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
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
                      border: formData.tagIds.includes(tag.id) ? '2px solid #1f2937' : '2px solid #e5e7eb',
                      borderRadius: '20px',
                      background: formData.tagIds.includes(tag.id) ? '#f3f4f6' : 'white',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                      transition: 'all 0.2s',
                      color: formData.tagIds.includes(tag.id) ? '#1f2937' : '#6b7280'
                    }}
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
              Sursă (opțional)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '10px' }}>
              <select
                name="sourceType"
                value={formData.sourceType}
                onChange={handleChange}
                style={{
                  padding: '10px 14px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  outline: 'none'
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
                  padding: '10px 14px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#1f2937'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          </div>

          <div style={{ 
            marginBottom: '24px',
            padding: '16px',
            background: '#f9fafb',
            border: '2px solid #e5e7eb',
            borderRadius: '8px'
          }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleChange}
                style={{ marginRight: '12px', marginTop: '3px', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', color: '#374151' }}>
                  Fă notița publică
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  Notița va putea fi vizualizată de oricine are link-ul (doar citire)
                </div>
              </div>
            </label>
          </div>

          {error && (
            <div style={{ 
              padding: '12px 16px', 
              background: '#fee2e2', 
              color: '#dc2626',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '14px',
              border: '1px solid #fecaca'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              style={{
                padding: '12px 24px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '500',
                color: '#6b7280',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.target.style.borderColor = '#d1d5db'
                e.target.style.background = '#f9fafb'
              }}
              onMouseOut={(e) => {
                e.target.style.borderColor = '#e5e7eb'
                e.target.style.background = 'white'
              }}
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                background: loading ? '#9ca3af' : '#1f2937',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(31, 41, 55, 0.3)'
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.target.style.background = '#111827'
                  e.target.style.transform = 'translateY(-1px)'
                  e.target.style.boxShadow = '0 6px 16px rgba(31, 41, 55, 0.4)'
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.target.style.background = '#1f2937'
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 4px 12px rgba(31, 41, 55, 0.3)'
                }
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