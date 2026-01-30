// src/components/CustomGrid.jsx
import React, { useState, useRef, useEffect } from "react";
import "../styles/CustomGrid.css";
import {
  uploadUserToken,
  getNextTokenNumber,
  getSubmissionClosed,
} from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import Loader from "./Loader";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";

// base64 문자열을 Blob으로 변환하는 함수 추가
function base64ToBlob(base64, mime = "image/png") {
  const byteString = atob(base64.split(",")[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mime });
}

const CustomGrid = ({ onSubmit }) => {
  const [selectedColor, setSelectedColor] = useState("#E6B17E");
  const [tokenNumber, setTokenNumber] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isEraserMode, setIsEraserMode] = useState(false);
  const gridRef = useRef(null);
  const canvasRef = useRef(null);
  // 각 셀당 4개의 삼각형 상태를 저장 (top, right, bottom, left)
  const [gridState, setGridState] = useState(
    Array(64)
      .fill(null)
      .map(() => Array(4).fill(null))
  );
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [userTokenCount, setUserTokenCount] = useState(0);
  const [showLimitPopup, setShowLimitPopup] = useState(false);
  const [submissionClosed, setSubmissionClosed] = useState(false);

  // Canvas 초기화 및 업데이트
  useEffect(() => {
    if (!canvasRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = 800; // 그리드 크기에 맞게 조정
      canvas.height = 800; // 그리드 크기에 맞게 조정
      canvasRef.current = canvas;
    }
  }, []);

  // 그리드를 PNG로 변환하는 함수
  const convertGridToPng = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const cellSize = canvas.width / 8; // 8x8 그리드

    // 캔버스 초기화 (배경색 설정)
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 그리드 그리기
    gridState.forEach((cell, index) => {
      const row = Math.floor(index / 8);
      const col = index % 8;
      const x = col * cellSize;
      const y = row * cellSize;

      // 각 삼각형 그리기
      cell.forEach((color, triangleIndex) => {
        if (color) {
          ctx.fillStyle = color;
          ctx.beginPath();

          switch (triangleIndex) {
            case 0: // top
              ctx.moveTo(x, y);
              ctx.lineTo(x + cellSize, y);
              ctx.lineTo(x + cellSize / 2, y + cellSize / 2);
              break;
            case 1: // right
              ctx.moveTo(x + cellSize, y);
              ctx.lineTo(x + cellSize, y + cellSize);
              ctx.lineTo(x + cellSize / 2, y + cellSize / 2);
              break;
            case 2: // bottom
              ctx.moveTo(x + cellSize, y + cellSize);
              ctx.lineTo(x, y + cellSize);
              ctx.lineTo(x + cellSize / 2, y + cellSize / 2);
              break;
            case 3: // left
              ctx.moveTo(x, y + cellSize);
              ctx.lineTo(x, y);
              ctx.lineTo(x + cellSize / 2, y + cellSize / 2);
              break;
          }

          ctx.closePath();
          ctx.fill();
        }
      });

      // 각 셀의 그리드 라인 그리기
      ctx.strokeStyle = "#e0e0e0"; // 더 연한 회색으로 변경
      ctx.lineWidth = 0.5; // 선 굵기를 더 얇게
      ctx.beginPath();
      ctx.rect(x, y, cellSize, cellSize);
      ctx.stroke();

      // 대각선 그리기
      ctx.beginPath();
      ctx.moveTo(x + cellSize / 2, y + cellSize / 2);
      ctx.lineTo(x + cellSize, y); // 우상
      ctx.moveTo(x + cellSize / 2, y + cellSize / 2);
      ctx.lineTo(x + cellSize, y + cellSize); // 우하
      ctx.moveTo(x + cellSize / 2, y + cellSize / 2);
      ctx.lineTo(x, y + cellSize); // 좌하
      ctx.moveTo(x + cellSize / 2, y + cellSize / 2);
      ctx.lineTo(x, y); // 좌상
      ctx.stroke();
    });

    // 외곽 테두리
    ctx.strokeStyle = "#cccccc"; // 연한 회색으로 변경
    ctx.lineWidth = 1; // 외곽선도 얇게 조정
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/png");
  };

  useEffect(() => {
    const fetchTokenNumber = async () => {
      // 관리자 페이지에서는 토큰 번호를 생성하지 않음
      if (window.location.pathname === "/admin") return;

      try {
        const number = await getNextTokenNumber();
        console.log("Generated token number:", number); // 디버깅용 로그
        setTokenNumber(number);
      } catch (error) {
        console.error("토큰 번호 생성 중 오류 발생:", error);
        alert("토큰 번호를 생성하는 데 실패했습니다.");
      }
    };

    fetchTokenNumber();
  }, []);

  useEffect(() => {
    async function fetchUserTokenCount() {
      if (!currentUser) return;
      const q = query(
        collection(db, "userTokens"),
        where("uid", "==", currentUser.uid)
      );
      const snap = await getDocs(q);
      setUserTokenCount(snap.size);
    }
    fetchUserTokenCount();
  }, [currentUser, showSuccessPopup]);

  useEffect(() => {
    // Firestore에서 마감 상태 읽어오기
    getSubmissionClosed().then(setSubmissionClosed);
  }, []);

  const handleColorChange = (e) => {
    setSelectedColor(e.target.value);
  };

  const handleTriangleClick = (cellIndex, triangleIndex) => {
    const newGridState = gridState.map((cell, idx) =>
      idx === cellIndex
        ? cell.map((triangle, tIdx) =>
            tIdx === triangleIndex
              ? isEraserMode
                ? null
                : selectedColor
              : triangle
          )
        : cell
    );
    setGridState(newGridState);
  };

  const handleMouseDown = (cellIndex, triangleIndex) => {
    setIsDragging(true);
    handleTriangleClick(cellIndex, triangleIndex);
  };

  const handleMouseEnter = (cellIndex, triangleIndex) => {
    if (isDragging) {
      handleTriangleClick(cellIndex, triangleIndex);
    }
  };

  // 마우스가 그리드 영역을 벗어났을 때 드래그 중지
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, []);

  const toggleEraserMode = () => {
    setIsEraserMode(!isEraserMode);
  };

  const handleSubmit = async () => {
    if (submissionClosed) {
      alert("현재 제출이 마감되었습니다.");
      return;
    }
    if (userTokenCount >= 5) {
      setShowLimitPopup(true);
      return;
    }
    // 관리자 페이지가 아닐 때만 토큰 번호 체크
    if (window.location.pathname !== "/admin") {
      if (!tokenNumber) {
        console.error("Token number is missing:", tokenNumber);
        alert("토큰 번호가 생성되지 않았습니다. 페이지를 새로고침해주세요.");
        return;
      }
    }

    // PNG 이미지 생성
    const pngData = convertGridToPng();
    const pngBlob = base64ToBlob(pngData);

    const gridData = {
      gridState,
      selectedColor,
      pngData,
    };

    if (onSubmit) {
      // 관리자 페이지에서의 제출
      onSubmit(gridData);
    } else {
      // 일반 사용자의 제출
      if (!currentUser) {
        alert("로그인이 필요합니다.");
        navigate("/login");
        return;
      }

      try {
        setIsLoading(true);
        console.log("Submitting with token number:", tokenNumber);
        console.log("Current user:", currentUser?.uid);
        console.log("Grid data:", gridData);

        await uploadUserToken(
          currentUser.uid,
          tokenNumber,
          JSON.stringify(gridData),
          pngBlob
        );
        console.log("Token successfully uploaded");
        setShowSuccessPopup(true);
        setTimeout(() => {
          navigate("/mypage");
        }, 2000);
      } catch (error) {
        console.error("Error uploading token:", error);
        alert(error.message || "토큰 업로드 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const renderGrid = () => {
    return Array(64)
      .fill(null)
      .map((_, cellIndex) => {
        // Grid position information (might be useful later)
        // const row = Math.floor(cellIndex / 8);
        // const col = cellIndex % 8;

        return (
          <div key={cellIndex} className="grid-cell">
            {/* Top triangle */}
            <div
              className={`triangle top ${isEraserMode ? "eraser-cursor" : ""}`}
              style={{
                backgroundColor: gridState[cellIndex][0] || "transparent",
              }}
              onMouseDown={() => handleMouseDown(cellIndex, 0)}
              onMouseEnter={() => handleMouseEnter(cellIndex, 0)}
            />
            {/* Right triangle */}
            <div
              className={`triangle right ${
                isEraserMode ? "eraser-cursor" : ""
              }`}
              style={{
                backgroundColor: gridState[cellIndex][1] || "transparent",
              }}
              onMouseDown={() => handleMouseDown(cellIndex, 1)}
              onMouseEnter={() => handleMouseEnter(cellIndex, 1)}
            />
            {/* Bottom triangle */}
            <div
              className={`triangle bottom ${
                isEraserMode ? "eraser-cursor" : ""
              }`}
              style={{
                backgroundColor: gridState[cellIndex][2] || "transparent",
              }}
              onMouseDown={() => handleMouseDown(cellIndex, 2)}
              onMouseEnter={() => handleMouseEnter(cellIndex, 2)}
            />
            {/* Left triangle */}
            <div
              className={`triangle left ${isEraserMode ? "eraser-cursor" : ""}`}
              style={{
                backgroundColor: gridState[cellIndex][3] || "transparent",
              }}
              onMouseDown={() => handleMouseDown(cellIndex, 3)}
              onMouseEnter={() => handleMouseEnter(cellIndex, 3)}
            />
            <div className="grid-lines"></div>
          </div>
        );
      });
  };

  // 터치 이벤트 핸들러 추가
  const handleTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    const target = document.elementFromPoint(
      e.touches[0].clientX,
      e.touches[0].clientY
    );
    if (!target) return;
    const cellDiv = target.closest(".grid-cell");
    if (!cellDiv) return;
    const cellIndex = Array.from(cellDiv.parentNode.children).indexOf(cellDiv);
    if (cellIndex < 0) return;
    // 삼각형 인덱스 찾기
    const triangleDiv = target.closest(".triangle");
    if (!triangleDiv) return;
    const triangleIndex = ["top", "right", "bottom", "left"].findIndex((dir) =>
      triangleDiv.classList.contains(dir)
    );
    if (triangleIndex < 0) return;
    setIsDragging(true);
    handleTriangleClick(cellIndex, triangleIndex);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !e.touches || e.touches.length === 0) return;
    const target = document.elementFromPoint(
      e.touches[0].clientX,
      e.touches[0].clientY
    );
    if (!target) return;
    const cellDiv = target.closest(".grid-cell");
    if (!cellDiv) return;
    const cellIndex = Array.from(cellDiv.parentNode.children).indexOf(cellDiv);
    if (cellIndex < 0) return;
    const triangleDiv = target.closest(".triangle");
    if (!triangleDiv) return;
    const triangleIndex = ["top", "right", "bottom", "left"].findIndex((dir) =>
      triangleDiv.classList.contains(dir)
    );
    if (triangleIndex < 0) return;
    handleTriangleClick(cellIndex, triangleIndex);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    grid.addEventListener("touchstart", handleTouchStart, { passive: false });
    grid.addEventListener("touchmove", handleTouchMove, { passive: false });
    grid.addEventListener("touchend", handleTouchEnd, { passive: false });
    return () => {
      grid.removeEventListener("touchstart", handleTouchStart);
      grid.removeEventListener("touchmove", handleTouchMove);
      grid.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, gridState, isEraserMode, selectedColor]);

  return (
    <div className="custom-grid-container">
      <div className="grid-header">
        <h2>TOKEN CUSTOM : D:STATION</h2>
        <p>
          TOKEN ID :{" "}
          {window.location.pathname === "/admin" ? "MASTER TOKEN" : tokenNumber}
        </p>
      </div>
      {isLoading && (
        <div className="loading-overlay">
          <Loader />
        </div>
      )}
      {showSuccessPopup && (
        <div className="success-popup">
          <p>제출이 완료되었습니다</p>
        </div>
      )}
      {showLimitPopup && (
        <div className="success-popup" style={{ zIndex: 2001 }}>
          <p>토큰 제출은 계정당 최대 5회까지 가능합니다.</p>
          <button
            style={{
              marginTop: "1.5rem",
              padding: "0.6rem 2rem",
              borderRadius: 6,
              background: "#222",
              color: "#fff",
              border: "none",
              fontWeight: 600,
              fontSize: "1rem",
              cursor: "pointer",
            }}
            onClick={() => setShowLimitPopup(false)}
          >
            닫기
          </button>
        </div>
      )}
      <div className="grid-wrapper">
        <div ref={gridRef} className="grid">
          {renderGrid()}
        </div>
      </div>

      <div className="color-picker">
        <div className="color-label">COLOR</div>
        <input
          type="color"
          value={selectedColor}
          onChange={handleColorChange}
          className="color-input"
        />
        <div className="color-code">{selectedColor.toUpperCase()}</div>
        <button
          className={`eraser-button ${isEraserMode ? "active" : ""}`}
          onClick={toggleEraserMode}
        >
          ERASER
        </button>
      </div>

      <div className="submit-button-container">
        <button
          onClick={handleSubmit}
          className="submit-button"
          disabled={isLoading || submissionClosed}
        >
          {window.location.pathname === "/admin"
            ? "Upload Token"
            : "Submit Token"}
        </button>
      </div>
    </div>
  );
};

export default CustomGrid;
