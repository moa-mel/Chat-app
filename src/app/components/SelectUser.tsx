"use client";

import { useState } from "react";
import styles from "./SelectUser.module.css";
import { useRouter } from "next/navigation";

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

      const conversationId = result.data.conversationId;

      localStorage.setItem("conversationId", conversationId);

      router.push(`/chat/${conversationId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Start a Chat</h1>
      <form onSubmit={startChat}>

        <input
          type="number"
          placeholder="Enter User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Starting..." : "Start Chat"}
        </button>
      </form>
    </div>
  );
}
