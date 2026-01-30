// src/firebase/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  orderBy,
  doc,
  getDoc,
  setDoc,
  increment,
  getDocs,
  limit,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { calculateSimilarity } from "../services/imageSimilarity";
import { getFunctions } from "firebase/functions";
import { apiService } from "../services/apiService";

// ① Firebase 설정 ---------------------------------
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// ② 공통 Helper ------------------------------------
//  (필요 시 원하는 곳에서 import 해서 사용)

export const login = (email, pw) => signInWithEmailAndPassword(auth, email, pw);

export const logout = () => signOut(auth);

export const onUserChange = (cb) => onAuthStateChanged(auth, cb);

// ⬇︎ 토큰 번호 관리
export async function getNextTokenNumber() {
  const counterRef = doc(db, "counters", "tokenNumber");

  try {
    // 카운터 문서 가져오기
    const counterDoc = await getDoc(counterRef);

    if (!counterDoc.exists()) {
      // 카운터가 없으면 초기값 1로 생성
      await setDoc(counterRef, { value: 1 });
      return "001";
    }

    // 카운터 증가
    await setDoc(counterRef, { value: increment(1) }, { merge: true });

    // 새 값 가져오기
    const updatedDoc = await getDoc(counterRef);
    const newNumber = updatedDoc.data().value;

    // 3자리 문자열로 변환 (예: 1 -> "001")
    return String(newNumber).padStart(3, "0");
  } catch (error) {
    console.error("Error getting next token number:", error);
    throw error;
  }
}

// ⬇︎ 사용자 토큰 업로드 함수 수정
export async function uploadUserToken(uid, tokenNumber, jsonString, pngBlob) {
  try {
    // JSON 데이터 저장
    const jsonRef = ref(storage, `userTokens/${uid}/${tokenNumber}.json`);
    await uploadBytes(
      jsonRef,
      new Blob([jsonString], { type: "application/json" })
    );
    const jsonUrl = await getDownloadURL(jsonRef);

    // PNG 이미지 저장
    const pngRef = ref(storage, `userTokens/${uid}/${tokenNumber}.png`);
    await uploadBytes(pngRef, pngBlob);
    const pngUrl = await getDownloadURL(pngRef);

    // 가장 최근의 기준 토큰 가져오기
    const baselineQuery = query(
      collection(db, "baselineTokens"),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const baselineSnapshot = await getDocs(baselineQuery);

    let score = null;
    const parsedData = JSON.parse(jsonString);

    if (!baselineSnapshot.empty) {
      const baselineData = baselineSnapshot.docs[0].data();
      if (baselineData.url) {
        try {
          // PNG Blob을 File 객체로 변환하여 API로 전송
          const pngFile = new File([pngBlob], `token_${tokenNumber}.png`, {
            type: "image/png",
          });
          score = await apiService.calculateDISTSScore(pngFile);
          console.log("DISTS 점수 계산 완료:", score);
        } catch (apiError) {
          console.error(
            "FAST API 호출 실패, 기존 수학적 계산으로 대체:",
            apiError
          );
          // API 실패 시 기존 수학적 계산으로 대체
          if (baselineData.gridStateStr) {
            const baselineGridState = JSON.parse(baselineData.gridStateStr);
            if (
              Array.isArray(baselineGridState) &&
              Array.isArray(parsedData.gridState) &&
              baselineGridState.length === parsedData.gridState.length &&
              baselineGridState[0].length === parsedData.gridState[0].length
            ) {
              score = calculateSimilarity(
                { gridState: baselineGridState },
                { gridState: parsedData.gridState }
              );
            }
          }
        }

        if (typeof score !== "number" || isNaN(score)) {
          console.log("점수 계산 결과 NaN, score를 null로 처리");
          score = null;
        }
      }
    }

    // Firestore에 저장할 데이터 준비
    const tokenData = {
      uid,
      jsonUrl,
      pngUrl,
      tokenNumber: String(tokenNumber),
      email: auth.currentUser.email,
      score,
      createdAt: serverTimestamp(),
      gridStateStr: JSON.stringify(parsedData.gridState),
      gridMetadata: {
        rows: parsedData.gridState.length,
        cols: parsedData.gridState[0].length,
      },
    };

    return addDoc(collection(db, "userTokens"), tokenData);
  } catch (error) {
    console.error("Error uploading user token:", error);
    throw error;
  }
}

// ⬇︎ 관리자 기준 이미지 업로드 & Firestore 메타 저장
export async function uploadBaseline(file, gridState) {
  // gridState 유효성 검사 추가
  if (!gridState || !Array.isArray(gridState)) {
    throw new Error("uploadBaseline: gridState가 올바르지 않습니다.");
  }
  if (!Array.isArray(gridState[0])) {
    throw new Error("uploadBaseline: gridState[0]이 배열이 아닙니다.");
  }
  try {
    const fileRef = ref(storage, `baseline/${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);

    const baselineData = {
      url,
      gridStateStr: JSON.stringify(gridState),
      gridMetadata: {
        rows: gridState.length,
        cols: gridState[0].length,
      },
      createdAt: serverTimestamp(),
    };

    return addDoc(collection(db, "baselineTokens"), baselineData);
  } catch (error) {
    console.error("Error uploading baseline:", error);
    throw error;
  }
}
// ⬇︎ 내 제출 목록 가져오기 (점수 최신순)
export function myTokenQuery(uid) {
  return query(
    collection(db, "userTokens"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc")
  );
}

// ⬇︎ 제출 마감 상태 읽기
export async function getSubmissionClosed() {
  const settingsRef = doc(db, "settings", "global");
  const docSnap = await getDoc(settingsRef);
  return docSnap.exists() ? !!docSnap.data().submissionClosed : false;
}

// ⬇︎ 제출 마감 상태 변경
export async function setSubmissionClosed(closed) {
  const settingsRef = doc(db, "settings", "global");
  await setDoc(settingsRef, { submissionClosed: closed }, { merge: true });
}
