// AdminLogin.jsx
import { useState } from "react";
// Import the new CSS file for AdminLogin
import "./AdminLogin.css";

function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // IMPORTANT: Hardcoding passwords like this is INSECURE.
    // For a real application, you should use Firebase Authentication
    // with email/password, Google Sign-In, etc., or a secure backend.
    if (password === "admin123") {
      onLogin();
    } else {
      alert("Incorrect password");
    }
  };

  return (
    // Added a className to the main div
    <div className="admin-login-container">
      <h2>Admin Login</h2>
      <form onSubmit={handleSubmit} className="admin-login-form">
        <input
          type="password"
          placeholder="Enter admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          // Added a className to the input
          className="admin-login-input"
        />
        {/* Removed the br tags, margin/padding will handle spacing in CSS */}
        <button type="submit" className="admin-login-button">
          Login
        </button>
      </form>
    </div>
  );
}

export default AdminLogin;
