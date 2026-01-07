import React, { useState } from 'react'
import Login from './components/Login'

/**
 * Componenta principală a aplicației SPA
 * Gestionează starea de autentificare și view-urile
 */
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)

  const handleLogin = (userData) => {
    setUser(userData)
    setIsAuthenticated(true)
  }

  // Dacă utilizatorul nu este autentificat, arată pagina de login
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  // Dacă utilizatorul este autentificat, arată dashboard-ul
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Bine ai venit, {user?.name || user?.email}!</h1>
      <p>Dashboard va fi implementat în pașii următori</p>
    </div>
  )
}

export default App