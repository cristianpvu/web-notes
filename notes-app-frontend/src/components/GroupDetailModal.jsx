import React, { useState, useEffect } from 'react'

function GroupDetailModal({ isOpen, onClose, groupId, onGroupUpdated, onGroupLeft }) {
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isOpen && groupId) {
      loadGroup()
    }
  }, [isOpen, groupId])

  const loadGroup = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch(`https://web-notes-nine.vercel.app/api/groups/${groupId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setGroup(data)
      setEditName(data.name)
      setEditDescription(data.description || '')
    } catch (err) {
      setError(err.message || 'Eroare la încărcarea grupului')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      setError('Numele grupului este obligatoriu')
      return
    }
    try {
      setSaving(true)
      const response = await fetch(`https://web-notes-nine.vercel.app/api/groups/${groupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: editName,
          description: editDescription || null
        })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setGroup({ ...group, name: editName, description: editDescription })
      setIsEditing(false)
      if (onGroupUpdated) onGroupUpdated({ ...group, name: editName, description: editDescription })
    } catch (err) {
      setError(err.message || 'Eroare la salvare')
    } finally {
      setSaving(false)
    }
  }

  const handleLeaveGroup = async () => {
    if (!window.confirm('Sigur vrei să părăsești acest grup?')) return
    try {
      const response = await fetch(`https://web-notes-nine.vercel.app/api/groups/${groupId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      if (onGroupLeft) onGroupLeft(groupId)
      onClose()
    } catch (err) {
      setError(err.message || 'Eroare la părăsirea grupului')
    }
  }

  const handleInviteMember = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    try {
      setInviting(true)
      const response = await fetch(`https://web-notes-nine.vercel.app/api/groups/${groupId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: 'member',
          permission: 'read'
        })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setInviteEmail('')
      loadGroup()
    } catch (err) {
      setError(err.message || 'Eroare la invitare')
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Sigur vrei să elimini pe ${memberName} din grup?`)) return
    try {
      const response = await fetch(`https://web-notes-nine.vercel.app/api/groups/${groupId}/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error)
      }
      loadGroup()
    } catch (err) {
      setError(err.message || 'Eroare la eliminarea membrului')
    }
  }

  const handleUpdatePermission = async (memberId, newPermission) => {
    try {
      const response = await fetch(`https://web-notes-nine.vercel.app/api/groups/${groupId}/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          permission: newPermission
        })
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error)
      }
      loadGroup()
    } catch (err) {
      setError(err.message || 'Eroare la actualizarea permisiunilor')
    }
  }

  const copyGroupId = () => {
    navigator.clipboard.writeText(groupId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '85vh',
        overflow: 'auto',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'white',
          zIndex: 10
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
            Detalii grup
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              Se încarcă...
            </div>
          ) : error && !group ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#dc2626' }}>
              {error}
            </div>
          ) : group && (
            <>
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

              <div style={{ marginBottom: '24px' }}>
                {isEditing ? (
                  <div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        Nume grup
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        Descriere
                      </label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={2}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={handleSaveEdit}
                        disabled={saving}
                        style={{
                          padding: '8px 16px',
                          background: '#1f2937',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: saving ? 'not-allowed' : 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        {saving ? 'Se salvează...' : 'Salvează'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false)
                          setEditName(group.name)
                          setEditDescription(group.description || '')
                        }}
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
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: '600', color: '#111827' }}>
                          {group.name}
                        </h3>
                        <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                          {group.description || 'Fără descriere'}
                        </p>
                      </div>
                      {group.isCreator && (
                        <button
                          onClick={() => setIsEditing(true)}
                          style={{
                            padding: '6px 12px',
                            background: '#f3f4f6',
                            color: '#374151',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          Editează
                        </button>
                      )}
                    </div>
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '4px 10px',
                        background: group.isPrivate ? '#fef3c7' : '#d1fae5',
                        color: group.isPrivate ? '#92400e' : '#065f46',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {group.isPrivate ? 'Privat' : 'Public'}
                      </span>
                      <span style={{
                        padding: '4px 10px',
                        background: '#f3f4f6',
                        color: '#374151',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {group.members?.length || 0} membri
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div style={{
                padding: '12px 16px',
                background: '#f9fafb',
                borderRadius: '6px',
                marginBottom: '24px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
                  ID Grup (pentru invitații)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <code style={{
                    flex: 1,
                    padding: '8px 10px',
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {groupId}
                  </code>
                  <button
                    onClick={copyGroupId}
                    style={{
                      padding: '8px 12px',
                      background: copied ? '#10b981' : '#1f2937',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {copied ? 'Copiat!' : 'Copiază'}
                  </button>
                </div>
              </div>

              {group.isCreator && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                    Invită membru
                  </h4>
                  <form onSubmit={handleInviteMember} style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Email utilizator"
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                    <button
                      type="submit"
                      disabled={inviting}
                      style={{
                        padding: '10px 16px',
                        background: '#1f2937',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: inviting ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      {inviting ? '...' : 'Invită'}
                    </button>
                  </form>
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Membri ({group.members?.length || 0})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {group.members?.map((member) => (
                    <div
                      key={member.id}
                      style={{
                        padding: '12px',
                        background: '#f9fafb',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                          {member.user?.name || member.user?.email}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {member.user?.email}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          padding: '2px 8px',
                          background: member.role === 'admin' ? '#dbeafe' : '#f3f4f6',
                          color: member.role === 'admin' ? '#1d4ed8' : '#374151',
                          borderRadius: '4px',
                          fontSize: '11px'
                        }}>
                          {member.role === 'admin' ? 'Admin' : 'Membru'}
                        </span>
                        {group.isCreator && member.userId !== group.createdBy && (
                          <>
                            <select
                              value={member.permission}
                              onChange={(e) => handleUpdatePermission(member.id, e.target.value)}
                              style={{
                                padding: '4px 8px',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                fontSize: '12px',
                                background: 'white'
                              }}
                            >
                              <option value="read">Citire</option>
                              <option value="edit">Editare</option>
                            </select>
                            <button
                              onClick={() => handleRemoveMember(member.id, member.user?.name || member.user?.email)}
                              style={{
                                padding: '4px 8px',
                                background: '#fee2e2',
                                color: '#dc2626',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              Elimină
                            </button>
                          </>
                        )}
                        {member.userId === group.createdBy && (
                          <span style={{
                            padding: '2px 8px',
                            background: '#fef3c7',
                            color: '#92400e',
                            borderRadius: '4px',
                            fontSize: '11px'
                          }}>
                            Creator
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {!group.isCreator && (
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                  <button
                    onClick={handleLeaveGroup}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Părăsește grupul
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default GroupDetailModal
