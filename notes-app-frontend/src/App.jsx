import React, { useState, useEffect } from 'react'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import ViewNoteModal from './components/ViewNoteModal'
import { getPublicNoteById } from './services/api'


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [publicNote, setPublicNote] = useState(null)
  const [showPublicNote, setShowPublicNote] = useState(false)


  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        setIsAuthenticated(true)
      } catch (error) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    
    checkPublicNoteInUrl()
    
    setLoading(false)
  }, [])

  const checkPublicNoteInUrl = async () => {
    const path = window.location.pathname
    const match = path.match(/^\/note\/([a-f0-9-]+)$/i)
    
    if (match) {
      const noteId = match[1]
      const token = localStorage.getItem('token')
      
      if (!token) {
        try {
          const note = await getPublicNoteById(noteId)
          setPublicNote(note)
          setShowPublicNote(true)
          window.history.replaceState({}, document.title, '/')
        } catch (err) {
          console.error('Notița publică nu a fost găsită:', err)
          alert('Notița nu a fost găsită sau nu este publică.')
          window.history.replaceState({}, document.title, '/')
        }
      }
    }
  }


  const handleLogin = (userData) => {
    setUser(userData)
    setIsAuthenticated(true)
  }


  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setIsAuthenticated(false)
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <p>Se încarcă...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Dacă există o notița publică de afișat, arată-o chiar dacă utilizatorul nu e autentificat
    if (showPublicNote && publicNote) {
      return (
        <div>
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            padding: '15px 20px',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h1 style={{ margin: 0, fontSize: '24px' }}>📚 Notes App</h1>
            <button
              onClick={() => setShowPublicNote(false)}
              style={{
                padding: '8px 16px',
                background: 'white',
                color: '#667eea',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Autentificare
            </button>
          </div>
          <ViewNoteModal
            note={publicNote}
            isOpen={true}
            onClose={() => setShowPublicNote(false)}
            onNoteUpdated={() => {}}
            readOnly={true}
          />
        </div>
      )
    }
    
    return <Login onLogin={handleLogin} />
  }

  return <Dashboard user={user} onLogout={handleLogout} />
}

export default App