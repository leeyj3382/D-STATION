// src/components/AdminUploadForm.jsx
import { useState } from "react";
import { storageService } from "../services/storageService";
import { firestoreService } from "../services/firestoreService";

export default function AdminUploadForm() {
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    try {
      const url = await storageService.uploadBaselineToken(file);
      await firestoreService.addBaselineToken(url);
      alert("Baseline token uploaded");
      setFile(null);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="admin-upload-form">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button type="submit" disabled={!file}>
        Upload
      </button>
    </form>
  );
}
