# DISTS Image Similarity API 사용법

## 개요

이 프로젝트는 DISTS(Deep Image Structure and Texture Similarity) 알고리즘을 사용하여 이미지 유사도를 계산하는 시스템입니다.

## 설치 및 실행

### 1. FAST API 서버 실행

```bash
# 필요한 패키지 설치
pip install fastapi uvicorn torchvision pillow requests

# FAST API 서버 실행
python fastapi_server.py
```

서버는 `http://localhost:8000`에서 실행됩니다.

### 2. 프론트엔드 환경 변수 설정

`.env` 파일에 다음을 추가:

```
VITE_FAST_API_URL=http://localhost:8000
```

### 3. 프론트엔드 실행

```bash
npm install
npm run dev
```

## API 엔드포인트

### 1. 단일 이미지 평가

- **POST** `/evaluate` - 파일 업로드를 통한 이미지 유사도 평가
- **POST** `/evaluate-url` - URL을 통한 이미지 유사도 평가

### 2. 배치 평가

- **POST** `/batch-evaluate` - 여러 이미지 URL의 배치 유사도 평가

### 3. 기준 이미지 관리

- **POST** `/update-reference` - 기준 이미지 업데이트

### 4. 상태 확인

- **GET** `/health` - 서버 상태 확인
- **GET** `/` - API 정보

## 사용법

### 1. 새로운 토큰 제출

사용자가 토큰을 제출하면 자동으로 DISTS 점수가 계산됩니다.

### 2. 기존 토큰 점수 재계산

관리자 페이지(`/check`)에서 "점수 재계산" 버튼을 클릭하여 모든 기존 토큰의 점수를 DISTS로 재계산할 수 있습니다.

### 3. 기준 이미지 업데이트

관리자 페이지에서 기준 이미지를 업데이트할 수 있습니다. 이는 모든 점수 계산에 영향을 줍니다.

## 점수 계산 방식

DISTS 알고리즘은 다음과 같은 방식으로 점수를 계산합니다:

1. **이미지 전처리**: 224x224 크기로 리사이즈
2. **패치 분할**: 8x8 그리드로 이미지를 64개 패치로 분할
3. **특징 추출**: VGG16 네트워크를 사용하여 각 패치의 특징 추출
4. **유사도 계산**: 기준 이미지와 사용자 이미지 간의 DISTS 거리 계산
5. **점수 정규화**: 0-100점 범위로 정규화

## 파일 구조

```
├── fastapi_server.py          # FAST API 서버
├── src/
│   ├── services/
│   │   ├── apiService.js      # API 호출 서비스
│   │   └── firestoreService.js # Firestore 서비스
│   ├── pages/
│   │   └── CheckPage.jsx      # 관리자 페이지
│   └── firebase/
│       └── firebase.js        # Firebase 설정
└── README_DISTS.md           # 이 파일
```

## 주의사항

1. **기준 이미지**: `reference.png` 파일이 서버 디렉토리에 있어야 합니다. 없으면 빈 이미지가 사용됩니다.

2. **GPU 사용**: CUDA가 사용 가능한 환경에서는 자동으로 GPU를 사용합니다.

3. **API 오류 처리**: API 호출이 실패하면 기존의 수학적 계산 방식으로 fallback됩니다.

4. **배치 처리**: 많은 수의 토큰을 재계산할 때는 시간이 오래 걸릴 수 있습니다.

## 문제 해결

### API 서버가 응답하지 않는 경우

1. 서버가 실행 중인지 확인: `http://localhost:8000/health`
2. 포트가 사용 중인지 확인
3. 방화벽 설정 확인

### 점수 계산이 실패하는 경우

1. 이미지 파일이 올바른 형식인지 확인
2. 이미지 URL이 접근 가능한지 확인
3. 서버 로그 확인

### 기준 이미지 업데이트가 안 되는 경우

1. 이미지 파일 형식 확인 (PNG, JPG 등)
2. 파일 크기 확인 (너무 큰 파일은 처리 시간이 오래 걸림)
3. 서버 로그 확인
