import deltaE from "delta-e";
import chroma from "chroma-js";

// 유사도 측정 함수
export const calculateSimilarity = (adminToken, userToken) => {
  console.log("[Debug] calculateSimilarity 시작");
  console.log("[Debug] adminToken:", adminToken);
  console.log("[Debug] userToken:", userToken);

  if (!adminToken?.gridState || !userToken?.gridState) {
    console.error("[Error] Invalid token data");
    return 0;
  }

  const score = scoreTokens(adminToken, userToken);
  console.log("[Debug] 최종 유사도 점수:", score);
  return score;
};

// 유사도 점수 계산 함수
function scoreTokens(ref, user) {
  console.log("[Debug] scoreTokens 시작");
  const SHAPE_WEIGHT = 0.4; // 형태 가중치
  const COLOR_WEIGHT = 0.3; // 색상 가중치
  const LAYOUT_WEIGHT = 0.3; // 레이아웃 가중치

  const n = ref.gridState.length;
  const m = ref.gridState[0].length;

  // 형태 유사도 계산
  let filledRef = 0,
    filledUser = 0;
  let matchingCells = 0;
  let totalCells = n * m;

  // 색상 분포 계산을 위한 배열
  let refColors = [];
  let userColors = [];

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < m; x++) {
      const rCell = ref.gridState[y][x];
      const uCell = user.gridState[y][x];

      // 형태 분석
      if (rCell) filledRef++;
      if (uCell) filledUser++;
      if ((rCell && uCell) || (!rCell && !uCell)) matchingCells++;

      // 색상 수집
      if (rCell) refColors.push(chroma(rCell));
      if (uCell) userColors.push(chroma(uCell));
    }
  }

  // 1. 형태 점수 계산
  const shapeSimilarity = matchingCells / totalCells;
  const fillRatioSimilarity =
    Math.min(filledRef, filledUser) / Math.max(filledRef, filledUser);
  const shapeScore = shapeSimilarity * 0.7 + fillRatioSimilarity * 0.3;
  console.log("[Debug] 형태 점수:", shapeScore);

  // 2. 색상 점수 계산
  let colorScore = 1;
  if (refColors.length > 0 && userColors.length > 0) {
    let totalColorDiff = 0;
    let comparisons = 0;

    console.log(
      "[Debug] 색상 비교 시작 - refColors:",
      refColors.length,
      "userColors:",
      userColors.length
    );

    for (let i = 0; i < refColors.length; i++) {
      for (let j = 0; j < userColors.length; j++) {
        try {
          const lab1 = refColors[i].lab();
          const lab2 = userColors[j].lab();

          console.log("[Debug] 색상 비교 - LAB1:", lab1, "LAB2:", lab2);

          if (!lab1 || !lab2 || lab1.some(isNaN) || lab2.some(isNaN)) {
            console.warn("[Warning] 유효하지 않은 LAB 값 발견");
            continue;
          }

          // 색상 차이 계산 (간단한 유클리드 거리 사용)
          const dL = lab1[0] - lab2[0];
          const da = lab1[1] - lab2[1];
          const db = lab1[2] - lab2[2];
          const colorDistance = Math.sqrt(dL * dL + da * da + db * db);

          // 색상 차이를 0-1 범위로 정규화 (최대 거리 100으로 가정)
          const normalizedDiff = Math.max(0, 1 - colorDistance / 100);

          if (!isNaN(normalizedDiff)) {
            totalColorDiff += normalizedDiff;
            comparisons++;
          }
        } catch (error) {
          console.error("[Error] 색상 비교 중 오류:", error);
          continue;
        }
      }
    }

    console.log(
      "[Debug] 색상 비교 결과 - totalColorDiff:",
      totalColorDiff,
      "comparisons:",
      comparisons
    );

    if (comparisons > 0) {
      colorScore = totalColorDiff / comparisons;
      if (isNaN(colorScore)) {
        console.warn("[Warning] 색상 점수가 NaN으로 계산됨, 기본값 0으로 설정");
        colorScore = 0;
      }
    } else {
      console.warn("[Warning] 유효한 색상 비교가 없음, 기본값 0으로 설정");
      colorScore = 0;
    }
  }
  console.log("[Debug] 색상 점수:", colorScore);

  // 3. 레이아웃 점수 계산
  let layoutScore = 1;
  if (filledRef > 0 && filledUser > 0) {
    let refCentroid = [0, 0];
    let userCentroid = [0, 0];
    let refCount = 0;
    let userCount = 0;

    for (let y = 0; y < n; y++) {
      for (let x = 0; x < m; x++) {
        if (ref.gridState[y][x]) {
          refCentroid[0] += x;
          refCentroid[1] += y;
          refCount++;
        }
        if (user.gridState[y][x]) {
          userCentroid[0] += x;
          userCentroid[1] += y;
          userCount++;
        }
      }
    }

    if (refCount > 0 && userCount > 0) {
      refCentroid[0] /= refCount;
      refCentroid[1] /= refCount;
      userCentroid[0] /= userCount;
      userCentroid[1] /= userCount;

      const maxDistance = Math.sqrt(n * n + m * m);
      const centroidDistance = Math.sqrt(
        Math.pow(refCentroid[0] - userCentroid[0], 2) +
          Math.pow(refCentroid[1] - userCentroid[1], 2)
      );

      layoutScore = 1 - centroidDistance / maxDistance;
    }
  }
  console.log("[Debug] 레이아웃 점수:", layoutScore);

  // 최종 점수 계산 (0-100 범위)
  const finalScore = Math.round(
    (shapeScore * SHAPE_WEIGHT +
      colorScore * COLOR_WEIGHT +
      layoutScore * LAYOUT_WEIGHT) *
      100
  );

  return Math.max(0, Math.min(100, finalScore));
}
