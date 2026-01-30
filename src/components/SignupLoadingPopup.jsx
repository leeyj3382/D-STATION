import React from "react";
import "../styles/SignupLoadingPopup.css";

export default function SignupLoadingPopup({ message = "처리 중입니다..." }) {
  return (
    <div className="signup-loading-overlay">
      <div className="signup-loading-popup">
        <div className="signup-spinner" />
        <div className="signup-loading-message">{message}</div>
      </div>
    </div>
  );
}
