const API_BASE_URL =
  import.meta.env.VITE_FAST_API_URL ||
  "https://prepared-on-viper.ngrok-free.app";

export const apiService = {
  // URL을 이미지 파일로 변환하는 함수
  async urlToFile(imageUrl) {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`이미지 다운로드 실패: ${response.status}`);
      }
      const blob = await response.blob();
      return new File([blob], "image.png", { type: "image/png" });
    } catch (error) {
      console.error("URL을 파일로 변환 중 오류:", error);
      throw new Error("이미지 파일 변환에 실패했습니다.");
    }
  },

  // 단일 이미지 DISTS 점수 계산 (파일 업로드)
  async calculateDISTSScore(imageFile) {
    try {
      console.log("[Debug] API 호출 시작:", `${API_BASE_URL}/evaluate`);
      console.log(
        "[Debug] 전송할 파일:",
        imageFile.name,
        imageFile.size,
        "bytes"
      );

      const formData = new FormData();
      formData.append("file", imageFile);

      const response = await fetch(`${API_BASE_URL}/evaluate`, {
        method: "POST",
        body: formData,
      });

      console.log("[Debug] API 응답 상태:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Debug] API 오류 응답:", errorText);
        throw new Error(`API 호출 실패: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("[Debug] API 응답 데이터:", data);

      return data.similarity_score; // DISTS 점수 반환
    } catch (error) {
      console.error("DISTS API 호출 오류:", error);
      throw new Error("점수 계산 중 오류가 발생했습니다: " + error.message);
    }
  },

  // URL 기반 DISTS 점수 계산 (내부적으로 파일 변환 후 API 호출)
  async calculateDISTSScoreFromURL(imageUrl) {
    try {
      const imageFile = await this.urlToFile(imageUrl);
      return await this.calculateDISTSScore(imageFile);
    } catch (error) {
      console.error("URL 기반 DISTS 계산 오류:", error);
      throw error;
    }
  },

  // 배치 점수 계산 (여러 이미지 URL 처리)
  async calculateBatchScores(imageUrls) {
    try {
      const response = await fetch(`${API_BASE_URL}/batch-evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(imageUrls),
      });

      if (!response.ok) {
        throw new Error(`배치 API 호출 실패: ${response.status}`);
      }

      const data = await response.json();
      return data.scores; // {token_id: score, ...} 형태로 반환
    } catch (error) {
      console.error("배치 점수 계산 오류:", error);
      throw new Error("배치 점수 계산 중 오류가 발생했습니다.");
    }
  },

  // API 서버 상태 확인
  async checkServerHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error("API 서버 상태 확인 실패:", error);
      return false;
    }
  },

  // 기준 이미지 업데이트
  async updateReferenceImage(imageFile) {
    try {
      const formData = new FormData();
      formData.append("file", imageFile);

      const response = await fetch(`${API_BASE_URL}/update-reference`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`기준 이미지 업데이트 실패: ${response.status}`);
      }

      const data = await response.json();
      return data.message;
    } catch (error) {
      console.error("기준 이미지 업데이트 오류:", error);
      throw new Error("기준 이미지 업데이트 중 오류가 발생했습니다.");
    }
  },
};
