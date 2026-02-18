// src/app/admin/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type Item = {
  id: string;
  name: string;
  category: string;
  basePriceCents: number;
  imageUrl?: string | null;
  meta?: any;
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<Item>>({ name: "", category: "misc", basePriceCents: 0, imageUrl: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") fetchItems();
  }, [status]);

  async function fetchItems() {
    setLoading(true);
    const res = await fetch("/api/admin/items");
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }

  function resetForm() {
    setEditingId(null);
    setForm({ name: "", category: "misc", basePriceCents: 0, imageUrl: "" });
  }

  async function handleCreate(e?: React.FormEvent) {
    e?.preventDefault();
    setMessage(null);
    try {
      const payload = { name: String(form.name || "").trim(), category: String(form.category || "misc").trim(), basePriceCents: Number(form.basePriceCents || 0), imageUrl: form.imageUrl || null };
      const res = await fetch("/api/admin/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Create failed");
      setMessage("Item created");
      await fetchItems();
      resetForm();
    } catch (err: any) {
      setMessage("Error: " + (err.message || String(err)));
    }
  }

  async function handleSelectEdit(item: Item) {
    setEditingId(item.id);
    setForm({ name: item.name, category: item.category, basePriceCents: item.basePriceCents, imageUrl: item.imageUrl ?? "" });
  }

  async function handleUpdate(e?: React.FormEvent) {
    e?.preventDefault();
    if (!editingId) return;
    setMessage(null);
    try {
      const payload = { id: editingId, name: String(form.name || "").trim(), category: String(form.category || "misc").trim(), basePriceCents: Number(form.basePriceCents || 0), imageUrl: form.imageUrl || null };
      const res = await fetch("/api/admin/items", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Update failed");
      setMessage("Item updated");
      await fetchItems();
      resetForm();
    } catch (err: any) {
      setMessage("Error: " + (err.message || String(err)));
    }
  }

  if (status === "loading") return <div style={{ padding: 20 }}>Loading...</div>;
  if (!session || !(session as any).user?.isAdmin) return <main style={{ padding: 20 }}><h1>Unauthorized</h1><p>Du benötigst Admin-Rechte.</p></main>;

  return (
    <main style={{ padding: 20 }}>
      <h1>Admin – Items verwalten</h1>
      <p style={{ color: "#666" }}>Erstelle oder ändere Asset-Katalogeinträge (geschützt).</p>

      <section style={{ display: "flex", gap: 20, marginTop: 16 }}>
        <div style={{ flex: 1 }}>
          <h2>{editingId ? "Bearbeite Item" : "Neues Item anlegen"}</h2>
          <form onSubmit={editingId ? handleUpdate : handleCreate} style={{ display: "grid", gap: 8, maxWidth: 560 }}>
            <label>
              Name
              <input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label>
              Kategorie
              <input value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </label>
            <label>
              Preis (Cents)
              <input type="number" value={form.basePriceCents ?? 0} onChange={(e) => setForm({ ...form, basePriceCents: Number(e.target.value) })} />
            </label>
            <label>
              Image URL
              <input value={form.imageUrl || ""} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
            </label>

            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit">{editingId ? "Update" : "Erstellen"}</button>
              <button type="button" onClick={resetForm}>Reset</button>
            </div>
          </form>
          {message && <div style={{ marginTop: 8, color: "#333" }}>{message}</div>}
        </div>

        <div style={{ flex: 1 }}>
          <h2>Bestehende Items {loading ? "(laden...)" : ""}</h2>
          <div style={{ display: "grid", gap: 8 }}>
            {items.map(it => (
              <div key={it.id} style={{ border: "1px solid #eee", padding: 8, borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{it.name}</strong> <span style={{ color: "#666" }}>({it.category})</span>
                  <div style={{ fontSize: 12, color: "#444" }}>{(it.basePriceCents/100).toFixed(2)} USD</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => handleSelectEdit(it)}>Edit</button>
                </div>
              </div>
            ))}
            {items.length === 0 && <div style={{ color: "#999" }}>keine Items</div>}
          </div>
        </div>
      </section>
    </main>
  );
}
