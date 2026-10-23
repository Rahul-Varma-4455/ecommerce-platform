import { useNavigate } from 'react-router-dom'

function LogoutButton() {
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')

    navigate('/login')
  }

  return (
    <button
      className="logout-button"
      onClick={handleLogout}
    >
      Logout
    </button>
  )
}

export default LogoutButton