// src/components/SubmitButton.jsx
export default function SubmitButton({ onClick, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled} className="submit-btn">
      {children}
    </button>
  );
}
