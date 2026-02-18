// src/app/profile/page.tsx
"use client";
import React, { useEffect, useState } from "react";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  useEffect(() => {
    fetch("/api/me?email=sandro@local").then(r=>r.json()).then(setProfile);
  }, []);
  if (!profile) return <div style={{ padding:20 }}>Lade...</div>;
  const player = profile.player;
  return (
    <main style={{ padding:20 }}>
      <h1>Profil: {profile.name || profile.email}</h1>
      <div>Kontostand: {((player?.cashCents ?? 0)/100).toFixed(2)} USD</div>
      <h2 style={{ marginTop:12 }}>Inventar</h2>
      <ul>
        {player?.inventory?.length ? player.inventory.map((it:any)=><li key={it.id}>{it.catalogId} — erworben: {new Date(it.acquiredAt).toLocaleString()}</li>) : <li>keine Items</li>}
      </ul>
    </main>
  );
}
