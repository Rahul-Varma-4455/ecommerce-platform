import { Link } from 'react-router-dom'

function Home() {
  return (
    <div>
      <section className="hero-section">

        <div className="hero-content">

          <p className="hero-small-text">
            A BETTER WAY TO SHOP
          </p>

          <h1>
            Thoughtful finds,
            <br />
            all in one place.
          </h1>

          <p className="hero-description">
            Discover something you’ll love from independent sellers.
            A seamless shopping experience, from the first browse to delivery.
          </p>

          <Link className="primary-button hero-cta" to="/products">
            Explore the collection <span aria-hidden="true">→</span>
          </Link>

        </div>

      </section>

      <section className="features">
        <div className="features-heading">
          <p className="hero-small-text">MADE FOR EVERYDAY</p>
          <h2>Shopping, made simple</h2>
        </div>

        <div className="feature-card">
          <div className="feature-icon" aria-hidden="true">✳</div>

          <h2>Wide Selection</h2>

          <p>
            Explore a thoughtful range of products from trusted sellers.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon" aria-hidden="true">↗</div>

          <h2>Orders, made easy</h2>

          <p>
            Keep your orders close and follow every step along the way.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon" aria-hidden="true">✓</div>

          <h2>Shop with confidence</h2>

          <p>
            A clear, reliable shopping experience from start to finish.
          </p>
        </div>

      </section>
    </div>
  )
}

export default Home