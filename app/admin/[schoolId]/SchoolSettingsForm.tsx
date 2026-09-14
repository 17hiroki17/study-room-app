"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSchool } from "../actions";
import type { School } from "@/lib/types";

export default function SchoolSettingsForm({ school }: { school: School }) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateSchool(school.id, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form
      action={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label className="block text-xs font-medium text-slate-600">地域</label>
        <input
          name="region"
          defaultValue={school.region ?? ""}
          placeholder="例: 神奈川県"
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="w-full sm:w-40">
        <label className="block text-xs font-medium text-slate-600">
          自習室の席数上限（ブース数）
        </label>
        <input
          name="seat_capacity"
          type="number"
          min={0}
          defaultValue={school.seat_capacity}
          required
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "保存中..." : "保存"}
      </button>
      {saved && !error && <p className="text-sm text-green-600">保存しました。</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
