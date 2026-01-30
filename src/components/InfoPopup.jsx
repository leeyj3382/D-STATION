import React from "react";
import "../styles/InfoPopup.css";

export default function InfoPopup({ message, onClose }) {
  return (
    <div className="popup-overlay">
      <div className="popup info">
        <div className="popup-title">안내</div>
        <div className="popup-message">{message}</div>
        <button className="popup-btn" onClick={onClose}>
          확인
        </button>
      </div>
    </div>
  );
}
