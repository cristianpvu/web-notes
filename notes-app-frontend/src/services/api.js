import axios from 'axios'

const API_URL = 'https://web-notes-nine.vercel.app/api'


const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})


export const sendMagicLink = async (email) => {
  const response = await api.post('/auth/login', { email })
  return response.data
}


export const verifyToken = async (accessToken) => {
  const response = await api.post('/auth/verify', { access_token: accessToken })
  return response.data
}

export default api
