import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import "./ProfileAuth.css";

export default function ProfileAuth() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Enter email & password");
      return;
    }

    try {
      setLoading(true);

      const res = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // ✅ STORE PATIENT PROFILE
      localStorage.setItem(
        "patientProfile",
        JSON.stringify({
          uid: res.user.uid,
          email: res.user.email,
          name: res.user.email.split("@")[0],
          age: "-",
          gender: "-",
          phone: "-",
        })
      );

      navigate("/patient-profile");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-auth">
      <div className="auth-card">
        <h2>👤 Patient Login</h2>

        <input
          type="email"
          placeholder="Patient Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="login-btn"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login →"}
        </button>
      </div>
    </div>
  );
}