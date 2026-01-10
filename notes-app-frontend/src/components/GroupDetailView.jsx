import React, { useState, useEffect } from 'react'
import { getGroupById, inviteMember, removeMember, updateMemberPermissions, addNoteToGroup, removeNoteFromGroup } from '../services/api'
import { formatDateTime } from '../lib/utils'

function GroupDetailView({ groupId, user, onBack }) {
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showAddNoteModal, setShowAddNoteModal] = useState(false)
  const [activeTab, setActiveTab] = useState('notes')

  useEffect(() => {
    loadGroup()
  }, [groupId])

  const loadGroup = async () => {
    try {
      setLoading(true)
      const data = await getGroupById(groupId)
      setGroup(data)
    } catch (err) {
      console.error('Eroare la încărcarea grupului:', err)
      alert('Eroare la încărcarea grupului')
      onBack()
    } finally {
      setLoading(false)
    }
  }

  const handleInviteMember = async (email, role) => {
    try {
      await inviteMember(groupId, email, role, 'read')
      loadGroup()
      setShowInviteModal(false)
      alert('Membru invitat cu succes')
    } catch (err) {
      alert(err.response?.data?.error || 'Eroare la invitarea membrului')
    }
  }

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Sigur vrei să elimini acest membru?')) return
    try {
      await removeMember(groupId, memberId)
      loadGroup()
      alert('Membru eliminat')
    } catch (err) {
      alert('Eroare la eliminarea membrului')
    }
  }

  const handleUpdateRole = async (memberId, role) => {
    try {
      await updateMemberPermissions(groupId, memberId, role, 'read')
      loadGroup()
      alert('Rol actualizat')
    } catch (err) {
      alert('Eroare la actualizarea rolului')
    }
  }

  const handleAddNote = async (noteId) => {
    try {
      await addNoteToGroup(groupId, noteId)
      loadGroup()
      setShowAddNoteModal(false)
      alert('Notița adăugată la grup')
    } catch (err) {
      alert(err.response?.data?.error || 'Eroare la adăugarea notiței')
    }
  }

  const handleRemoveNote = async (noteId) => {
    if (!confirm('Sigur vrei să elimini această notița din grup?')) return
    try {
      await removeNoteFromGroup(groupId, noteId)
      loadGroup()
      alert('Notița eliminată din grup')
    } catch (err) {
      alert('Eroare la eliminarea notiței')
    }
  }

  const copyGroupId = () => {
    navigator.clipboard.writeText(groupId).then(() => {
      alert('ID-ul grupului a fost copiat în clipboard')
    })
  }

  const getPlainTextPreview = (htmlContent, maxLength = 150) => {
    if (!htmlContent) return ''
    const withoutTags = htmlContent.replace(/<[^>]*>/g, ' ')
    const cleaned = withoutTags.replace(/\s+/g, ' ').trim()
    return cleaned.length > maxLength 
      ? cleaned.substring(0, maxLength) + '...' 
      : cleaned
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>Se încarcă...</div>

  if (!group) return null

  const isCreator = group.isCreator
  const isAdmin = group.myMembership?.role === 'admin' || isCreator
  const canEdit = (group.myMembership?.role === 'admin' || group.myMembership?.role === 'editor') || isCreator

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={onBack}
          style={{
            padding: '8px 16px',
            background: '#f3f4f6',
            color: '#374151',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '16px',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.target.style.background = '#e5e7eb'}
          onMouseOut={(e) => e.target.style.background = '#f3f4f6'}
        >
          ← Înapoi la grupuri
        </button>

        <div style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '28px', color: '#111827' }}>{group.name}</h1>
                {group.isPrivate && (
                  <span style={{ 
                    background: '#fef3c7', 
                    color: '#92400e', 
                    padding: '4px 12px', 
                    borderRadius: '6px', 
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    Privat
                  </span>
                )}
                {isCreator && (
                  <span style={{ 
                    background: '#1f2937', 
                    color: 'white', 
                    padding: '4px 12px', 
                    borderRadius: '6px', 
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    Creator
                  </span>
                )}
              </div>
              {group.description && (
                <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: '15px', lineHeight: '1.5' }}>
                  {group.description}
                </p>
              )}
              <div style={{ marginTop: '12px', display: 'flex', gap: '20px', fontSize: '13px', color: '#6b7280', flexWrap: 'wrap' }}>
                <span>{group.members.length} membri</span>
                <span>{group.notes.length} notițe</span>
                <button
                  onClick={copyGroupId}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#1f2937',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontSize: '13px',
                    padding: 0,
                    fontWeight: '500'
                  }}
                >
                  Copiază ID grup
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e5e7eb' }}>
          <button
            onClick={() => setActiveTab('notes')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'notes' ? '#1f2937' : 'transparent',
              color: activeTab === 'notes' ? 'white' : '#374151',
              border: 'none',
              borderBottom: activeTab === 'notes' ? '3px solid #1f2937' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              marginBottom: '-2px',
              borderRadius: '8px 8px 0 0',
              transition: 'all 0.2s'
            }}
          >
            Notițe ({group.notes.length})
          </button>
          <button
            onClick={() => setActiveTab('members')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'members' ? '#1f2937' : 'transparent',
              color: activeTab === 'members' ? 'white' : '#374151',
              border: 'none',
              borderBottom: activeTab === 'members' ? '3px solid #1f2937' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              marginBottom: '-2px',
              borderRadius: '8px 8px 0 0',
              transition: 'all 0.2s'
            }}
          >
            Membri ({group.members.length})
          </button>
        </div>
      </div>

      {activeTab === 'notes' && (
        <div>
          {canEdit && (
            <button
              onClick={() => setShowAddNoteModal(true)}
              style={{
                padding: '12px 24px',
                background: '#1f2937',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '20px',
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
              + Adaugă notița
            </button>
          )}

          {group.notes.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              background: 'white',
              borderRadius: '12px',
              border: '2px dashed #e5e7eb'
            }}>
              <p style={{ fontSize: '18px', color: '#6b7280', margin: 0 }}>
                Nu există notițe în acest grup încă.
              </p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gap: '16px',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))'
            }}>
              {group.notes.map(({ note, addedAt }) => (
                <div
                  key={note.id}
                  style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
                  <h3 style={{ 
                    margin: '0 0 10px 0', 
                    fontSize: '18px',
                    color: '#111827'
                  }}>
                    {note.title}
                  </h3>

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
                        background: note.subject.color || '#4b5563',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        {note.subject.name}
                      </span>
                    )}
                    {note.user && (
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
                    {getPlainTextPreview(note.content, 150)}
                  </p>

                  <p style={{ 
                    fontSize: '13px',
                    color: '#9ca3af',
                    marginBottom: '12px'
                  }}>
                    Adăugată: {formatDateTime(addedAt)}
                  </p>

                  {isAdmin && (
                    <button
                      onClick={() => handleRemoveNote(note.id)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      Elimină din grup
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div>
          {isAdmin && (
            <button
              onClick={() => setShowInviteModal(true)}
              style={{
                padding: '12px 24px',
                background: '#1f2937',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '20px',
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
              + Invită membru
            </button>
          )}

          <div style={{ display: 'grid', gap: '12px' }}>
            {group.members.map((member) => (
              <div
                key={member.id}
                style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                      {member.user.name || member.user.email}
                    </h3>
                    <span style={{ 
                      background: member.role === 'admin' ? '#dbeafe' : member.role === 'editor' ? '#dcfce7' : '#f3f4f6',
                      color: member.role === 'admin' ? '#1e40af' : member.role === 'editor' ? '#15803d' : '#374151',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {member.role === 'admin' ? 'Admin' : member.role === 'editor' ? 'Editor' : 'Viewer'}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                    {member.user.email}
                    {member.user.id === user?.id && (
                      <span style={{ marginLeft: '8px', color: '#059669', fontWeight: '500' }}>
                        (Tu)
                      </span>
                    )}
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>
                    Alăturat: {formatDateTime(member.joinedAt)}
                  </p>
                </div>

                {isAdmin && member.userId !== user.id && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      style={{
                        padding: '6px 12px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      Elimină
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showInviteModal && (
        <InviteMemberModal
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInviteMember}
        />
      )}

      {showAddNoteModal && (
        <AddNoteToGroupModal
          onClose={() => setShowAddNoteModal(false)}
          onAdd={handleAddNote}
          user={user}
        />
      )}
    </div>
  )
}

function InviteMemberModal({ onClose, onInvite }) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('viewer')

  const handleSubmit = (e) => {
    e.preventDefault()
    onInvite(email, role)
  }

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
        maxWidth: '500px',
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
              Invită membru
            </h2>
            <button
              onClick={onClose}
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
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="email@example.com"
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
              onFocus={(e) => e.target.style.borderColor = '#1f2937'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              Rol
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '15px',
                cursor: 'pointer',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            >
              <option value="viewer">Viewer (citește)</option>
              <option value="editor">Editor (editează)</option>
              <option value="admin">Admin (control complet)</option>
            </select>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
              Admin: control complet • Editor: adaugă notițe • Viewer: doar citire
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
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
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                background: '#1f2937',
                color: 'white',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(31, 41, 55, 0.3)'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#111827'
                e.target.style.transform = 'translateY(-1px)'
                e.target.style.boxShadow = '0 6px 16px rgba(31, 41, 55, 0.4)'
              }}
              onMouseOut={(e) => {
                e.target.style.background = '#1f2937'
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 12px rgba(31, 41, 55, 0.3)'
              }}
            >
              Invită
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddNoteToGroupModal({ onClose, onAdd, user }) {
  const [noteId, setNoteId] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onAdd(noteId)
  }

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
        maxWidth: '500px',
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
              Adaugă notița la grup
            </h2>
            <button
              onClick={onClose}
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
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              ID notița *
            </label>
            <input
              type="text"
              value={noteId}
              onChange={(e) => setNoteId(e.target.value)}
              required
              placeholder="Introdu ID-ul notiței"
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
              onFocus={(e) => e.target.style.borderColor = '#1f2937'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
              Găsești ID-ul notiței în URL-ul de distribuire
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
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
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                background: '#1f2937',
                color: 'white',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(31, 41, 55, 0.3)'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#111827'
                e.target.style.transform = 'translateY(-1px)'
                e.target.style.boxShadow = '0 6px 16px rgba(31, 41, 55, 0.4)'
              }}
              onMouseOut={(e) => {
                e.target.style.background = '#1f2937'
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 12px rgba(31, 41, 55, 0.3)'
              }}
            >
              Adaugă
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GroupDetailView