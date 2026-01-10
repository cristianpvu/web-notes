import React, { useState, useEffect, useRef } from 'react'
import { createNote, getSubjects, getTags } from '../services/api'


function AddNoteModal({ isOpen, onClose, onNoteAdded, preselectedGroupId, preselectedSubjectId }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    subjectId: '',
    courseDate: '',
    keywords: '',
    isPublic: false,
    sourceType: '',
    sourceUrl: '',
    tagIds: [],
    groupId: ''
  })
  
  const [subjects, setSubjects] = useState([])
  const [tags, setTags] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    h1: false,
    h2: false,
    h3: false,
    ul: false,
    ol: false,
    code: false,
    blockquote: false
  })
  const editorRef = useRef(null)


  useEffect(() => {
    if (isOpen) {
      loadData()
      // Set preselected values when modal opens
      setFormData(prev => ({
        ...prev,
        groupId: preselectedGroupId || '',
        subjectId: preselectedSubjectId || ''
      }))
    }
  }, [isOpen, preselectedGroupId, preselectedSubjectId])


  const loadData = async () => {
    try {
      const [subjectsData, tagsData, groupsData] = await Promise.all([
        getSubjects(),
        getTags(),
        fetch('https://web-notes-nine.vercel.app/api/groups', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(res => res.json())
      ])
      setSubjects(subjectsData || [])
      setTags(tagsData || [])
      // API returnează { created: [...], member: [...] }
      const allGroups = [
        ...(Array.isArray(groupsData?.created) ? groupsData.created : []),
        ...(Array.isArray(groupsData?.member) ? groupsData.member : [])
      ]
      const uniqueGroups = allGroups.filter((group, index, self) =>
        index === self.findIndex(g => g.id === group.id)
      )
      setGroups(uniqueGroups)
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

    // Capture current content from editor
    if (editorRef.current) {
      formData.content = editorRef.current.innerHTML || ''
    }

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
        tagIds: formData.tagIds,
        groupId: formData.groupId || null
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

  const insertMarkdown = (before, after = '', placeholder = '') => {
    const textarea = document.querySelector('textarea[name="content"]')
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = formData.content.substring(start, end)
    const textToInsert = selectedText || placeholder
    const newText = formData.content.substring(0, start) + before + textToInsert + after + formData.content.substring(end)
    
    setFormData({ ...formData, content: newText })
    
    setTimeout(() => {
      textarea.focus()
      const newPosition = start + before.length + textToInsert.length
      textarea.setSelectionRange(newPosition, newPosition)
    }, 0)
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
    formData.content = e.target.innerHTML
    checkActiveFormats()
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
                🔗 Link
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
              id="addNoteRichTextEditor"
              contentEditable
              onInput={handleEditorInput}
              onMouseUp={checkActiveFormats}
              onKeyUp={checkActiveFormats}
              suppressContentEditableWarning
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '10px 14px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                lineHeight: '1.8',
                background: 'white',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
                overflowY: 'auto'
              }}
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
              Grup de studiu (opțional)
            </label>
            <select
              name="groupId"
              value={formData.groupId}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '15px',
                outline: 'none',
                cursor: 'pointer',
                boxSizing: 'border-box',
                background: formData.groupId ? '#f5f3ff' : 'white'
              }}
            >
              <option value="">Fără grup (notița personală)</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  👥 {group.name}
                </option>
              ))}
            </select>
            {formData.groupId && (
              <p style={{ fontSize: '12px', color: '#7c3aed', marginTop: '6px', marginBottom: 0 }}>
                ℹ️ Notița va fi vizibilă tuturor membrilor grupului
              </p>
            )}
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