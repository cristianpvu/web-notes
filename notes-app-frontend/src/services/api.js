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


export const createSubject = async (subjectData) => {
  const response = await api.post('/subjects', subjectData)
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

export default api
