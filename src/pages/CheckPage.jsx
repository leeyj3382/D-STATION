import React, { useState, useEffect } from "react";
import {
  firestoreService,
  markWinners,
  recalculateAllScoresWithDISTS,
} from "../services/firestoreService";
import { apiService } from "../services/apiService";
import { authService } from "../services/authService";
import { useNavigate } from "react-router-dom";
import "../styles/CheckPage.css";
import { setSubmissionClosed } from "../firebase/firebase";
const WINNER_COUNT = 5;

const CheckPage = () => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isUpdatingReference, setIsUpdatingReference] = useState(false);
  const [referenceFile, setReferenceFile] = useState(null);
  const [hoveredToken, setHoveredToken] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!currentUser || currentUser.email !== "leeyj3382@naver.com") {
          navigate("/");
          return;
        }
        fetchRankings();
      } catch {
        setError("관리자 권한 확인 중 오류가 발생했습니다.");
        setLoading(false);
      }
    };
    checkAdmin();
  }, [navigate]);

  const fetchRankings = async () => {
    try {
      const userTokens = await firestoreService.getUserTokens();

      // 사용자별 가장 높은 점수의 토큰만 선택
      const bestTokensByUser = userTokens
        .filter((token) => token.score !== null && token.email)
        .reduce((acc, token) => {
          const existingToken = acc[token.email];
          if (!existingToken || token.score > existingToken.score) {
            acc[token.email] = token;
          }
          return acc;
        }, {});

      // 점수 기준으로 내림차순 정렬
      const sortedTokens = Object.values(bestTokensByUser)
        .sort((a, b) => b.score - a.score)
        .slice(0, 30); // 상위 30개만 선택

      setRankings(sortedTokens);
      setLoading(false);
    } catch {
      setError("랭킹 데이터를 불러오는 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  const handleClose = async () => {
    setIsClosing(true);
    try {
      const winners = rankings.slice(0, WINNER_COUNT);
      await markWinners(winners);
      await setSubmissionClosed(true);
      alert(
        "마감 완료! 상위 " + WINNER_COUNT + "개 토큰에 당첨이 부여되었습니다."
      );
      fetchRankings(); // 당첨 표시 갱신
    } catch (e) {
      alert("마감 처리 중 오류 발생: " + e.message);
    } finally {
      setIsClosing(false);
    }
  };

  const handleRecalculate = async () => {
    if (
      !window.confirm(
        "모든 토큰의 점수를 DISTS로 재계산하시겠습니까?\n이 작업은 시간이 오래 걸릴 수 있습니다.\n⚠️ 기존 점수는 백업되지만 되돌릴 수 없습니다."
      )
    )
      return;

    setIsRecalculating(true);
    try {
      const result = await recalculateAllScoresWithDISTS();
      alert(
        `점수 재계산 완료!\n` +
          `총 ${result.totalTokens}개 토큰 중 ${result.updatedCount}개 업데이트됨\n` +
          `실패: ${result.failedCount}개\n` +
          `백업된 점수: ${result.backupScores}개`
      );
      fetchRankings(); // 랭킹 새로고침
    } catch (e) {
      alert("점수 재계산 중 오류 발생: " + e.message);
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleUpdateReference = async () => {
    if (!referenceFile) {
      alert("기준 이미지를 선택해주세요.");
      return;
    }

    if (
      !window.confirm(
        "기준 이미지를 업데이트하시겠습니까?\n이 작업은 모든 점수 계산에 영향을 줍니다."
      )
    )
      return;

    setIsUpdatingReference(true);
    try {
      const message = await apiService.updateReferenceImage(referenceFile);
      alert(`기준 이미지 업데이트 완료!\n${message}`);
      setReferenceFile(null);
      // 파일 입력 초기화
      const fileInput = document.getElementById("reference-file-input");
      if (fileInput) fileInput.value = "";
    } catch (e) {
      alert("기준 이미지 업데이트 중 오류 발생: " + e.message);
    } finally {
      setIsUpdatingReference(false);
    }
  };

  const handleRestart = async () => {
    try {
      await setSubmissionClosed(false);
      alert("제출이 재시작되었습니다. 모든 사용자가 다시 제출할 수 있습니다.");
      fetchRankings();
    } catch (e) {
      alert("재시작 처리 중 오류 발생: " + e.message);
    }
  };

  if (loading) {
    return <div className="check-loading">로딩 중...</div>;
  }
  if (error) {
    return <div className="check-error">{error}</div>;
  }

  return (
    <div className="check-container">
      <h1 className="check-title">랭킹 보드</h1>
      {/* 미리보기 영역 */}
      {hoveredToken && hoveredToken.pngUrl && (
        <div
          style={{
            position: "fixed",
            top: 100,
            right: 40,
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: 8,
            padding: 10,
            zIndex: 1000,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            minWidth: 220,
            textAlign: "center",
          }}
        >
          <img
            src={hoveredToken.pngUrl}
            alt="토큰 미리보기"
            style={{ width: 200, borderRadius: 8 }}
          />
          <div style={{ marginTop: 8 }}>
            <b>{hoveredToken.email}</b>
            <br />
            점수: {hoveredToken.score}
          </div>
        </div>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "2rem",
          padding: "1rem",
          background: "#f8f9fa",
          borderRadius: "8px",
          border: "1px solid #dee2e6",
        }}
      >
        <span style={{ fontWeight: 600, color: "#495057" }}>
          기준 이미지 업데이트:
        </span>
        <input
          id="reference-file-input"
          type="file"
          accept="image/*"
          onChange={(e) => setReferenceFile(e.target.files[0])}
          style={{ padding: "0.5rem" }}
        />
        <button
          onClick={handleUpdateReference}
          disabled={isUpdatingReference || !referenceFile}
          style={{
            padding: "0.5rem 1.5rem",
            fontWeight: 600,
            borderRadius: 4,
            background: "#007bff",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            opacity: !referenceFile || isUpdatingReference ? 0.6 : 1,
          }}
        >
          {isUpdatingReference ? "업데이트 중..." : "기준 이미지 업데이트"}
        </button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <button
          onClick={handleClose}
          disabled={isClosing}
          style={{
            padding: "0.5rem 1.5rem",
            fontWeight: 600,
            borderRadius: 4,
            background: "#222",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          {isClosing ? "마감 중..." : "마감"}
        </button>
        <button
          onClick={handleRecalculate}
          disabled={isRecalculating}
          style={{
            padding: "0.5rem 1.5rem",
            fontWeight: 600,
            borderRadius: 4,
            background: "#4CAF50",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          {isRecalculating ? "재계산 중..." : "점수 재계산"}
        </button>
        <button
          onClick={handleRestart}
          style={{
            padding: "0.5rem 1.5rem",
            fontWeight: 600,
            borderRadius: 4,
            background: "#f35e3d",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          재시작
        </button>
      </div>
      <table className="check-table">
        <thead>
          <tr>
            <th className="check-th">순위</th>
            <th className="check-th">토큰 번호</th>
            <th className="check-th">이메일</th>
            <th className="check-th">점수</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((token, index) => (
            <tr
              className="check-tr"
              key={token.id}
              onMouseEnter={() => setHoveredToken(token)}
              onMouseLeave={() => setHoveredToken(null)}
              style={{ cursor: "pointer" }}
            >
              <td className="check-rank">{index + 1}</td>
              <td className="check-td">{token.tokenNumber}</td>
              <td className="check-td">{token.email || "이메일 없음"}</td>
              <td className="check-score">{token.score}점</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CheckPage;
