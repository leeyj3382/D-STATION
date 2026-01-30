// src/pages/MainPage.jsx
import React from "react";
import CustomGrid from "../components/CustomGrid";
import "../styles/MainPage.css";

export default function MainPage() {
  return (
    <div className="main-container">
      <div className="main-content">
        {/* <h2>Design your token</h2> */}
        <CustomGrid />
      </div>
    </div>
  );
}
