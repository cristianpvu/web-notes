import React, { useState, useEffect } from 'react'
import CreateGroupModal from './CreateGroupModal'
import CreateSubjectModal from './CreateSubjectModal'
import JoinGroupModal from './JoinGroupModal'
import GroupDetailModal from './GroupDetailModal'
import ManageTagsModal from './ManageTagsModal'
import EditSubjectModal from './EditSubjectModal'
import { useLanguage } from '../i18n/LanguageContext'

function Sidebar({ onFilterChange, activeFilter, onNavigateToGroups, onNavigateToSubjects }) {
  const { t, language, toggleLanguage } = useLanguage()
  const [groups, setGroups] = useState([])
  const [subjects, setSubjects] = useState([])
  const [isGroupsExpanded, setIsGroupsExpanded] = useState(true)
  const [isSubjectsExpanded, setIsSubjectsExpanded] = useState(true)
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [loadingSubjects, setLoadingSubjects] = useState(true)
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false)
  const [isCreateSubjectModalOpen, setIsCreateSubjectModalOpen] = useState(false)
  const [isJoinGroupModalOpen, setIsJoinGroupModalOpen] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState(null)
  const [isGroupDetailModalOpen, setIsGroupDetailModalOpen] = useState(false)
  const [isManageTagsModalOpen, setIsManageTagsModalOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [isEditSubjectModalOpen, setIsEditSubjectModalOpen] = useState(false)

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
      const allGroups = [
        ...(Array.isArray(data.created) ? data.created : []),
        ...(Array.isArray(data.member) ? data.member : [])
      ]
      // remove duplicates
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
        <span>{t('allNotes')}</span>
      </div>

      {/* language select */}
      <button
        onClick={toggleLanguage}
        style={{
          padding: '8px 12px',
          marginBottom: '8px',
          borderRadius: '6px',
          cursor: 'pointer',
          background: '#f3f4f6',
          color: '#374151',
          border: 'none',
          fontSize: '13px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          justifyContent: 'center',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#e5e7eb'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#f3f4f6'
        }}
      >
        🌐 {language === 'ro' ? 'EN' : 'RO'}
      </button>

      <div style={{ 
        height: '1px', 
        background: '#e5e7eb', 
        margin: '16px 0' 
      }} />

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
            <span>{t('groups')}</span>
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
                {t('loading')}
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
                      background: activeFilter?.type === 'group' && activeFilter?.id === group.id ? '#1f2937' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
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
                        setSelectedGroupId(group.id)
                        setIsGroupDetailModalOpen(true)
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px 6px',
                        color: activeFilter?.type === 'group' && activeFilter?.id === group.id ? 'white' : '#6b7280',
                        fontSize: '12px'
                      }}
                      title="Detalii grup"
                    >
                      ⋯
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
                    {t('noGroups')}
                  </div>
                )}

                <div
                  onClick={handleCreateGroup}
                  style={{
                    padding: '10px 16px',
                    marginTop: '8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: '#f3f4f6',
                    color: '#374151',
                    fontSize: '13px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e5e7eb'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f3f4f6'
                  }}
                >
                  <span>+</span>
                  <span>{t('createGroup')}</span>
                </div>

                <div
                  onClick={() => setIsJoinGroupModalOpen(true)}
                  style={{
                    padding: '10px 16px',
                    marginTop: '6px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: '#f3f4f6',
                    color: '#374151',
                    fontSize: '13px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e5e7eb'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f3f4f6'
                  }}
                >
                  <span>{t('joinGroup')}</span>
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
            <span>{t('subjects')}</span>
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
                {t('loading')}
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
                      background: activeFilter?.type === 'subject' && activeFilter?.id === subject.id ? '#1f2937' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
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
                          width: '10px', 
                          height: '10px', 
                          borderRadius: '50%', 
                          background: subject.color || '#6b7280' 
                        }} 
                      />
                      <span>{subject.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedSubject(subject)
                          setIsEditSubjectModalOpen(true)
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          color: activeFilter?.type === 'subject' && activeFilter?.id === subject.id ? 'white' : '#9ca3af',
                          fontSize: '12px'
                        }}
                        title="Editează materie"
                      >
                        ⋯
                      </button>
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
                          color: activeFilter?.type === 'subject' && activeFilter?.id === subject.id ? 'white' : '#9ca3af',
                          fontSize: '16px'
                        }}
                        title="Șterge materie"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}

                {subjects.length === 0 && (
                  <div style={{ 
                    padding: '8px 16px', 
                    fontSize: '13px', 
                    color: '#9ca3af',
                    fontStyle: 'italic'
                  }}>
                    {t('noSubjects')}
                  </div>
                )}

                <div
                  onClick={handleCreateSubject}
                  style={{
                    padding: '10px 16px',
                    marginTop: '8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: '#f3f4f6',
                    color: '#374151',
                    fontSize: '13px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e5e7eb'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f3f4f6'
                  }}
                >
                  <span>+</span>
                  <span>{t('createSubject')}</span>
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

      <div style={{ marginBottom: '16px' }}>
        <div
          onClick={() => setIsManageTagsModalOpen(true)}
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            background: 'transparent',
            color: '#374151',
            fontWeight: '500',
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f3f4f6'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <span>{t('manageTags')}</span>
        </div>
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

      <GroupDetailModal
        isOpen={isGroupDetailModalOpen}
        onClose={() => {
          setIsGroupDetailModalOpen(false)
          setSelectedGroupId(null)
        }}
        groupId={selectedGroupId}
        onGroupUpdated={(updatedGroup) => {
          setGroups(groups.map(g => g.id === updatedGroup.id ? { ...g, ...updatedGroup } : g))
        }}
        onGroupLeft={(leftGroupId) => {
          setGroups(groups.filter(g => g.id !== leftGroupId))
          if (activeFilter?.type === 'group' && activeFilter?.id === leftGroupId) {
            onFilterChange({ type: 'all' })
          }
        }}
      />

      <ManageTagsModal
        isOpen={isManageTagsModalOpen}
        onClose={() => setIsManageTagsModalOpen(false)}
        onTagsUpdated={() => {}}
      />

      <EditSubjectModal
        isOpen={isEditSubjectModalOpen}
        onClose={() => {
          setIsEditSubjectModalOpen(false)
          setSelectedSubject(null)
        }}
        subject={selectedSubject}
        onSubjectUpdated={(updatedSubject) => {
          setSubjects(subjects.map(s => s.id === updatedSubject.id ? updatedSubject : s))
        }}
      />
    </div>
  )
}

export default Sidebar
