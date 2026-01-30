// src/pages/AdminPage.jsx
import React, { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, uploadBaseline } from "../firebase/firebase";
import CustomGrid from "../components/CustomGrid";
import Loader from "../components/Loader";
import "../styles/AdminPage.css";

export default function AdminPage() {
  const [user] = useAuthState(auth);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const handleSubmit = async (gridData) => {
    try {
      setIsLoading(true);

      if (!user || user.email !== "leeyj3382@naver.com") {
        throw new Error("관리자 권한이 필요합니다.");
      }

      const jsonBlob = new Blob([JSON.stringify(gridData)], {
        type: "application/json",
      });
      const file = new File([jsonBlob], `baseline_${Date.now()}.json`, {
        type: "application/json",
      });

      await uploadBaseline(file, gridData.gridState);
      setShowSuccessPopup(true);
      setTimeout(() => {
        setShowSuccessPopup(false);
      }, 2000);
    } catch (error) {
      console.error("Error uploading baseline:", error);
      alert("기준 토큰 업로드 중 오류가 발생했습니다: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-content">
        <CustomGrid onSubmit={handleSubmit} />
      </div>
      {isLoading && (
        <div className="loading-overlay">
          <Loader />
        </div>
      )}
      {showSuccessPopup && (
        <div className="success-popup">
          <p>기준 토큰이 성공적으로 업로드되었습니다</p>
        </div>
      )}
    </div>
  );
}
