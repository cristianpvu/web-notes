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
export default api
