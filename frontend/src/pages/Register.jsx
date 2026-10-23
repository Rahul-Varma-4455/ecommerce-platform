function Register() {
  return (
    <div className="auth-page">

      <div className="auth-card">

        <h1>Create Account</h1>

        <p>
          Join ShopSphere today.
        </p>

        <form>

          <label>Name</label>

          <input
            type="text"
            placeholder="Enter your name"
          />

          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Create a password"
          />

          <button
            type="submit"
            className="primary-button"
          >
            Register
          </button>

        </form>

      </div>

    </div>
  )
}

export default Register