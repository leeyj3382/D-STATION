import { db } from "../firebase/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDocs,
  limit,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { calculateSimilarity } from "./imageSimilarity";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { apiService } from "./apiService";

export const firestoreService = {
  addUserToken: async (userId, url) => {
    try {
      const docRef = await addDoc(collection(db, "userTokens"), {
        uid: userId,
        url,
        score: null,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  addBaselineToken: async (url) => {
    try {
      const docRef = await addDoc(collection(db, "baselineTokens"), {
        url,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  getUserTokensQuery: (userId) => {
    return query(
      collection(db, "userTokens"),
      where("uid", "==", userId),
      orderBy("createdAt", "desc")
    );
  },

  saveAdminToken: async (tokenData) => {
    try {
      const docRef = await addDoc(collection(db, "adminTokens"), {
        ...tokenData,
        createdAt: new Date(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error saving admin token:", error);
      throw error;
    }
  },

  saveUserToken: async (tokenData) => {
    try {
      console.log("[Debug] saveUserToken 시작");
      console.log("[Debug] 입력된 tokenData:", tokenData);

      // 1. 가장 최근의 관리자 토큰 가져오기
      const adminTokensQuery = query(
        collection(db, "adminTokens"),
        orderBy("createdAt", "desc"),
        limit(1)
      );
      const adminSnapshot = await getDocs(adminTokensQuery);
      console.log(
        "[Debug] 관리자 토큰 쿼리 결과:",
        adminSnapshot.empty ? "없음" : "있음"
      );

      if (adminSnapshot.empty) {
        console.error("[Error] 관리자 토큰을 찾을 수 없음");
        throw new Error("No admin token found");
      }

      const adminToken = adminSnapshot.docs[0].data();
      console.log("[Debug] 관리자 토큰 데이터:", adminToken);

      // 2. 유사도 계산 (FAST API 우선, 실패 시 기존 수학적 계산)
      console.log("[Debug] 유사도 계산 시작");
      let similarityScore = null;

      try {
        // PNG Blob이 있는 경우 직접 API로 전송
        if (tokenData.pngBlob) {
          const pngFile = new File(
            [tokenData.pngBlob],
            `token_${tokenData.tokenNumber}.png`,
            { type: "image/png" }
          );
          similarityScore = await apiService.calculateDISTSScore(pngFile);
          console.log("[Debug] DISTS 점수 계산 완료:", similarityScore);
        } else if (tokenData.pngUrl) {
          // URL이 있는 경우 URL을 통해 계산
          similarityScore = await apiService.calculateDISTSScoreFromURL(
            tokenData.pngUrl
          );
          console.log("[Debug] DISTS 점수 계산 완료:", similarityScore);
        }
      } catch (apiError) {
        console.error(
          "[Error] FAST API 호출 실패, 기존 수학적 계산으로 대체:",
          apiError
        );
        // API 실패 시 기존 수학적 계산으로 대체
        similarityScore = calculateSimilarity(adminToken, tokenData);
      }

      console.log("[Debug] 최종 유사도 점수:", similarityScore);

      // 3. 사용자 토큰 저장 (유사도 점수 포함)
      console.log("[Debug] 사용자 토큰 저장 시작");
      const docRef = await addDoc(collection(db, "userTokens"), {
        ...tokenData,
        score: similarityScore,
        createdAt: new Date(),
      });
      console.log("[Debug] 사용자 토큰 저장 완료, 문서 ID:", docRef.id);

      return docRef.id;
    } catch (error) {
      console.error("[Error] 사용자 토큰 저장 중 오류:", error);
      throw error;
    }
  },

  getAdminToken: async () => {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, "adminTokens"),
          orderBy("createdAt", "desc"),
          limit(1)
        )
      );
      if (querySnapshot.empty) {
        return null;
      }
      return querySnapshot.docs[0].data();
    } catch (error) {
      console.error("Error getting admin token:", error);
      throw error;
    }
  },

  getUserTokens: async () => {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, "userTokens"), orderBy("createdAt", "desc"))
      );
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error getting user tokens:", error);
      throw error;
    }
  },
};

// Firebase Storage에서 userTokens 복구
export async function recoverUserTokens() {
  try {
    const storage = getStorage();
    const db = getFirestore();

    // Storage의 userTokens 디렉토리 리스트
    const storageRef = ref(storage, "userTokens");
    const userDirs = await listAll(storageRef);

    for (const userDir of userDirs.prefixes) {
      const uid = userDir.name;
      const userFiles = await listAll(userDir);

      // 각 사용자의 토큰 파일들 처리
      for (const jsonFile of userFiles.items) {
        if (jsonFile.name.endsWith(".json")) {
          const tokenNumber = jsonFile.name.replace(".json", "");
          const jsonUrl = await getDownloadURL(jsonFile);
          const pngRef = ref(storage, `userTokens/${uid}/${tokenNumber}.png`);
          const pngUrl = await getDownloadURL(pngRef);

          // JSON 데이터 가져오기
          const response = await fetch(jsonUrl);
          const jsonData = await response.json();

          // Firestore에 문서 재생성
          const tokenData = {
            uid,
            jsonUrl,
            pngUrl,
            tokenNumber,
            gridStateStr: JSON.stringify(jsonData.gridState),
            gridMetadata: {
              rows: jsonData.gridState.length,
              cols: jsonData.gridState[0].length,
            },
            createdAt: serverTimestamp(),
          };

          await addDoc(collection(db, "userTokens"), tokenData);
          console.log(`Recovered token ${tokenNumber} for user ${uid}`);
        }
      }
    }

    console.log("Recovery process completed successfully");
    return true;
  } catch (error) {
    console.error("Error during recovery:", error);
    throw error;
  }
}

// 컬렉션 초기화 함수
export async function initializeCollections() {
  try {
    // userTokens 컬렉션 초기화
    const userTokensRef = collection(db, "userTokens");
    await addDoc(userTokensRef, {
      _type: "collection_init",
      createdAt: serverTimestamp(),
      description: "Collection initialization document",
    });

    console.log("userTokens 컬렉션이 생성되었습니다.");
    return true;
  } catch (error) {
    console.error("컬렉션 초기화 중 오류 발생:", error);
    throw error;
  }
}

// N개 토큰을 당첨 처리
export async function markWinners(topTokens) {
  const { getFirestore, doc, updateDoc } = await import("firebase/firestore");
  const db = getFirestore();
  for (const token of topTokens) {
    const tokenRef = doc(db, "userTokens", token.id);
    await updateDoc(tokenRef, { isWinner: true });
  }
}

// 관리자/사용자 토큰 및 카운터 초기화
export async function resetAllCollections() {
  const { getFirestore, collection, getDocs, deleteDoc } = await import(
    "firebase/firestore"
  );
  const db = getFirestore();
  // userTokens 삭제
  const userTokensSnap = await getDocs(collection(db, "userTokens"));
  for (const docSnap of userTokensSnap.docs) {
    await deleteDoc(docSnap.ref);
  }
  // adminTokens 삭제
  const adminTokensSnap = await getDocs(collection(db, "adminTokens"));
  for (const docSnap of adminTokensSnap.docs) {
    await deleteDoc(docSnap.ref);
  }
  // 토큰 카운터 초기화 (예: counters 컬렉션이 있다면)
  try {
    const countersSnap = await getDocs(collection(db, "counters"));
    for (const docSnap of countersSnap.docs) {
      await deleteDoc(docSnap.ref);
    }
  } catch {
    // counters 컬렉션이 없으면 무시
  }
}

// 기존 토큰들의 점수를 DISTS로 재계산
export async function recalculateAllScoresWithDISTS() {
  try {
    console.log("[Debug] 모든 토큰 점수 재계산(순차적) 시작");

    // 1. 모든 사용자 토큰 가져오기
    const userTokens = await firestoreService.getUserTokens();
    console.log(`[Debug] 총 ${userTokens.length}개의 토큰 발견`);

    // 2. PNG URL이 있는 토큰들만 필터링
    const validTokens = userTokens.filter((token) => token.pngUrl);
    console.log(`[Debug] PNG URL이 있는 토큰: ${validTokens.length}개`);

    if (validTokens.length === 0) {
      throw new Error("재계산할 토큰이 없습니다.");
    }

    // 3. 기존 점수 백업 (선택사항)
    const backupScores = {};
    validTokens.forEach((token) => {
      if (token.score !== null && token.score !== undefined) {
        backupScores[token.id] = {
          originalScore: token.score,
          originalMethod: token.scoreMethod || "legacy",
          backupTime: new Date(),
        };
      }
    });

    // 4. 순차적으로 하나씩 파일을 evaluate API에 보내고, 실패 시 fallback
    const { getFirestore, doc, updateDoc } = await import("firebase/firestore");
    const { getStorage, ref, getDownloadURL } = await import(
      "firebase/storage"
    );
    const db = getFirestore();
    const storage = getStorage();

    let updatedCount = 0;
    let failedCount = 0;
    for (const token of validTokens) {
      let newScore = null;
      let usedFallback = false;
      try {
        // Firebase Storage SDK를 사용해서 이미지 다운로드 (CORS 우회)
        const urlParts = token.pngUrl.split("/o/");
        const filePath = decodeURIComponent(urlParts[1].split("?")[0]);
        const storageRef = ref(storage, filePath);

        // Firebase Storage에서 직접 바이트 데이터 가져오기 (CORS 완전 우회)
        const { getBytes } = await import("firebase/storage");
        const bytes = await getBytes(storageRef);
        const blob = new Blob([bytes], { type: "image/png" });
        const pngFile = new File(
          [blob],
          `token_${token.tokenNumber || token.id}.png`,
          { type: "image/png" }
        );
        // evaluate API 호출
        newScore = await apiService.calculateDISTSScore(pngFile);
        console.log(`[Debug] 토큰 ${token.id} DISTS 점수:`, newScore);
      } catch (apiError) {
        console.error(
          `[Error] 토큰 ${token.id} DISTS API 실패, fallback 시도:`,
          apiError
        );
        // fallback: 기존 수학적 계산
        try {
          // 기준(관리자) 토큰 정보 가져오기
          const adminToken = await firestoreService.getAdminToken();
          if (adminToken && token.gridStateStr && adminToken.gridStateStr) {
            const userGrid = JSON.parse(token.gridStateStr);
            const adminGrid = JSON.parse(adminToken.gridStateStr);
            newScore = calculateSimilarity(
              { gridState: adminGrid },
              { gridState: userGrid }
            );
            usedFallback = true;
          }
        } catch (fallbackError) {
          console.error(`[Error] fallback 계산도 실패:`, fallbackError);
          newScore = null;
        }
      }
      if (typeof newScore === "number" && !isNaN(newScore)) {
        const tokenRef = doc(db, "userTokens", token.id);
        await updateDoc(tokenRef, {
          score: newScore,
          recalculatedAt: new Date(),
          scoreMethod: usedFallback ? "fallback" : "DISTS",
          ...(backupScores[token.id] && {
            originalScore: backupScores[token.id].originalScore,
            originalMethod: backupScores[token.id].originalMethod,
            backupTime: backupScores[token.id].backupTime,
          }),
        });
        updatedCount++;
      } else {
        failedCount++;
        console.warn(`[Warning] 토큰 ${token.id}의 점수 계산 실패:`, newScore);
      }
    }
    console.log(
      `[Debug] ${updatedCount}개 토큰 점수 업데이트 완료, ${failedCount}개 실패`
    );
    return {
      updatedCount,
      failedCount,
      totalTokens: userTokens.length,
      backupScores: Object.keys(backupScores).length,
    };
  } catch (error) {
    console.error("[Error] 점수 재계산 중 오류:", error);
    throw error;
  }
}

// 개별 토큰 점수 재계산 (API 실패 시 수동 재계산용)
export async function recalculateSingleTokenScore(tokenId) {
  try {
    const { getFirestore, doc, getDoc, updateDoc } = await import(
      "firebase/firestore"
    );
    const db = getFirestore();

    // 토큰 데이터 가져오기
    const tokenRef = doc(db, "userTokens", tokenId);
    const tokenSnap = await getDoc(tokenRef);

    if (!tokenSnap.exists()) {
      throw new Error("토큰을 찾을 수 없습니다.");
    }

    const tokenData = tokenSnap.data();

    if (!tokenData.pngUrl) {
      throw new Error("토큰 이미지 URL이 없습니다.");
    }

    // DISTS 점수 계산
    const newScore = await apiService.calculateDISTSScoreFromURL(
      tokenData.pngUrl
    );

    // 점수 업데이트
    await updateDoc(tokenRef, {
      score: newScore,
      recalculatedAt: new Date(),
      scoreMethod: "DISTS",
    });

    return newScore;
  } catch (error) {
    console.error("[Error] 개별 토큰 점수 재계산 중 오류:", error);
    throw error;
  }
}
