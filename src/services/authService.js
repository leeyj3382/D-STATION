import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase/firebase";

export const authService = {
  async sendVerificationCode(email) {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const response = await fetch(
        "https://us-central1-d-station-ef28b.cloudfunctions.net/sendVerificationCode",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: cleanEmail }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "이메일 전송 실패");
      }

      return await response.json();
    } catch (error) {
      throw new Error(error.message || "이메일 전송 실패");
    }
  },

  async verifyCode(email, code) {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const response = await fetch(
        "https://us-central1-d-station-ef28b.cloudfunctions.net/verifyCode",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: cleanEmail, code }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "인증번호 확인 실패");
      }

      return await response.json();
    } catch (error) {
      throw new Error(error.message || "인증번호 확인 실패");
    }
  },

  async signup(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      return userCredential.user;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return userCredential.user;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  async logout() {
    try {
      await signOut(auth);
    } catch (error) {
      throw new Error(error.message);
    }
  },

  getCurrentUser: () => {
    return auth.currentUser;
  },
};
