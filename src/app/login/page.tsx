// src/app/login/page.tsx
"use client";
import React, { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const router = useRouter();

  if (session) {
    return (
      <main style={{ padding: 20 }}>
        <h2>Angemeldet als {session.user?.email}</h2>
        <button onClick={() => signOut()}>Logout</button>
        <div style={{ marginTop: 12 }}>
          <button onClick={() => router.push("/admin")}>Zum Admin</button>
          <button onClick={() => router.push("/shop")}>Zum Shop</button>
          <button onClick={() => router.push("/profile")}>Zum Profil</button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>Login (dev)</h1>
      <form onSubmit={(e) => { e.preventDefault(); signIn("credentials", { email, callbackUrl: "/" }); }}>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sandro@local" />
        </label>
        <div style={{ marginTop: 8 }}>
          <button type="submit">Login</button>
        </div>
      </form>
      <p style={{ color: "#666", marginTop: 12 }}>Dev-Login: jede Email erlaubt. Use seed user sandro@local (Admin).</p>
    </main>
  );
}
