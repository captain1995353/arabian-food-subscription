"use client";

import { useRef, useState, useTransition } from "react";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";
import { uploadReceipt } from "@/lib/actions/receipt";

export function ReceiptUpload({
  subscriptionId,
  current,
  paid,
}: {
  subscriptionId: string;
  current: string | null;
  paid: boolean;
}) {
  const [url, setUrl] = useState(current);
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const ref = useRef<HTMLInputElement>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr("");
    const fd = new FormData();
    fd.append("file", file);
    start(async () => {
      try {
        const res = await uploadReceipt(subscriptionId, fd);
        if (res.error) setErr(res.error);
        else if (res.url) setUrl(res.url);
      } catch {
        setErr("Upload failed. Please try again.");
      }
    });
  }

  if (paid) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-teal-light">
        <CheckCircle2 size={16} /> Payment confirmed
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input ref={ref} type="file" onChange={onFile} className="hidden" />
      <button onClick={() => ref.current?.click()} disabled={pending} className="btn btn-outline py-2 text-sm">
        {pending ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        {pending ? "Uploading…" : url ? "Replace receipt" : "Submit payment receipt"}
      </button>
      {url && (
        <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-teal-light">
          <CheckCircle2 size={16} /> Receipt submitted — view
        </a>
      )}
      {err && <span className="text-sm text-spice">{err}</span>}
    </div>
  );
}
