// src/app/shop/page.tsx
"use client";

import React, { useEffect, useState } from "react";

type Item = {
  id: string;
  name: string;
  category: string;
  basePriceCents: number;
  imageUrl?: string | null;
};

export default function ShopPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedQty, setSelectedQty] = useState<number>(1);

  useEffect(() => {
    load();
    loadBalance();
  }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/shop");
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }

  async function loadBalance() {
    const res = await fetch("/api/me?email=sandro@local");
    const data = await res.json();
    const bal = data?.player?.cashCents ?? null;
    setBalance(bal);
  }

  function openBuyModal(item: Item) {
    setSelectedItem(item);
    setSelectedQty(1);
  }

  async function confirmBuy() {
    if (!selectedItem) return;
    setMsg(null);
    try {
      const res = await fetch("/api/shop/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "sandro@local", itemId: selectedItem.id, quantity: selectedQty })
      });
      const data = await res.json();
      if (!res.ok) { setMsg("Fehler: " + (data.error || "Kauf fehlgeschlagen")); return; }
      setMsg(`Gekauft: ${data.message} — neue Balance: ${(data.newBalance/100).toFixed(2)} USD`);
      setSelectedItem(null);
      await load();
      await loadBalance();
    } catch (err: any) {
      setMsg("Fehler: " + (err.message || String(err)));
    }
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>Shop</h1>
      <div style={{ marginBottom: 10, color: "#444" }}>
        Kontostand: {balance === null ? "lade..." : (balance/100).toFixed(2) + " USD"}
      </div>
      {msg && <div style={{ marginBottom: 12 }}>{msg}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
        {loading && <div>Lädt...</div>}
        {items.map(it => (
          <div key={it.id} style={{ border: "1px solid #eee", padding: 12, borderRadius: 8 }}>
            <div style={{ minHeight: 80 }}>
              <strong>{it.name}</strong>
              <div style={{ color: "#666", marginTop: 6 }}>{it.category}</div>
            </div>
            <div style={{ marginTop: 8 }}>
              <div>Preis: {(it.basePriceCents/100).toFixed(2)} USD</div>
              <button style={{ marginTop: 8 }} onClick={() => openBuyModal(it)}>Kaufen</button>
            </div>
          </div>
        ))}
        {items.length === 0 && !loading && <div>keine Artikel im Shop</div>}
      </div>

      {selectedItem && (
        <div style={{ position: "fixed", left:0, top:0, right:0, bottom:0, background: "rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:"#fff", padding:20, borderRadius:8, minWidth:320 }}>
            <h3>Kaufe {selectedItem.name}</h3>
            <div>
              Menge: <input type="number" min={1} value={selectedQty} onChange={(e)=>setSelectedQty(Number(e.target.value))} />
            </div>
            <div style={{ marginTop:12 }}>
              <button onClick={confirmBuy}>Bestätigen</button>
              <button onClick={()=>setSelectedItem(null)} style={{ marginLeft:8 }}>Abbruch</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}