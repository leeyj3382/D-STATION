// src/components/ResultCard.jsx
export default function ResultCard({
  imageUrl,
  score,
  createdAt,
  tokenNumber,
  isWinner,
}) {
  const getScoreColor = (score) => {
    if (score === null) return "#666";
    if (score >= 90) return "#4CAF50";
    if (score >= 70) return "#2196F3";
    if (score >= 50) return "#FFC107";
    return "#F44336";
  };

  const getScoreText = (score) => {
    if (score === null || isNaN(score)) return "채점 중...";
    return `${score}점`;
  };

  return (
    <div className="result-card" style={{ position: "relative" }}>
      <img
        src={imageUrl}
        alt={`Token ${tokenNumber}`}
        style={{ width: "100%", borderRadius: 8 }}
      />
      {isWinner && (
        <img
          src="/pass.png"
          alt="PASS"
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 100,
            opacity: 0.85,
            pointerEvents: "none",
            zIndex: 2,
            filter: "drop-shadow(0 0px 0px rgba(0,0,0,0.15))",
          }}
        />
      )}
      <div className="info">
        <div className="token-number">Token #{tokenNumber}</div>
        <div className="score" style={{ color: getScoreColor(score) }}>
          {getScoreText(score)}
        </div>
        <div className="date">{createdAt?.toDate().toLocaleString()}</div>
      </div>
    </div>
  );
}
