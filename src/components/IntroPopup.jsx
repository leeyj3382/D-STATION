import React, { useState } from "react";
import "../styles/IntroPopup.css";

const pages = [
  {
    title: "D:STATION 소개",
    content: (
      <>
        {/* 본 서비스는 <b>토큰 커스텀을 활용한 새로운 드로우</b> 시스템의
        <br></br>
        MVP(최소기능제품) 테스트 버전입니다.
        <br />
        <br />
        <b>아이템 설명을 확인</b>하고, <b>테스트 및 설문</b>에 꼭 참여해 주세요!
        <br />
        D:STATION은 회원가입 및 설문 과정에서 상품을 제공하기 위해
        <br></br>
        <b>이메일을 수집</b>하고자 합니다.
        <br />
        <br />
        팝업의 설명엔 아이템에 대한 설명과, 힌트들이 있습니다.
        <br />
        <span style={{ color: "#666", fontSize: "0.95rem" }}>
          (설문은 My Page 화면에서 확인할 수 있습니다)
        </span>
        <br />
        <br />
        <b>*** Draw Tip : 안내 팝업 어딘가에 힌트가 숨겨져 있습니다. ***</b>
        <br />
        pc환경에서 더 쉽게 찾을 수 있습니다. */}

        <>
          <b>
            D:STATION은 토큰 커스터마이징 기반의 새로운 드로우 시스템입니다.
          </b>
          <br />
          지금은 <b>MVP 테스트 버전</b>으로, 테스트 참여와 설문 응답을
          부탁드립니다.
          <br />
          <br />
          회원가입 시 <b>이메일을 수집</b>하며, 일부 참여자에겐 상품이
          제공됩니다.
          <br />
          <br />
          <span style={{ color: "#666", fontSize: "0.95rem" }}>
            설문은 My Page 화면에서 확인할 수 있으며,
            <br />
            토큰 설명 및 힌트는 안내 팝업에서 확인 가능합니다.
          </span>
          <br />
          <br />
          <b>Draw Tip:</b> 안내 팝업 어딘가에 <b>힌트</b>가 숨겨져 있습니다!
          <br />
          PC 환경에서 더 쉽게 찾을 수 있어요.
        </>
      </>
    ),
  },
  {
    content: (
      <>
        {/* <span style={{ color: "#FF4400", fontSize: "2rem" }}>
          <b> ** 긴급 공지 ** </b>
        </span>
        <br></br>
        <b>채점 로직 변경</b>에 따라, 모든 토큰에 대해 변경된 기준을 일괄 적용
        중에 있습니다.
        <br></br>
        기존의 토큰들은 바뀐 점수가 적용되어 있으며,
        <br></br>앞으로 제출하는 토큰에 대해선 즉각적으로 적용되게 됩니다.
        <br></br>
        <b>
          만약, '정수'형의 점수가 나왔다면, 이는 서버가 불안정하여 기존의
          잘못되었던 채점 방식으로 채점이 된 것일 수 있습니다.
        </b>
        <br></br>
        이에 대응하기 위해, 모든 토큰 재채점(이미 바뀐 방식으로 받은 점수는
        변하지 않습니다)을 중간중간 돌리고 있습니다.
        <br></br>
        따라서, 정수형의 점수가 나왔다면 바뀔 가능성이 있다는 것을 알려드립니다.
        <br></br>
        서버 다운으로 6/27 19:10에 재채점 진행했습니다. */}
        <>
          <img
            src="/1.png"
            alt="first image"
            style={{
              width: "400px",
              marginBottom: "1rem",
              borderRadius: "8px",
            }}
          />
          <br />
          <b>나만의 토큰을 디자인하고 제출하세요!</b>
          <br />
          셀을 <b>클릭하거나 드래그</b>하여 자유롭게 색을 칠할 수 있습니다.
          <br />총 <b>5번의 제출 기회</b>가 주어집니다.
          <br />
          <br />
          운영자가 미리 업로드한 <b>특정 토큰과 유사한 디자인</b>일수록
          <br />
          <b>높은 점수</b>를 받을 수 있습니다.
          <br></br>
          쉽게 말해, 제가 미리 디자인한 토큰을 추론하여 유사하게 그리면 됩니다.
          <br></br>힌트는 팝업 어딘가에 숨겨져 있습니다.
        </>
      </>
    ),
  },
  {
    content: (
      <>
        {/* <img
          src="/1.png"
          alt="first image"
          style={{ width: "400px", marginBottom: "1rem", borderRadius: "8px" }}
        />
        <br></br>
        <b>토큰 커스터마이징</b> 기능을 통해 나만의 토큰을 만들어 제출할 수
        있습니다.
        <br />각 셀을 <b>클릭/터치 하거나 드래그</b>하여 색을 칠하고, 다양한
        패턴을 디자인해보세요.
        <br />
        토큰 색칠 작업은 사용자가 원하는대로 진행할 수 있으며
        <br /> 기회는 <b>다섯 번</b> 주어집니다.
        <br />
        운영자는 <b>사전에 특정한 모양으로 색칠된 토큰을 업로드</b>해두었는데,
        <br />그 모양과 <b>가장 유사한 토큰</b>을 게시한 사용자에게
        <br />
        <b>높은 점수</b>가 주어지는 방식입니다. */}
        <>
          <img
            src="/2_1.png"
            alt="2_1"
            style={{
              width: "80px",
              marginBottom: "2rem",
              marginRight: "2rem",
              borderRadius: "8px",
            }}
          />
          <img
            src="/2_3.png"
            alt="2_3"
            style={{
              width: "60px",
              marginBottom: "3rem",
              marginRight: "2rem",
              borderRadius: "8px",
            }}
          />
          <img
            src="/2_2.png"
            alt="2_2"
            style={{
              width: "120px",
              marginBottom: "1rem",
              borderRadius: "8px",
            }}
          />
          <br></br>
          <b>채점 기준</b>은 운영자가 업로드한 토큰과의 <b>유사도</b>입니다.
          <br />
          점수는 My Page에서 확인할 수 있어요.
          <br />
          <br />
          <span style={{ color: "#C9C9C9", fontSize: "0.95rem" }}>
            <b>***** Hint #1 *****</b>
            <br />
            운영자는 <b>바다와 파도</b>를 좋아합니다.
            <br />
            디자인에 참고해보세요!
            <br />
            <img
              src="/hint1.png"
              alt="wave hint"
              style={{
                width: "100px",
                marginTop: "0.5rem",
                borderRadius: "4px",
              }}
            />
            <br />
            <b>***** Hint #1 *****</b>
          </span>
        </>
      </>
    ),
  },
  {
    content: (
      <>
        {/* <img
          src="/2_1.png"
          alt="2_1"
          style={{
            width: "80px",
            marginBottom: "2rem",
            marginRight: "2rem",
            borderRadius: "8px",
          }}
        />
        <img
          src="/2_3.png"
          alt="2_3"
          style={{
            width: "60px",
            marginBottom: "3rem",
            marginRight: "2rem",
            borderRadius: "8px",
          }}
        />
        <img
          src="/2_2.png"
          alt="2_2"
          style={{ width: "120px", marginBottom: "1rem", borderRadius: "8px" }}
        />
        <br></br>
        <b>점수책정</b>은 관리자가 사전에 업로드한 토큰과의 <b>유사도</b>를
        기준으로 진행됩니다.
        <br />
        결과는 상단 메뉴의 My Page에서 확인 가능합니다.
        <br></br>
        <br></br>
        <span style={{ color: "#C9C9C9", fontSize: "0.95rem" }}>
          ***** Hint #1 ! *****
          <br></br>
          ** 참고로 저(관리자)는 <b>바다</b>를 좋아하고, <b>파도치는 모습</b>을
          좋아합니다 **
          <br></br>
          <img
            src="/hint1.png"
            alt="wave hint"
            style={{ width: "100px", marginTop: "0.5rem", borderRadius: "4px" }}
          />
          <br></br>
          ***** Hint #1 ! *****
        </span> */}
        <>
          <img
            src="/3_2.png"
            alt="3"
            style={{
              width: "150px",
              marginBottom: "1rem",
              borderRadius: "8px",
            }}
          />
          <br />
          <b>드로우 마감일: 2025/07/07 23:59:59</b>
          <br />
          당첨 여부는 My Page에서 확인할 수 있으며, <b>PASS 스탬프</b>로
          표시됩니다.
          <br />
          <br />
          <b>상위 5명</b>에겐 <b>베스킨라빈스 파인트 기프티콘</b>을 이메일로
          발송합니다.
          <br />
          <b>설문 참여자</b>에겐 <b>쿼터</b>로 업그레이드!
        </>
      </>
    ),
  },
  {
    content: (
      <>
        {/* <img
          src="/3_2.png"
          alt="3"
          style={{ width: "150px", marginBottom: "1rem", borderRadius: "8px" }}
        />
        <br></br>
        <b>드로우가 마감되면</b>, 당첨 여부를 My Page에서 확인(pass 스탬프
        표시)할 수 있습니다.
        <br />본 MVP 테스트의{" "}
        <b>드로우는 2025/07/07 오후 11시 59분 59초에 마감됩니다.</b>
        <br />
        당첨자인 상위 5명에게는 무더운 여름 힘내시라고
        <br />
        <b>베스킨라빈스 파인트 기프티콘</b>을 가입하신 이메일로 보내드립니다.
        <br />
        ** 당첨자 중 My Page의 <b>설문에 참여하신 분들에겐 쿼터</b>로
        제공됩니다! ** */}
        <>
          <span style={{ color: "#FF4400", fontSize: "2rem" }}>
            <b>** 긴급 공지 **</b>
          </span>
          <br />
          <br />
          <b>채점 방식이 변경되었습니다.</b>
          <br />- 기존 제출 토큰은 <b>일괄 재채점</b>됨<br />- 이후 제출 토큰은{" "}
          <b>즉시 새 기준 적용</b>
          <br />
          <br />
          <b>정수 점수</b>가 나왔다면,
          <br />
          서버 불안정으로 인해 <b>구 버전 채점이 적용</b>되었을 수 있습니다.
          <br />
          6/27 19:10에 재채점이 진행되었습니다.
        </>
      </>
    ),
  },
];

