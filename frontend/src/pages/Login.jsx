import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, loginUser } from '../services/api'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [loading, setLoading] = useState(false)

  async function handleLogin(event) {
    event.preventDefault()

    setError('')
    setSuccess('')
    setLoading(true)

    try {

      const data = await loginUser(email, password)

      localStorage.setItem(
      'access_token',
       data.access_token
       )

       const user = await getCurrentUser()

       localStorage.setItem(
        'user',
        JSON.stringify(user)
        )

      if (user.role === 'customer') {
       navigate('/customer-dashboard')
        } else if (user.role === 'seller') {
           navigate('/seller-dashboard')
            } else if (user.role === 'admin') {
                navigate('/admin-dashboard')
                  } else {
                    throw new Error('Unknown user role')
                   }

    } catch (error) {

      setError(error.message)

    } finally {

      setLoading(false)

    }
  }

  return (
    <div className="auth-page">

      <div className="auth-card">

        <h1>Welcome Back</h1>

        <p>
          Login to your ShopSphere account.
        </p>

        <form onSubmit={handleLogin}>

          <label>
            Email
          </label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
          />

          <label>
            Password
          </label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            required
          />

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

        </form>

        {error && (
          <p className="error-message">
            {error}
          </p>
        )}

        {success && (
          <p className="success-message">
            {success}
          </p>
        )}

      </div>

    </div>
  )
}

export default Login