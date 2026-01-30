// src/pages/MyPage.jsx
import { useCollection } from "react-firebase-hooks/firestore";
import { auth, db } from "../firebase/firebase";
import { collection, query, where } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import Loader from "../components/Loader";
import ResultCard from "../components/ResultCard";
import "../styles/MyPage.css";

export default function MyPage() {
  const [user] = useAuthState(auth);
  const [snap, loading, error] = useCollection(
    user
      ? query(collection(db, "userTokens"), where("uid", "==", user.uid))
      : null
  );

  // 디버깅을 위한 로그 추가
  console.log("Current user:", user?.uid);
  console.log("Loading state:", loading);
  console.log("Error state:", error);
  console.log("Snapshot exists:", !!snap);

  if (error) {
    console.error("Error fetching submissions:", error);
    return (
      <div className="my-page-container">
        <div className="my-page-header">
          <h2>My Submissions</h2>
        </div>
        <div className="error-message">
          Error loading submissions. Please try again later.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="my-page-container">
        <div className="my-page-header">
          <h2>My Submissions</h2>
        </div>
        <div
          style={{ display: "flex", justifyContent: "center", padding: "3rem" }}
        >
          <Loader />
        </div>
      </div>
    );
  }

  const submissions = snap?.docs || [];

  // 클라이언트 사이드에서 정렬
  const sortedSubmissions = [...submissions].sort((a, b) => {
    const dateA = a.data().createdAt?.toMillis() || 0;
    const dateB = b.data().createdAt?.toMillis() || 0;
    return dateB - dateA; // 내림차순 정렬
  });

  console.log("Number of submissions:", submissions.length);

  return (
    <div className="my-page-container">
      <div
        className="my-page-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2 style={{ margin: 0 }}>My Tokens</h2>
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLSctc3gs3ywggOe2rfjJKkkn4onnt9oxxoWilp6Rvz8XucQCyg/viewform?usp=dialog"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: "#222",
            color: "#fff",
            borderRadius: 6,
            padding: "0.6rem 1.5rem",
            fontWeight: 600,
            fontSize: "1rem",
            textDecoration: "none",
            boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
            marginLeft: "1.5rem",
            transition: "background 0.18s",
            border: "none",
            display: "inline-block",
            cursor: "pointer",
          }}
        >
          설문 참여하기
        </a>
      </div>
      <div className="result-grid">
        {sortedSubmissions.length > 0 ? (
          sortedSubmissions.map((doc) => {
            const data = doc.data();
            console.log("Submission data:", data);
            return (
              <ResultCard
                key={doc.id}
                imageUrl={data.pngUrl}
                score={data.score}
                createdAt={data.createdAt}
                tokenNumber={data.tokenNumber}
                isWinner={data.isWinner}
              />
            );
          })
        ) : (
          <div className="no-submissions">
            No submissions yet. Create your first token!
          </div>
        )}
      </div>
    </div>
  );
}
