"use client";

import { useState, useTransition } from "react";
import { cancelBookingByToken } from "../actions";

export default function CancelButton({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelBookingByToken(token);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return <p className="text-sm font-semibold text-green-600">予約をキャンセルしました。</p>;
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
      >
        この予約をキャンセルする
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-slate-700">本当にキャンセルしますか？この操作は元に戻せません。</p>
      <div className="flex gap-2">
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {isPending ? "処理中..." : "はい、キャンセルする"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="rounded border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
        >
          やめる
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