export default function IntroPopup({ open, onClose }) {
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(0); // -1: 이전, 1: 다음
  const [animating, setAnimating] = useState(false);

  if (!open) return null;

  const handleMove = (nextPage) => {
    if (animating) return;
    setDirection(nextPage > page ? 1 : -1);
    setAnimating(true);
    setTimeout(() => {
      setPage(nextPage);
      setAnimating(false);
    }, 350); // 애니메이션 시간과 맞춤
  };

  return (
    <div className="intro-popup-overlay">
      <div className="intro-popup fixed-size">
        <div className="intro-popup-slider">
          {pages.map((p, idx) => (
            <div
              key={idx}
              className={`slide${
                idx === page
                  ? animating
                    ? direction === 1
                      ? " slide-out-left"
                      : " slide-out-right"
                    : " slide-active"
                  : idx === page + 1 && direction === 1 && animating
                  ? " slide-in-right"
                  : idx === page - 1 && direction === -1 && animating
                  ? " slide-in-left"
                  : ""
              }`}
            >
              <h2 className="intro-popup-title">{p.title}</h2>
              <div className="intro-popup-content">{p.content}</div>
            </div>
          ))}
        </div>
        <div className="intro-popup-buttons">
          {page > 0 && (
            <button
              className="intro-popup-btn"
              onClick={() => handleMove(page - 1)}
              disabled={animating}
            >
              이전
            </button>
          )}
          {page < pages.length - 1 ? (
            <button
              className="intro-popup-btn"
              onClick={() => handleMove(page + 1)}
              disabled={animating}
            >
              다음
            </button>
          ) : (
            <button
              className="intro-popup-btn close"
              onClick={onClose}
              disabled={animating}
            >
              닫기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
