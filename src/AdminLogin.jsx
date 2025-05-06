import { useState } from "react";

function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === "admin123") {
      onLogin();
    } else {
      alert("Incorrect password");
    }
  };

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h2>Admin Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Enter admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: "10px", fontSize: "16px", width: "250px" }}
        />
        <br /><br />
        <button type="submit" style={{ padding: "10px 20px" }}>
          Login
        </button>
      </form>
    </div>
  );
}

export default AdminLogin;
