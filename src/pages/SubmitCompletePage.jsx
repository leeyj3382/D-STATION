// src/pages/SubmitCompletePage.jsx
import { Link } from "react-router-dom";

export default function SubmitCompletePage() {
  return (
    <div className="container">
      <h2>제출이 완료되었습니다!</h2>
      <p>토큰이 성공적으로 제출되었습니다.</p>
      <div style={{ marginTop: "2rem" }}>
        <Link to="/mypage">
          <button>내 제출 목록 보기</button>
        </Link>
      </div>
    </div>
  );
}
