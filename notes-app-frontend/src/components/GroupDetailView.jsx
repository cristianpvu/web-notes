import React, { useState, useEffect } from 'react'
import { getGroupById, inviteMember, removeMember, updateMemberPermissions, addNoteToGroup, removeNoteFromGroup } from '../services/api'
import { formatDateTime } from '../lib/utils'

function GroupDetailView({ groupId, user, onBack }) {
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showAddNoteModal, setShowAddNoteModal] = useState(false)
  const [activeTab, setActiveTab] = useState('notes') // 'notes' | 'members'

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
      alert('✓ Membru invitat cu succes!')
    } catch (err) {
      alert(err.response?.data?.error || 'Eroare la invitarea membrului')
    }
  }

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Sigur vrei să elimini acest membru?')) return
    try {
      await removeMember(groupId, memberId)
      loadGroup()
      alert('✓ Membru eliminat')
    } catch (err) {
      alert('Eroare la eliminarea membrului')
    }
  }

  const handleUpdateRole = async (memberId, role) => {
    try {
      await updateMemberPermissions(groupId, memberId, role, 'read')
      loadGroup()
      alert('✓ Rol actualizat')
    } catch (err) {
      alert('Eroare la actualizarea rolului')
    }
  }

  const handleAddNote = async (noteId) => {
    try {
      await addNoteToGroup(groupId, noteId)
      loadGroup()
      setShowAddNoteModal(false)
      alert('✓ Notița adăugată la grup!')
    } catch (err) {
      alert(err.response?.data?.error || 'Eroare la adăugarea notiței')
    }
  }

  const handleRemoveNote = async (noteId) => {
    if (!confirm('Sigur vrei să elimini această notița din grup?')) return
    try {
      await removeNoteFromGroup(groupId, noteId)
      loadGroup()
      alert('✓ Notița eliminată din grup')
    } catch (err) {
      alert('Eroare la eliminarea notiței')
    }
  }

  const copyGroupId = () => {
    navigator.clipboard.writeText(groupId).then(() => {
      alert('✓ ID-ul grupului a fost copiat în clipboard!')
    })
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>Se încarcă...</div>

  if (!group) return null

  const isCreator = group.isCreator
  const isAdmin = group.myMembership?.role === 'admin' || isCreator
  const canEdit = (group.myMembership?.role === 'admin' || group.myMembership?.role === 'editor') || isCreator

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <button
          onClick={onBack}
          style={{
            padding: '8px 16px',
            background: '#f3f4f6',
            color: '#374151',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            marginBottom: '16px'
          }}
        >
          ← Înapoi la grupuri
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h1 style={{ margin: 0, fontSize: '28px' }}>{group.name}</h1>
              {group.isPrivate && (
                <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 12px', borderRadius: '6px', fontSize: '14px' }}>
                  🔒 Privat
                </span>
              )}
              {isCreator && (
                <span style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 12px', borderRadius: '6px', fontSize: '14px' }}>
                  👑 Creator
                </span>
              )}
            </div>
            {group.description && (
              <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: '16px' }}>
                {group.description}
              </p>
            )}
            <div style={{ marginTop: '12px', display: 'flex', gap: '20px', fontSize: '14px', color: '#6b7280' }}>
              <span>👥 {group.members.length} membri</span>
              <span>📝 {group.notes.length} notițe</span>
              <button
                onClick={copyGroupId}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '14px',
                  padding: 0
                }}
              >
                📋 Copiază ID grup
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Taburi */}
      <div style={{ 
        marginBottom: '20px',
        display: 'flex',
        gap: '8px',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <button
          onClick={() => setActiveTab('notes')}
          style={{
            padding: '12px 24px',
            background: activeTab === 'notes' ? '#3b82f6' : 'transparent',
            color: activeTab === 'notes' ? 'white' : '#374151',
            border: 'none',
            borderBottom: activeTab === 'notes' ? '3px solid #3b82f6' : '3px solid transparent',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            marginBottom: '-2px'
          }}
        >
          📝 Notițe ({group.notes.length})
        </button>
        <button
          onClick={() => setActiveTab('members')}
          style={{
            padding: '12px 24px',
            background: activeTab === 'members' ? '#8b5cf6' : 'transparent',
            color: activeTab === 'members' ? 'white' : '#374151',
            border: 'none',
            borderBottom: activeTab === 'members' ? '3px solid #8b5cf6' : '3px solid transparent',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            marginBottom: '-2px'
          }}
        >
          👥 Membri ({group.members.length})
        </button>
      </div>

      {/* Tab Notițe */}
      {activeTab === 'notes' && (
        <div>
          {canEdit && (
            <button
              onClick={() => setShowAddNoteModal(true)}
              style={{
                padding: '12px 24px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                marginBottom: '20px'
              }}
            >
              ➕ Adaugă Notița
            </button>
          )}

          {group.notes.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              background: '#f9fafb',
              borderRadius: '8px'
            }}>
              <p style={{ fontSize: '18px', color: '#6b7280' }}>
                Nu există notițe în acest grup încă.
              </p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gap: '16px',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
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
                        background: note.subject.color || '#3b82f6',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        {note.subject.name}
                      </span>
                    )}
                    {note.user && (
                      <span>👤 {note.user.name || note.user.email}</span>
                    )}
                  </div>

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
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      🗑️ Elimină din grup
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Membri */}
      {activeTab === 'members' && (
        <div>
          {isAdmin && (
            <button
              onClick={() => setShowInviteModal(true)}
              style={{
                padding: '12px 24px',
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                marginBottom: '20px'
              }}
            >
              ➕ Invită Membru
            </button>
          )}

          <div style={{ display: 'grid', gap: '16px' }}>
            {group.members.map((member) => (
              <div
                key={member.id}
                style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                      {member.user.name || member.user.email}
                    </h3>
                    <span style={{ 
                      background: member.role === 'admin' ? '#dbeafe' : member.role === 'editor' ? '#dcfce7' : '#f3f4f6',
                      color: member.role === 'admin' ? '#1e40af' : member.role === 'editor' ? '#15803d' : '#374151',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {member.role === 'admin' ? '⭐ Admin' : member.role === 'editor' ? '✏️ Editor' : '👁️ Viewer'}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                    Alăturat: {formatDateTime(member.joinedAt)}
                  </p>
                </div>

                {isAdmin && member.userId !== user.id && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px',
                        cursor: 'pointer'
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
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Invite Member */}
      {showInviteModal && (
        <InviteMemberModal
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInviteMember}
        />
      )}

      {/* Modal Add Note */}
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
        maxWidth: '500px'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>Invită Membru</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
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
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Rol
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="viewer">Viewer (citește)</option>
              <option value="editor">Editor (editează)</option>
              <option value="admin">Admin (control complet)</option>
            </select>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
              💡 <strong>Admin:</strong> control complet • <strong>Editor:</strong> adaugă notițe • <strong>Viewer:</strong> doar citire
            </p>
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
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
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
        maxWidth: '500px'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>Adaugă Notița la Grup</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              ID Notița *
            </label>
            <input
              type="text"
              value={noteId}
              onChange={(e) => setNoteId(e.target.value)}
              required
              placeholder="Introdu ID-ul notiței"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
              💡 Găsești ID-ul notiței în URL-ul de distribuire
            </p>
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
              Adaugă
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GroupDetailView
