import React from "react";
import "../styles/ErrorPopup.css";

const ErrorPopup = ({ message, onClose }) => {
  return (
    <div className="error-popup-overlay">
      <div className="error-popup">
        <div className="error-popup-content">
          <h3>Error</h3>
          <p>{message}</p>
          <button onClick={onClose} className="error-close-button">
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPopup;
