// src/pages/LoginPage.jsx
import { useState } from "react";
import { authService } from "../services/authService";
import { useNavigate, Link } from "react-router-dom";
import ErrorPopup from "../components/ErrorPopup";
import IntroPopup from "../components/IntroPopup";
import "../styles/LoginPage.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showIntro, setShowIntro] = useState(true); // 안내 팝업 상태
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await authService.login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <IntroPopup open={showIntro} onClose={() => setShowIntro(false)} />
      <div className="login-container">
        <h2>D:STATION</h2>
        <p>Login to your user account</p>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <div className="password-header">
              <label htmlFor="password">Password</label>
              <a href="#" className="forgot-password">
                Forgot your password?
              </a>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="off"
            />
          </div>

          <button type="submit" className="login-button">
            Login
          </button>
        </form>

        <div className="signup-link">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </div>

        {error && <ErrorPopup message={error} onClose={() => setError("")} />}
      </div>
    </>
  );
}
