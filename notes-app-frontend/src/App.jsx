import React, { useState } from 'react'
import Login from './components/Login'


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)

  const handleLogin = (userData) => {
    setUser(userData)
    setIsAuthenticated(true)
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Bine ai venit, {user?.name || user?.email}!</h1>
    </div>
  )
}

export default App