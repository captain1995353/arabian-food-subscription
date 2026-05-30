"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Pencil, Trash2, Plus, Upload, Loader2 } from "lucide-react";
import {
  saveFoodItem,
  deleteFoodItem,
  toggleFoodActive,
  uploadFoodImage,
  type AdminState,
} from "@/lib/actions/admin";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Message } from "@/components/ui/Toast";
import { formatKRW } from "@/lib/utils";
import { FOOD_CATEGORIES, type FoodItem } from "@/lib/types";

export function FoodManager({ items }: { items: FoodItem[] }) {
  const [editing, setEditing] = useState<FoodItem | "new" | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Food Items</h1>
        <button onClick={() => setEditing("new")} className="btn btn-gold py-2">
          <Plus size={16} /> Add food
        </button>
      </div>

      {editing && (
        <FoodForm
          item={editing === "new" ? null : editing}
          onDone={() => setEditing(null)}
        />
      )}

      <div className="overflow-x-auto rounded-2xl border border-teal/15">
        <table className="w-full text-sm">
          <thead className="bg-bg-secondary text-left text-ink-muted">
            <tr>
              <th className="p-3">Item</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-teal/10">
            {items.map((f) => (
              <tr key={f.id}>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-md bg-bg-surface">
                      {f.image_url && <Image src={f.image_url} alt={f.name} fill className="object-cover" />}
                    </div>
                    <div>
                      <p className="font-medium">{f.name}</p>
                      {f.is_halal && <span className="text-xs text-teal-light">Halal</span>}
                    </div>
                  </div>
                </td>
                <td className="p-3">{f.category}</td>
                <td className="p-3">{formatKRW(f.price)}</td>
                <td className="p-3">{f.available_quantity}</td>
                <td className="p-3">
                  <button
                    onClick={() => start(() => toggleFoodActive(f.id, !f.is_active))}
                    className={`badge ${f.is_active ? "border-teal/40 bg-teal/20 text-teal-light" : "border-ink-muted/30 bg-ink-muted/15 text-ink-muted"}`}
                  >
                    {f.is_active ? "Available" : "Hidden"}
                  </button>
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditing(f)} className="text-ink-muted hover:text-gold"><Pencil size={16} /></button>
                    <button
                      disabled={pending}
                      onClick={() => { if (confirm(`Delete "${f.name}"?`)) start(() => deleteFoodItem(f.id)); }}
                      className="text-ink-muted hover:text-spice"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-ink-muted">No food items yet. Add your first dish.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FoodForm({ item, onDone }: { item: FoodItem | null; onDone: () => void }) {
  const [state, action] = useActionState<AdminState, FormData>(saveFoodItem, {});
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [, startUpload] = useTransition();

  // Close the form once a save succeeds.
  useEffect(() => {
    if (state.success) onDone();
  }, [state.success, onDone]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadErr("");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    startUpload(async () => {
      const res = await uploadFoodImage(fd);
      setUploading(false);
      if (res.error) setUploadErr(res.error);
      else if (res.url) setImageUrl(res.url);
    });
  }

  return (
    <form action={action} className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{item ? "Edit food" : "Add food"}</h2>
        <button type="button" onClick={onDone} className="text-sm text-ink-muted hover:text-gold">Close</button>
      </div>

      {item && <input type="hidden" name="id" defaultValue={item.id} />}
      <input type="hidden" name="image_url" value={imageUrl} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label>Name</label>
          <input name="name" defaultValue={item?.name ?? ""} required />
        </div>
        <div>
          <label>Category</label>
          <select name="category" defaultValue={item?.category ?? "Rice"}>
            {FOOD_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label>Price (₩)</label>
          <input type="number" name="price" min={0} defaultValue={item?.price ?? 0} />
        </div>
        <div>
          <label>Available quantity</label>
          <input type="number" name="available_quantity" min={0} defaultValue={item?.available_quantity ?? 0} />
        </div>
        <div>
          <label>Spicy level (0–5)</label>
          <input type="number" name="spicy_level" min={0} max={5} defaultValue={item?.spicy_level ?? 0} />
        </div>
        <div className="flex items-end gap-6 pb-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="is_halal" defaultChecked={item ? item.is_halal : true} className="h-4 w-4" />
            <span className="!mb-0">Halal</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="is_active" defaultChecked={item ? item.is_active : true} className="h-4 w-4" />
            <span className="!mb-0">Available</span>
          </label>
        </div>
      </div>

      <div>
        <label>Description</label>
        <textarea name="description" rows={2} defaultValue={item?.description ?? ""} />
      </div>

      {/* Image upload */}
      <div>
        <label>Food image</label>
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-lg bg-bg-surface">
            {imageUrl && <Image src={imageUrl} alt="preview" fill className="object-cover" />}
          </div>
          <div>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
            <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-outline py-2 text-sm">
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? "Uploading…" : "Upload image"}
            </button>
            {uploadErr && <p className="input-error">{uploadErr}</p>}
            <p className="mt-1 text-xs text-ink-muted">Or paste a URL below.</p>
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="/images/... or https://..." className="mt-1" />
          </div>
        </div>
      </div>

      {state.error && <Message type="error">{state.error}</Message>}
      <div className="flex gap-2">
        <SubmitButton pendingText="Saving…">{item ? "Save changes" : "Add food"}</SubmitButton>
        <button type="button" onClick={onDone} className="btn btn-outline">Cancel</button>
      </div>
    </form>
  );
}
