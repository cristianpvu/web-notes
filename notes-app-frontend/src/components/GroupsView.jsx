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
      alert('Grup creat cu succes')
    } catch (err) {
      alert(err.response?.data?.error || 'Eroare la crearea grupului')
    }
  }

  const handleJoinGroup = async (groupId, password) => {
    try {
      await joinGroup(groupId, password)
      loadGroups()
      setShowJoinModal(false)
      alert('Te-ai alăturat grupului')
    } catch (err) {
      alert(err.response?.data?.error || 'Eroare la alăturarea la grup')
    }
  }

  const handleLeaveGroup = async (groupId) => {
    if (!confirm('Sigur vrei să părăsești acest grup?')) return
    try {
      await leaveGroup(groupId)
      loadGroups()
      alert('Ai părăsit grupul')
    } catch (err) {
      alert('Eroare la părăsirea grupului')
    }
  }

  const handleDeleteGroup = async (groupId) => {
    if (!confirm('Sigur vrei să ștergi acest grup? Toți membrii vor fi eliminați.')) return
    try {
      await deleteGroup(groupId)
      loadGroups()
      alert('Grup șters')
    } catch (err) {
      alert('Eroare la ștergerea grupului')
    }
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>Se încarcă...</div>

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '12px 24px',
            background: '#1f2937',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
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
          + Creează grup
        </button>
        <button
          onClick={() => setShowJoinModal(true)}
          style={{
            padding: '12px 24px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)'
            e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.6)'
            e.target.style.background = '#059669'
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)'
            e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)'
            e.target.style.background = '#10b981'
          }}
        >
          Alătură-te la grup
        </button>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px', color: '#111827' }}>
          Grupurile mele ({groups.created.length})
        </h2>
        {groups.created.length === 0 ? (
          <div style={{ 
            padding: '60px 20px', 
            textAlign: 'center', 
            background: 'white', 
            borderRadius: '12px',
            border: '2px dashed #e5e7eb'
          }}>
            <p style={{ fontSize: '18px', color: '#6b7280', margin: 0 }}>
              Nu ai creat încă niciun grup de studiu
            </p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '16px' 
          }}>
            {groups.created.map(group => (
              <div 
                key={group.id} 
                style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onClick={() => window.location.hash = `/group/${group.id}`}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                    {group.name}
                  </h3>
                  {group.isPrivate && (
                    <span style={{ 
                      background: '#fef3c7', 
                      color: '#92400e', 
                      padding: '3px 8px', 
                      borderRadius: '4px', 
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      Privat
                    </span>
                  )}
                </div>
                {group.description && (
                  <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>
                    {group.description}
                  </p>
                )}
                <div style={{ 
                  display: 'flex', 
                  gap: '16px', 
                  fontSize: '13px', 
                  color: '#6b7280', 
                  marginBottom: '16px',
                  paddingTop: '12px',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <span>{group._count.members} membri</span>
                  <span>{group._count.notes} notițe</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      window.location.hash = `/group/${group.id}`
                    }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: '#1f2937',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Deschide
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteGroup(group.id)
                    }}
                    style={{
                      padding: '8px 12px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Șterge
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px', color: '#111827' }}>
          Grupuri la care particip ({groups.member.length})
        </h2>
        {groups.member.length === 0 ? (
          <div style={{ 
            padding: '60px 20px', 
            textAlign: 'center', 
            background: 'white', 
            borderRadius: '12px',
            border: '2px dashed #e5e7eb'
          }}>
            <p style={{ fontSize: '18px', color: '#6b7280', margin: 0 }}>
              Nu faci parte din niciun grup de studiu
            </p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '16px' 
          }}>
            {groups.member.map(group => (
              <div 
                key={group.id} 
                style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onClick={() => window.location.hash = `/group/${group.id}`}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                    {group.name}
                  </h3>
                  <span style={{ 
                    background: group.myRole === 'admin' ? '#dbeafe' : group.myRole === 'editor' ? '#dcfce7' : '#f3f4f6', 
                    color: group.myRole === 'admin' ? '#1e40af' : group.myRole === 'editor' ? '#15803d' : '#374151', 
                    padding: '3px 8px', 
                    borderRadius: '4px', 
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {group.myRole === 'admin' ? 'Admin' : group.myRole === 'editor' ? 'Editor' : 'Viewer'}
                  </span>
                </div>
                {group.description && (
                  <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>
                    {group.description}
                  </p>
                )}
                <div style={{ 
                  display: 'flex', 
                  gap: '16px', 
                  fontSize: '13px', 
                  color: '#6b7280', 
                  marginBottom: '16px',
                  paddingTop: '12px',
                  borderTop: '1px solid #e5e7eb'
                }}>
                  <span>{group._count.members} membri</span>
                  <span>{group._count.notes} notițe</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      window.location.hash = `/group/${group.id}`
                    }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      background: '#1f2937',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Deschide
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleLeaveGroup(group.id)
                    }}
                    style={{
                      padding: '8px 12px',
                      background: '#fef3c7',
                      color: '#92400e',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
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

      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateGroup}
        />
      )}

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
              Creează grup de studiu
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
              Nume grup *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              placeholder="Ex: Grupa 1234 - An 2"
              onFocus={(e) => e.target.style.borderColor = '#1f2937'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              Descriere
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
              placeholder="Scurtă descriere a grupului..."
              onFocus={(e) => e.target.style.borderColor = '#1f2937'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          <div style={{ marginBottom: '20px', padding: '16px', background: '#f9fafb', border: '2px solid #e5e7eb', borderRadius: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.isPrivate}
                onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                style={{ marginRight: '12px', marginTop: '3px', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', color: '#374151' }}>
                  Grup privat (necesită parolă)
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                  Membrii vor avea nevoie de parolă pentru a se alătura
                </div>
              </div>
            </label>
          </div>
          {formData.isPrivate && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                Parolă *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={formData.isPrivate}
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
          )}
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
              Creează grup
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
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          padding: '24px',
          borderRadius: '12px 12px 0 0',
          borderBottom: '3px solid #047857'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, color: 'white', fontSize: '24px', fontWeight: '600' }}>
              Alătură-te la grup
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '20px',
                fontWeight: 'bold',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
              onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              ID grup *
            </label>
            <input
              type="text"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              required
              placeholder="Introdu ID-ul grupului"
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
              onFocus={(e) => e.target.style.borderColor = '#10b981'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              Parolă (dacă este privat)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Lasă gol dacă grupul e public"
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
              onFocus={(e) => e.target.style.borderColor = '#10b981'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
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
                background: '#10b981',
                color: 'white',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#059669'
                e.target.style.transform = 'translateY(-1px)'
                e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)'
              }}
              onMouseOut={(e) => {
                e.target.style.background = '#10b981'
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'
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