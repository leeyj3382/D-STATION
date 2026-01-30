// src/components/Header.jsx
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import "../styles/Header.css";

export default function Header({ user }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate("/");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <header className="header">
      <Link to="/" style={{ textDecoration: "none" }}>
        <h1>D:STATION</h1>
      </Link>
      {user ? (
        <nav>
          <Link to="/">Home</Link>

          {user.email === "leeyj3382@naver.com" ? (
            <Link to="/check">Check</Link>
          ) : (
            <Link to="/mypage">My Page</Link>
          )}
          {user.email === "leeyj3382@naver.com" && (
            <Link to="/admin">Admin</Link>
          )}
          <button onClick={handleLogout}>Logout</button>
        </nav>
      ) : (
        <nav>
          <Link to="/login">Login</Link>
        </nav>
      )}
    </header>
  );
}
