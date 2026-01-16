"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./SelectUser.module.css";

export default function SelectUser() {
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const startChat = async () => {
    if (!userId) return;

    const token = localStorage.getItem("accessToken");

    if (!token) {
      setError("You are not logged in. Please login again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        "https://lai-chat.onrender.com/api/v1/chat/start",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: Number(userId) }),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to start chat");
      }

      console.log('Chat start response:', result);

      if (!result.data || !result.data.id) {
        throw new Error("Invalid response from server: missing conversation ID");
      }

      const conversationId = result.data.id;
      console.log('Extracted conversationId:', conversationId);

      localStorage.setItem("conversationId", conversationId);

      router.push(`/chat/${conversationId}`);
    } catch (err: any) {
      console.error('Error starting chat:', err);
      setError(err.message || "Failed to start chat. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <h2 className={styles.title}>Start a New Chat</h2>
        <form onSubmit={(e) => { e.preventDefault(); startChat(); }}>
          <input
            type="number"
            placeholder="Enter User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            className={styles.input}
          />

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className={styles.button}
          >
            {loading ? 'Starting...' : 'Start Chat'}
          </button>

        </form>
      </div>
    </div>
  );
}
