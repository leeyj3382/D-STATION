# pip install fastapi uvicorn torchvision pillow
import io, torch
import torch.nn as nn
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from torchvision import models, transforms
from PIL import Image
import requests
from typing import Dict, List
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------- 1. DISTS 모델 정의 ----------
class DISTS(nn.Module):
    def __init__(self):
        super().__init__()
        vgg = models.vgg16(weights=models.VGG16_Weights.DEFAULT).features
        self.stage = nn.ModuleList([
            nn.Sequential(*vgg[:4]),   # 64
            nn.Sequential(*vgg[4:9]),  # 128
            nn.Sequential(*vgg[9:16]), # 256
            nn.Sequential(*vgg[16:23]),# 512
            nn.Sequential(*vgg[23:30]) # 512
        ])
        self.alpha = nn.Parameter(torch.ones(5))
        self.beta  = nn.Parameter(torch.ones(5))
        self.register_buffer("mean", torch.tensor([0.485,0.456,0.406])[None,:,None,None])
        self.register_buffer("std" , torch.tensor([0.229,0.224,0.225])[None,:,None,None])

    def _feats(self, x):
        x = (x - self.mean)/self.std
        feats = []
        for s in self.stage: 
            x = s(x); feats.append(x)
        return feats

    def forward(self, x, y):
        fx, fy, dist = self._feats(x), self._feats(y), 0
        for i in range(5):
            mx, my = fx[i].mean([2,3]), fy[i].mean([2,3])
            vx = ((fx[i]-mx[:,:,None,None])**2).mean([2,3])
            vy = ((fy[i]-my[:,:,None,None])**2).mean([2,3])
            dist += self.alpha[i]*((mx-my)**2).mean() + \
                    self.beta[i]*((vx.sqrt()-vy.sqrt())**2).mean()
        return dist

# ---------- 2. 전역 객체 ----------
device  = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model   = DISTS().to(device).eval()
trans   = transforms.Compose([transforms.Resize((224,224)), transforms.ToTensor()])

# 기준 이미지 로드 (기본값으로 빈 이미지 사용)
try:
    REF_IMG = trans(Image.open('reference.png').convert('RGB')).unsqueeze(0).to(device)
    logger.info("기준 이미지 로드 완료")
except FileNotFoundError:
    # 기준 이미지가 없으면 빈 이미지 생성
    empty_img = Image.new('RGB', (224, 224), color='white')
    REF_IMG = trans(empty_img).unsqueeze(0).to(device)
    logger.warning("기준 이미지가 없어 빈 이미지를 사용합니다")

# ---------- 3. 유틸 함수 ----------
def patches(t, g=8):
    B,C,H,W = t.shape
    ph, pw  = H//g, W//g
    return [t[:,:,i*ph:(i+1)*ph,j*pw:(j+1)*pw] for i in range(g) for j in range(g)]

@torch.inference_mode()
def similarity(img_bytes, grid=8, d_min=0.0, d_max=24.0):
    try:
        q = trans(Image.open(io.BytesIO(img_bytes)).convert('RGB')).unsqueeze(0).to(device)
        ps_ref, ps_q = patches(REF_IMG, grid), patches(q, grid)
        dist = sum(model(a,b).item() for a,b in zip(ps_ref, ps_q)) / len(ps_ref)
        score = max(0, min(100, (d_max - dist)/(d_max - d_min)*100))
        logger.info(f"DISTS={dist:.4f} → Similarity={score:.2f}")
        return round(score, 2)
    except Exception as e:
        logger.error(f"이미지 처리 중 오류: {e}")
        raise HTTPException(status_code=400, detail=f"이미지 처리 실패: {str(e)}")

def url_to_image(url: str):
    """URL에서 이미지를 다운로드하여 바이트로 반환"""
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.content
    except Exception as e:
        logger.error(f"이미지 다운로드 실패 ({url}): {e}")
        raise HTTPException(status_code=400, detail=f"이미지 다운로드 실패: {str(e)}")

# ---------- 4. FastAPI 앱 설정 ----------
app = FastAPI(title="DISTS Image Similarity API", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- 5. API 엔드포인트 ----------

@app.get("/")
async def root():
    return {"message": "DISTS Image Similarity API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "device": str(device)}

@app.post("/evaluate")
async def evaluate(file: UploadFile = File(...)):
    """파일 업로드를 통한 이미지 유사도 평가"""
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="이미지 파일만 업로드 가능합니다")
    
    try:
        img_bytes = await file.read()
        score = similarity(img_bytes)
        return {"similarity_score": score, "filename": file.filename}
    except Exception as e:
        logger.error(f"파일 평가 중 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/evaluate-url")
async def evaluate_url(image_url: str):
    """URL을 통한 이미지 유사도 평가"""
    try:
        img_bytes = url_to_image(image_url)
        score = similarity(img_bytes)
        return {"similarity_score": score, "url": image_url}
    except Exception as e:
        logger.error(f"URL 평가 중 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/batch-evaluate")
async def batch_evaluate(image_urls: Dict[str, str]):
    """여러 이미지 URL의 배치 유사도 평가"""
    try:
        results = {}
        for token_id, url in image_urls.items():
            try:
                img_bytes = url_to_image(url)
                score = similarity(img_bytes)
                results[token_id] = score
                logger.info(f"토큰 {token_id} 평가 완료: {score}")
            except Exception as e:
                logger.error(f"토큰 {token_id} 평가 실패: {e}")
                results[token_id] = None
        
        return {"scores": results}
    except Exception as e:
        logger.error(f"배치 평가 중 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/update-reference")
async def update_reference(file: UploadFile = File(...)):
    """기준 이미지 업데이트"""
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="이미지 파일만 업로드 가능합니다")
    
    try:
        global REF_IMG
        img_bytes = await file.read()
        REF_IMG = trans(Image.open(io.BytesIO(img_bytes)).convert('RGB')).unsqueeze(0).to(device)
        logger.info("기준 이미지 업데이트 완료")
        return {"message": "기준 이미지가 성공적으로 업데이트되었습니다"}
    except Exception as e:
        logger.error(f"기준 이미지 업데이트 중 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 