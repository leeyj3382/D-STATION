import { useState } from "react";
import { authService } from "../services/authService";
import { useNavigate, Link } from "react-router-dom";
import ErrorPopup from "../components/ErrorPopup";
import IntroPopup from "../components/IntroPopup";
import LoadingPopup from "../components/Loader";
import SignupLoadingPopup from "../components/SignupLoadingPopup";
import InfoPopup from "../components/InfoPopup";

import "../styles/LoginPage.css";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const navigate = useNavigate();
  const [showSignupPopup, setShowSignupPopup] = useState(true);
  const [info, setInfo] = useState("");

  const handleSendVerification = async () => {
    if (!email) {
      setError("이메일을 입력해주세요.");
      return;
    }
    try {
      setIsLoading(true);
      await authService.sendVerificationCode(email);
      setIsVerificationSent(true);
      setInfo(
        <>
          인증번호가 이메일로 전송되었습니다. 인증번호가 오지 않았을 경우,{" "}
          <strong style={{ fontSize: "1.4rem" }}>스팸메일함</strong>을
          확인해주세요.
        </>
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setError("인증번호를 입력해주세요.");
      return;
    }
    try {
      setIsLoading(true);
      await authService.verifyCode(email, verificationCode);
      setIsVerified(true);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!isVerified) {
      setError("이메일 인증이 필요합니다.");
      return;
    }
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    try {
      setIsLoading(true);
      await authService.signup(email, password);
      setSignupSuccess(true);
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {showSignupPopup && (
        <div className="intro-popup-overlay">
          <div className="intro-popup fixed-size">
            <div className="intro-popup-slider">
              <div className="slide slide-active">
                <h2 className="intro-popup-title">회원가입 안내</h2>
                <div className="intro-popup-content">
                  <span style={{ color: "#C9C9C9", fontSize: "0.95rem" }}>
                    ***** Hint #2 ! *****
                    <br></br>
                    <b>붉은 노을이 깔린</b> 바다에<b> 섬</b>이 떠 있다면 이쁠 것
                    같습니다. **
                    <br></br>
                    <img
                      src="/hint2.png"
                      alt="wave hint"
                      style={{
                        width: "100px",
                        marginTop: "0.5rem",
                        borderRadius: "4px",
                      }}
                    />
                    <br></br>
                    ***** Hint #2 ! *****
                    <br></br>
                  </span>
                  <b>실제 사용중이신 이메일</b>을 입력하셔야 당첨시 상품을
                  수령하실 수 있습니다.
                  <br />
                  이메일 이외의 개인정보는 수집하지 않습니다.
                  <br />
                  <br />
                  <span
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      color: "#dc2626",
                    }}
                  >
                    비밀번호는 특수문자 포함 8자 이상으로 설정하셔야 합니다.
                  </span>
                  <br />
                  "비밀번호 찾기"기능은 구현하지 않았기 때문에, 기억하고 계셔야
                  합니다.
                  <br />
                  <br />
                  <b>***</b> 토큰은
                  <span
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      color: "#dc2626",
                    }}
                  >
                    계정당 5회
                  </span>
                  만 제출 가능합니다.
                  <b>***</b>
                  <br />
                  <br />
                  드로우(2025/07/07)이후 가입하신 이메일로 당첨 여부와 관계없이
                  기준이 되었던
                  <br />
                  토큰 이미지를 보내드립니다.
                  <br />
                </div>
              </div>
            </div>
            <div className="intro-popup-buttons">
              <button
                className="intro-popup-btn close"
                onClick={() => setShowSignupPopup(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
      {isLoading && <SignupLoadingPopup message="처리 중입니다..." />}
      {signupSuccess && (
        <SuccessPopup
          message="회원가입이 완료되었습니다!"
          onClose={() => setSignupSuccess(false)}
        />
      )}
      {info && <InfoPopup message={info} onClose={() => setInfo("")} />}
      {error && <ErrorPopup message={error} onClose={() => setError("")} />}
      <div className="login-container">
        <h2>D:STATION</h2>
        <p>Sign up for a new account</p>
        <form onSubmit={handleSignup} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isVerified) {
                    e.preventDefault();
                    handleSendVerification();
                  }
                }}
                autoComplete="off"
                disabled={isVerificationSent || isVerified}
                style={{ flex: 1 }}
                readOnly={isVerified}
              />
              {!isVerified && !isVerificationSent && (
                <button
                  type="button"
                  onClick={handleSendVerification}
                  disabled={isLoading}
                  className="login-button"
                  style={{ width: "auto", whiteSpace: "nowrap" }}
                >
                  인증번호 전송
                </button>
              )}
            </div>
          </div>

          {isVerificationSent && !isVerified && (
            <div className="form-group">
              <label htmlFor="verificationCode">인증번호</label>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  id="verificationCode"
                  type="text"
                  placeholder="인증번호 6자리"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleVerifyCode();
                    }
                  }}
                  autoComplete="off"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={isLoading}
                  className="login-button"
                  style={{ width: "auto", whiteSpace: "nowrap" }}
                >
                  인증하기
                </button>
              </div>
            </div>
          )}

          {isVerified && (
            <>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <button
                type="submit"
                className="login-button"
                disabled={isLoading}
              >
                Sign Up
              </button>
            </>
          )}
        </form>
        <div className="signup-link">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </>
  );
}
