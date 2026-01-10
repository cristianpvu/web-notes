import React, { useState, useEffect } from 'react'
import CreateGroupModal from './CreateGroupModal'
import CreateSubjectModal from './CreateSubjectModal'
import JoinGroupModal from './JoinGroupModal'

function Sidebar({ onFilterChange, activeFilter, onNavigateToGroups, onNavigateToSubjects }) {
  const [groups, setGroups] = useState([])
  const [subjects, setSubjects] = useState([])
  const [isGroupsExpanded, setIsGroupsExpanded] = useState(true)
  const [isSubjectsExpanded, setIsSubjectsExpanded] = useState(true)
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [loadingSubjects, setLoadingSubjects] = useState(true)
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false)
  const [isCreateSubjectModalOpen, setIsCreateSubjectModalOpen] = useState(false)
  const [isJoinGroupModalOpen, setIsJoinGroupModalOpen] = useState(false)

  useEffect(() => {
    loadGroups()
    loadSubjects()
  }, [])

  const loadGroups = async () => {
    try {
      setLoadingGroups(true)
      const response = await fetch('https://web-notes-nine.vercel.app/api/groups', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      // API returnează { created: [...], member: [...] }
      // Combinăm grupurile create de user cu cele unde e membru
      const allGroups = [
        ...(Array.isArray(data.created) ? data.created : []),
        ...(Array.isArray(data.member) ? data.member : [])
      ]
      // Eliminăm duplicatele (grupurile create apar și în member)
      const uniqueGroups = allGroups.filter((group, index, self) =>
        index === self.findIndex(g => g.id === group.id)
      )
      setGroups(uniqueGroups)
    } catch (error) {
      console.error('Eroare la încărcarea grupurilor:', error)
      setGroups([])
    } finally {
      setLoadingGroups(false)
    }
  }

  const loadSubjects = async () => {
    try {
      setLoadingSubjects(true)
      const response = await fetch('https://web-notes-nine.vercel.app/api/subjects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      setSubjects(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Eroare la încărcarea materiilor:', error)
      setSubjects([])
    } finally {
      setLoadingSubjects(false)
    }
  }

  const handleCreateGroup = () => {
    setIsCreateGroupModalOpen(true)
  }

  const handleCreateSubject = () => {
    setIsCreateSubjectModalOpen(true)
  }

  const handleGroupCreated = (newGroup) => {
    setGroups([...groups, newGroup])
  }

  const handleSubjectCreated = (newSubject) => {
    setSubjects([...subjects, newSubject])
  }

  const handleDeleteGroup = async (groupId, groupName) => {
    if (!window.confirm(`Sigur vrei să ștergi grupul "${groupName}"?`)) return

    try {
      const response = await fetch(`https://web-notes-nine.vercel.app/api/groups/${groupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) throw new Error('Eroare la ștergerea grupului')

      setGroups(groups.filter(g => g.id !== groupId))
      if (activeFilter?.type === 'group' && activeFilter?.id === groupId) {
        onFilterChange({ type: 'all' })
      }
    } catch (error) {
      alert('Eroare la ștergerea grupului: ' + error.message)
    }
  }

  const handleDeleteSubject = async (subjectId, subjectName) => {
    if (!window.confirm(`Sigur vrei să ștergi materia "${subjectName}"?`)) return

    try {
      const response = await fetch(`https://web-notes-nine.vercel.app/api/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) throw new Error('Eroare la ștergerea materiei')

      setSubjects(subjects.filter(s => s.id !== subjectId))
      if (activeFilter?.type === 'subject' && activeFilter?.id === subjectId) {
        onFilterChange({ type: 'all' })
      }
    } catch (error) {
      alert('Eroare la ștergerea materiei: ' + error.message)
    }
  }

  return (
    <div style={{
      width: '280px',
      background: '#f9fafb',
      borderRight: '1px solid #e5e7eb',
      padding: '20px',
      overflowY: 'auto',
      height: '100%'
    }}>
      {/* Toate notițele - Landing page */}
      <div
        onClick={() => onFilterChange({ type: 'all' })}
        style={{
          padding: '12px 16px',
          marginBottom: '8px',
          borderRadius: '8px',
          cursor: 'pointer',
          background: activeFilter?.type === 'all' ? '#3b82f6' : 'transparent',
          color: activeFilter?.type === 'all' ? 'white' : '#374151',
          fontWeight: activeFilter?.type === 'all' ? '600' : '500',
          fontSize: '15px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          if (activeFilter?.type !== 'all') {
            e.currentTarget.style.background = '#f3f4f6'
          }
        }}
        onMouseLeave={(e) => {
          if (activeFilter?.type !== 'all') {
            e.currentTarget.style.background = 'transparent'
          }
        }}
      >
        <span>📝</span>
        <span>Toate notițele</span>
      </div>

      <div style={{ 
        height: '1px', 
        background: '#e5e7eb', 
        margin: '16px 0' 
      }} />

      {/* Grupuri de Studiu */}
      <div style={{ marginBottom: '16px' }}>
        <div
          onClick={() => setIsGroupsExpanded(!isGroupsExpanded)}
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            background: 'transparent',
            color: '#111827',
            fontWeight: '600',
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f3f4f6'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>👥</span>
            <span>Grupuri de Studiu</span>
          </div>
          <span style={{
            transition: 'transform 0.2s',
            transform: isGroupsExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
          }}>
            ▶
          </span>
        </div>

        {isGroupsExpanded && (
          <div style={{ marginTop: '8px', paddingLeft: '16px' }}>
            {loadingGroups ? (
              <div style={{ 
                padding: '8px 16px', 
                fontSize: '13px', 
                color: '#6b7280' 
              }}>
                Se încarcă...
              </div>
            ) : (
              <>
                {groups.map((group) => (
                  <div
                    key={group.id}
                    style={{
                      padding: '10px 16px',
                      marginBottom: '4px',
                      borderRadius: '6px',
                      background: activeFilter?.type === 'group' && activeFilter?.id === group.id ? '#8b5cf6' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div
                      onClick={() => onFilterChange({ type: 'group', id: group.id, name: group.name })}
                      style={{
                        flex: 1,
                        cursor: 'pointer',
                        color: activeFilter?.type === 'group' && activeFilter?.id === group.id ? 'white' : '#4b5563',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span style={{ fontSize: '12px' }}>•</span>
                      <span>{group.name}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteGroup(group.id, group.name)
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: activeFilter?.type === 'group' && activeFilter?.id === group.id ? 'white' : '#ef4444',
                        fontSize: '16px',
                        opacity: 0.7,
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                      title="Șterge grup"
                    >
                      ×
                    </button>
                  </div>
                ))}

                {groups.length === 0 && (
                  <div style={{ 
                    padding: '8px 16px', 
                    fontSize: '13px', 
                    color: '#9ca3af',
                    fontStyle: 'italic'
                  }}>
                    Nu faci parte din niciun grup
                  </div>
                )}

                <div
                  onClick={handleCreateGroup}
                  style={{
                    padding: '10px 16px',
                    marginTop: '8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: '#ede9fe',
                    color: '#7c3aed',
                    fontSize: '13px',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ddd6fe'
                    e.currentTarget.style.transform = 'translateX(2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ede9fe'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  <span>+</span>
                  <span>Creează grup</span>
                </div>

                <div
                  onClick={() => setIsJoinGroupModalOpen(true)}
                  style={{
                    padding: '10px 16px',
                    marginTop: '6px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: '#fef3c7',
                    color: '#92400e',
                    fontSize: '13px',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fde68a'
                    e.currentTarget.style.transform = 'translateX(2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fef3c7'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  <span>🔗</span>
                  <span>Alătură-te unui grup</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div style={{ 
        height: '1px', 
        background: '#e5e7eb', 
        margin: '16px 0' 
      }} />

      {/* Materii */}
      <div style={{ marginBottom: '16px' }}>
        <div
          onClick={() => setIsSubjectsExpanded(!isSubjectsExpanded)}
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            background: 'transparent',
            color: '#111827',
            fontWeight: '600',
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f3f4f6'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>📚</span>
            <span>Materii</span>
          </div>
          <span style={{
            transition: 'transform 0.2s',
            transform: isSubjectsExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
          }}>
            ▶
          </span>
        </div>

        {isSubjectsExpanded && (
          <div style={{ marginTop: '8px', paddingLeft: '16px' }}>
            {loadingSubjects ? (
              <div style={{ 
                padding: '8px 16px', 
                fontSize: '13px', 
                color: '#6b7280' 
              }}>
                Se încarcă...
              </div>
            ) : (
              <>
                {subjects.map((subject) => (
                  <div
                    key={subject.id}
                    style={{
                      padding: '10px 16px',
                      marginBottom: '4px',
                      borderRadius: '6px',
                      background: activeFilter?.type === 'subject' && activeFilter?.id === subject.id ? '#10b981' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div
                      onClick={() => onFilterChange({ type: 'subject', id: subject.id, name: subject.name })}
                      style={{
                        flex: 1,
                        cursor: 'pointer',
                        color: activeFilter?.type === 'subject' && activeFilter?.id === subject.id ? 'white' : '#4b5563',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span 
                        style={{ 
                          width: '12px', 
                          height: '12px', 
                          borderRadius: '50%', 
                          background: subject.color || '#6b7280' 
                        }} 
                      />
                      <span>{subject.name}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteSubject(subject.id, subject.name)
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: activeFilter?.type === 'subject' && activeFilter?.id === subject.id ? 'white' : '#ef4444',
                        fontSize: '16px',
                        opacity: 0.7,
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                      title="Șterge materie"
                    >
                      ×
                    </button>
                  </div>
                ))}

                {subjects.length === 0 && (
                  <div style={{ 
                    padding: '8px 16px', 
                    fontSize: '13px', 
                    color: '#9ca3af',
                    fontStyle: 'italic'
                  }}>
                    Nu ai nicio materie
                  </div>
                )}

                <div
                  onClick={handleCreateSubject}
                  style={{
                    padding: '10px 16px',
                    marginTop: '8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: '#d1fae5',
                    color: '#047857',
                    fontSize: '13px',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#a7f3d0'
                    e.currentTarget.style.transform = 'translateX(2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#d1fae5'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  <span>+</span>
                  <span>Creează materie</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onGroupCreated={handleGroupCreated}
      />

      <CreateSubjectModal
        isOpen={isCreateSubjectModalOpen}
        onClose={() => setIsCreateSubjectModalOpen(false)}
        onSubjectCreated={handleSubjectCreated}
      />

      <JoinGroupModal
        isOpen={isJoinGroupModalOpen}
        onClose={() => setIsJoinGroupModalOpen(false)}
        onGroupJoined={handleGroupCreated}
      />
    </div>
  )
}

export default Sidebar
