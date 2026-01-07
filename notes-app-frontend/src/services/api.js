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

// ============================================
// SUBJECTS API
// ============================================

/**
 * Obține toate materiile utilizatorului
 */
export const getSubjects = async () => {
  const response = await api.get('/subjects')
  return response.data
}

/**
 * Creează o materie nouă
 * @param {Object} subjectData - Datele materiei (name, code, color, description)
 */
export const createSubject = async (subjectData) => {
  const response = await api.post('/subjects', subjectData)
  return response.data
}

// ============================================
// TAGS API
// ============================================

/**
 * Obține toate tag-urile utilizatorului
 */
export const getTags = async () => {
  const response = await api.get('/tags')
  return response.data
}

/**
 * Creează un tag nou
 * @param {Object} tagData - Datele tag-ului (name, color)
 */
export const createTag = async (tagData) => {
  const response = await api.post('/tags', tagData)
  return response.data
}

export default api
