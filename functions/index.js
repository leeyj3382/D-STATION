const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
admin.initializeApp();
const db = admin.firestore();

// 인증번호 저장을 위한 임시 저장소
const verificationCodes = new Map();

// 이메일 전송을 위한 transporter 설정
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: functions.config().gmail.user,
    pass: functions.config().gmail.password,
  },
});

// 인증번호 생성 함수
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 인증번호 전송 함수
exports.sendVerificationCode = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const email = (req.body.email || "").trim().toLowerCase();
      if (!email)
        return res.status(400).json({ error: "이메일이 필요합니다." });

      const code = generateVerificationCode();

      await db.collection("emailVerifications").doc(email).set({
        code,
        timestamp: Date.now(),
      });

      // 이메일 전송
      const mailOptions = {
        from: functions.config().gmail.user,
        to: email,
        subject: "D:STATION 이메일 인증",
        html: `<h1>D:STATION 이메일 인증</h1>
               <p>아래의 인증번호를 입력해주세요:</p>
               <h2>${code}</h2>
               <p>이 인증번호는 5분간 유효합니다.</p>`,
      };

      await transporter.sendMail(mailOptions);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("이메일 전송 실패:", error);
      res.status(500).json({ error: "이메일 전송 실패" });
    }
  });
});

// 인증번호 확인 함수
exports.verifyCode = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const email = (req.body.email || "").trim().toLowerCase();
      const code = req.body.code;
      if (!email || !code)
        return res
          .status(400)
          .json({ error: "이메일과 인증번호가 필요합니다." });

      const doc = await db.collection("emailVerifications").doc(email).get();
      if (!doc.exists)
        return res.status(404).json({ error: "인증번호를 찾을 수 없습니다." });

      const data = doc.data();
      if (Date.now() - data.timestamp > 5 * 60 * 1000) {
        await db.collection("emailVerifications").doc(email).delete();
        return res.status(400).json({ error: "인증번호가 만료되었습니다." });
      }

      if (data.code !== code) {
        return res.status(400).json({ error: "잘못된 인증번호입니다." });
      }

      // 인증 성공 시 삭제
      await db.collection("emailVerifications").doc(email).delete();
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("인증 확인 실패:", error);
      res.status(500).json({ error: "인증 확인 실패" });
    }
  });
});
