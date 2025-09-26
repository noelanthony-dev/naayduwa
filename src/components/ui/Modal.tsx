"use client";
import React from "react";
export default function Modal({
  open,
  onClose,
  children,
}: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-bg-card p-5 shadow-soft border border-white/10"
           onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}