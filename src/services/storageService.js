import { storage } from "../firebase/firebase";
import {
  ref,
  uploadString,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

export const storageService = {
  uploadUserToken: async (userId, data) => {
    try {
      const fileRef = ref(storage, `userTokens/${userId}/${Date.now()}.json`);
      await uploadString(fileRef, data);
      return await getDownloadURL(fileRef);
    } catch (error) {
      throw new Error(error.message);
    }
  },

  uploadBaselineToken: async (file) => {
    try {
      const fileRef = ref(storage, `baseline/${file.name}`);
      await uploadBytes(fileRef, file);
      return await getDownloadURL(fileRef);
    } catch (error) {
      throw new Error(error.message);
    }
  },
};
