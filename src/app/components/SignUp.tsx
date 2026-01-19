"use client";

import React, { useState } from "react";
import "./Login.css";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import welcomeimg from "@/public/welcomeback.svg";

const SignUp: React.FC = () => {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
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
                "https://lai-chat.onrender.com/api/v1/auth/signup",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        firstName,
                        lastName,
                        email,
                        password,
                    }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Signup failed");
            }

            // Redirect after signup
            router.push("/select-user");
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='main-login'>
            <div className="login-contain">
                <div className="left-side">
                    <div className="welcomeNote">
                        <h3>Sign Up to hop on a chat 😉</h3>
                    </div>
                    <form onSubmit={handleSubmit} name='signin_form'>
                        <input
                            type="text"
                            placeholder="First Name"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                        />

                        <input
                            type="text"
                            placeholder="Last Name"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                        />

                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <button type="submit" className="sub_butt">
                            <span> {loading ? "Signing up..." : "Sign Up"} </span>
                        </button>
                        <p className="span">
                            Already  have an account?
                            <Link href="/login">Login</Link>
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

export default SignUp;
