import React, { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

const SecurityWrapper = ({ children }) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.email === "leeyj3382@naver.com";

  useEffect(() => {
    // 관리자가 아닌 경우에만 보안 조치 적용
    if (!isAdmin) {
      // 개발자 도구 차단
      const detectDevTools = () => {
        // 모바일(스마트폰)만 예외처리, 태블릿/PC는 감지
        const isMobile =
          /Mobi|Android(?!.*(Tablet|SM-T|Tab|iPad))/i.test(
            navigator.userAgent
          ) || /iPhone|iPod/i.test(navigator.userAgent);
        if (isMobile) return;

        const threshold = 300; // 더 큰 값으로 조정
        const widthThreshold =
          window.outerWidth - window.innerWidth > threshold;
        const heightThreshold =
          window.outerHeight - window.innerHeight > threshold;

        if (widthThreshold || heightThreshold) {
          document.body.innerHTML =
            '<div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-size: 24px; color: red;">개발자 도구 사용이 금지되어 있습니다.<br><br/>새로고침 후 가볍게 즐겨주세요!</div>';
        }
      };

      // F12 키 차단
      const handleKeyDown = (e) => {
        if (
          e.key === "F12" ||
          (e.ctrlKey && e.shiftKey && e.key === "I") ||
          (e.ctrlKey && e.shiftKey && e.key === "J") ||
          (e.ctrlKey && e.key === "U")
        ) {
          e.preventDefault();
          return false;
        }
      };

      // 우클릭 방지
      const handleContextMenu = (e) => {
        e.preventDefault();
        return false;
      };

      // 콘솔 로그 차단
      const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info,
        debug: console.debug,
      };

      Object.keys(originalConsole).forEach((key) => {
        console[key] = () => {};
      });

      // 이벤트 리스너 등록
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("contextmenu", handleContextMenu);

      // 주기적으로 개발자 도구 감지
      const interval = setInterval(detectDevTools, 1000);

      // 클린업 함수
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("contextmenu", handleContextMenu);
        clearInterval(interval);

        // 콘솔 복원
        Object.keys(originalConsole).forEach((key) => {
          console[key] = originalConsole[key];
        });
      };
    }
  }, [isAdmin]);

  return <>{children}</>;
};

export default SecurityWrapper;
