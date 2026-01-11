import axios from 'axios'

const API_URL = 'https://web-notes-nine.vercel.app/api'


const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})


api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})


export const sendMagicLink = async (email) => {
  const response = await api.post('/auth/login', { email })
  return response.data
}


export const verifyToken = async (accessToken) => {
  const response = await api.post('/auth/verify', { access_token: accessToken })
  return response.data
}

export const getNotes = async (filters = {}) => {
  const response = await api.get('/notes', { params: filters })
  return response.data
}


export const getNoteById = async (id) => {
  const response = await api.get(`/notes/${id}`)
  return response.data
}

export const getPublicNoteById = async (id) => {
  const response = await axios.get(`${API_URL}/notes/public/${id}`)
  return response.data
}


export const createNote = async (noteData) => {
  const response = await api.post('/notes', noteData)
  return response.data
}


export const updateNote = async (id, noteData) => {
  const response = await api.put(`/notes/${id}`, noteData)
  return response.data
}


export const deleteNote = async (id) => {
  const response = await api.delete(`/notes/${id}`)
  return response.data
}

export const getSubjects = async () => {
  const response = await api.get('/subjects')
  return response.data
}

export const getSubjectById = async (id) => {
  const response = await api.get(`/subjects/${id}`)
  return response.data
}

export const createSubject = async (subjectData) => {
  const response = await api.post('/subjects', subjectData)
  return response.data
}

export const updateSubject = async (id, subjectData) => {
  const response = await api.put(`/subjects/${id}`, subjectData)
  return response.data
}

export const deleteSubject = async (id) => {
  const response = await api.delete(`/subjects/${id}`)
  return response.data
}

export const getTags = async () => {
  const response = await api.get('/tags')
  return response.data
}


export const createTag = async (tagData) => {
  const response = await api.post('/tags', tagData)
  return response.data
}

export const shareNoteWithUser = async (noteId, email, permission = 'read') => {
  const response = await api.post(`/notes/${noteId}/share`, { email, permission })
  return response.data
}

export const getSharedNotes = async () => {
  const response = await api.get('/notes/shared')
  return response.data
}

export const uploadAttachment = async (noteId, file) => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await api.post(`/attachments/notes/${noteId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

export const getNoteAttachments = async (noteId) => {
  const response = await api.get(`/attachments/notes/${noteId}`)
  return response.data
}

export const deleteAttachment = async (attachmentId) => {
  const response = await api.delete(`/attachments/${attachmentId}`)
  return response.data
}

// groups
export const getGroups = async () => {
  const response = await api.get('/groups')
  return response.data
}

export const getGroupById = async (groupId) => {
  const response = await api.get(`/groups/${groupId}`)
  return response.data
}

export const createGroup = async (groupData) => {
  const response = await api.post('/groups', groupData)
  return response.data
}

export const updateGroup = async (groupId, groupData) => {
  const response = await api.put(`/groups/${groupId}`, groupData)
  return response.data
}

export const deleteGroup = async (groupId) => {
  const response = await api.delete(`/groups/${groupId}`)
  return response.data
}

export const joinGroup = async (groupId, password) => {
  const response = await api.post(`/groups/${groupId}/join`, { password })
  return response.data
}

export const leaveGroup = async (groupId) => {
  const response = await api.post(`/groups/${groupId}/leave`)
  return response.data
}

export const inviteMember = async (groupId, email, role = 'member', permission = 'read') => {
  const response = await api.post(`/groups/${groupId}/invite`, { email, role, permission })
  return response.data
}

export const removeMember = async (groupId, memberId) => {
  const response = await api.delete(`/groups/${groupId}/members/${memberId}`)
  return response.data
}

export const updateMemberPermissions = async (groupId, memberId, role, permission) => {
  const response = await api.put(`/groups/${groupId}/members/${memberId}`, { role, permission })
  return response.data
}

export const addNoteToGroup = async (groupId, noteId) => {
  const response = await api.post(`/groups/${groupId}/notes`, { noteId })
  return response.data
}

export const removeNoteFromGroup = async (groupId, noteId) => {
  const response = await api.delete(`/groups/${groupId}/notes/${noteId}`)
  return response.data
}

export default api
