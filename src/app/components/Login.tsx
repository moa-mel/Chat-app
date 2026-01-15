"use client";

import React, { useState } from "react";
import { useSocket } from "../context/SocketContext";
import styles from "./Login.module.css";
import { useRouter } from "next/navigation";
import Link from "next/link";

const Login: React.FC = () => {
   const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        "https://lai-chat.onrender.com/api/v1/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Login failed");
      }

      const data = await res.json();

      // Store token and user info
      localStorage.setItem("accessToken", data.data.accessToken);
      console.log('accessToken',data.data.accessToken);
      localStorage.setItem("userId", String(data.data.meta.id));
      localStorage.setItem("userEmail", data.data.meta.email);

      // Navigate to user selection or chat
      router.push("/select-user"); // or wherever you select who to chat with
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <h1>Login to Chat 👋</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
        <p>Don't have an account? <Link href="/sign-up">Sign Up</Link></p>
      </form>
    </div>
  );
};

export default Login;
