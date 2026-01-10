import React, { useState, useEffect } from 'react'
import { getGroups, createGroup, joinGroup, deleteGroup, leaveGroup } from '../services/api'

function GroupsView({ user }) {
  const [groups, setGroups] = useState({ created: [], member: [] })
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    try {
      setLoading(true)
      const data = await getGroups()
      setGroups(data)
    } catch (err) {
      console.error('Eroare la încărcarea grupurilor:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = async (groupData) => {
    try {
      await createGroup(groupData)
      loadGroups()
      setShowCreateModal(false)
      alert('✓ Grup creat cu succes!')
    } catch (err) {
      alert(err.response?.data?.error || 'Eroare la crearea grupului')
    }
  }

  const handleJoinGroup = async (groupId, password) => {
    try {
      await joinGroup(groupId, password)
      loadGroups()
      setShowJoinModal(false)
      alert('✓ Te-ai alăturat grupului!')
    } catch (err) {
      alert(err.response?.data?.error || 'Eroare la alăturarea la grup')
    }
  }

  const handleLeaveGroup = async (groupId) => {
    if (!confirm('Sigur vrei să părăsești acest grup?')) return
    try {
      await leaveGroup(groupId)
      loadGroups()
      alert('✓ Ai părăsit grupul')
    } catch (err) {
      alert('Eroare la părăsirea grupului')
    }
  }

  const handleDeleteGroup = async (groupId) => {
    if (!confirm('Sigur vrei să ștergi acest grup? Toți membrii vor fi eliminați.')) return
    try {
      await deleteGroup(groupId)
      loadGroups()
      alert('✓ Grup șters')
    } catch (err) {
      alert('Eroare la ștergerea grupului')
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>Se încarcă...</div>

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '12px 24px',
            background: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          ➕ Creează Grup
        </button>
        <button
          onClick={() => setShowJoinModal(true)}
          style={{
            padding: '12px 24px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          🔗 Alătură-te la Grup
        </button>
      </div>

      {/* Grupurile create de mine */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '16px', color: '#374151' }}>
          📚 Grupurile Mele ({groups.created.length})
        </h2>
        {groups.created.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', background: '#f9fafb', borderRadius: '8px', color: '#6b7280' }}>
            Nu ai creat încă niciun grup de studiu
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {groups.created.map(group => (
              <div key={group.id} style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                    {group.name}
                  </h3>
                  {group.isPrivate && (
                    <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                      🔒 Privat
                    </span>
                  )}
                </div>
                {group.description && (
                  <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#6b7280' }}>
                    {group.description}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                  <span>👥 {group._count.members} membri</span>
                  <span>📝 {group._count.notes} notițe</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => window.open(`#/group/${group.id}`, '_self')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Deschide
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    style={{
                      padding: '8px 12px',
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grupurile la care sunt membru */}
      <div>
        <h2 style={{ fontSize: '20px', marginBottom: '16px', color: '#374151' }}>
          🤝 Grupuri la care particip ({groups.member.length})
        </h2>
        {groups.member.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', background: '#f9fafb', borderRadius: '8px', color: '#6b7280' }}>
            Nu faci parte din niciun grup de studiu
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {groups.member.map(group => (
              <div key={group.id} style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                    {group.name}
                  </h3>
                  <span style={{ 
                    background: group.myRole === 'admin' ? '#dbeafe' : '#f3f4f6', 
                    color: group.myRole === 'admin' ? '#1e40af' : '#374151', 
                    padding: '2px 8px', 
                    borderRadius: '4px', 
                    fontSize: '12px' 
                  }}>
                    {group.myRole === 'admin' ? '⭐ Admin' : '👤 Membru'}
                  </span>
                </div>
                {group.description && (
                  <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#6b7280' }}>
                    {group.description}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                  <span>👥 {group._count.members} membri</span>
                  <span>📝 {group._count.notes} notițe</span>
                  <span>{group.myPermission === 'edit' ? '✏️ Edit' : '👁️ Read'}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => window.open(`#/group/${group.id}`, '_self')}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Deschide
                  </button>
                  <button
                    onClick={() => handleLeaveGroup(group.id)}
                    style={{
                      padding: '8px 12px',
                      background: '#fef3c7',
                      color: '#92400e',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Părăsește
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal creare grup */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateGroup}
        />
      )}

      {/* Modal alăturare la grup */}
      {showJoinModal && (
        <JoinGroupModal
          onClose={() => setShowJoinModal(false)}
          onJoin={handleJoinGroup}
        />
      )}
    </div>
  )
}

function CreateGroupModal({ onClose, onCreate }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false,
    password: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onCreate(formData)
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
        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>Creează Grup de Studiu</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              Nume Grup *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
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
              Descriere
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
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
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.isPrivate}
                onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                style={{ marginRight: '8px' }}
              />
              <span style={{ fontSize: '14px' }}>🔒 Grup privat (necesită parolă)</span>
            </label>
          </div>
          {formData.isPrivate && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Parolă
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={formData.isPrivate}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
          )}
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
              Creează Grup
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function JoinGroupModal({ onClose, onJoin }) {
  const [groupId, setGroupId] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onJoin(groupId, password)
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
        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>Alătură-te la Grup</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
              ID Grup *
            </label>
            <input
              type="text"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              required
              placeholder="Introdu ID-ul grupului"
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
              Parolă (dacă este privat)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Lasă gol dacă grupul e public"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
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
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Alătură-te
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GroupsView
