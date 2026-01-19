"use client";

import React, { useState } from "react";
import { useSocket } from "../context/SocketContext";
import "./Login.css";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import welcomeimg from "@/public/welcomeback.svg";

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
      console.log('accessToken', data.data.accessToken);
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
    <div className='main-login'>
      <div className="login-contain">
        <div className="left-side">
          <div className="welcomeNote">
            <h3>Welcome Back!</h3>
          </div>
          <form onSubmit={handleSubmit} name='signin_form'>
            <input
              type='text'
              value={email}
              required
              placeholder="E-mail"
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type='password'
              value={password}
              required
              placeholder="Enter your password"
              onChange={(e) => setPassword(e.target.value)} />

            <button type="submit" className="sub_butt">
              <span> {loading ? "Logining up..." : "Login"} </span>
            </button>
            <p className="span">
              Don't have an account?
              <Link href="/sign-up">Sign up</Link>
            </p>
          </form>
        </div>
        <div className="right-side">
          <div className="welcomeImg">
            <Image
              src={welcomeimg}
              id='wel-img-id'
              alt="Welcome back"
              width={400}
              height={300}
              style={{ width: '100%', height: 'auto' }}
              priority
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
