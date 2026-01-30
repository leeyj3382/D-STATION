// src/App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext.jsx";
import Header from "./components/Header";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import MainPage from "./pages/MainPage";
import MyPage from "./pages/MyPage";
import SubmitCompletePage from "./pages/SubmitCompletePage";
import AdminPage from "./pages/AdminPage";
import CheckPage from "./pages/CheckPage";
import Loader from "./components/Loader";
import SecurityWrapper from "./components/SecurityWrapper";

function AppContent() {
  const { currentUser: user, loading } = useAuth();
  const location = useLocation();
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Loader />
      </div>
    );
  }

  return (
    <SecurityWrapper>
      {!isAuthPage && <Header user={user} />}
      <main style={{ flex: 1 }}>
        <Routes>
          <Route
            path="/login"
            element={!user ? <LoginPage /> : <Navigate to="/" />}
          />
          <Route
            path="/signup"
            element={!user ? <SignupPage /> : <Navigate to="/" />}
          />
          <Route
            path="/"
            element={
              user ? (
                user.email === "leeyj3382@naver.com" ? (
                  <Navigate to="/admin" />
                ) : (
                  <MainPage />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/submitted"
            element={user ? <SubmitCompletePage /> : <Navigate to="/login" />}
          />
          <Route
            path="/mypage"
            element={user ? <MyPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/admin"
            element={
              user && user.email === "leeyj3382@naver.com" ? (
                <AdminPage />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/check"
            element={
              user && user.email === "leeyj3382@naver.com" ? (
                <CheckPage />
              ) : (
                <Navigate to="/" />
              )
            }
          />
        </Routes>
      </main>
    </SecurityWrapper>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
