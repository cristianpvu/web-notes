import React, { useState } from 'react'

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!email.endsWith('@stud.ase.ro')) {
      setError('Trebuie să folosești adresa de email instituțională (@stud.ase.ro)')
      return
    }

    setLoading(true)
    console.log('Login attempt with:', email)
  }

  return (
    <div>
      <h1>NotesApp - Autentificare</h1>
      <p>Conectează-te cu contul instituțional</p>
      
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email instituțional:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="numeprenumegeneratie@stud.ase.ro"
            required
          />
        </div>

        {error && <div style={{ color: 'red' }}>{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Se încarcă...' : 'Autentifică-te'}
        </button>
      </form>
    </div>
  )
}

export default Login
