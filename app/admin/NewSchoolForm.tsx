"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSchool } from "./actions";

export default function NewSchoolForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createSchool(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
      router.refresh();
    });
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label className="block text-xs font-medium text-slate-600">校舎名</label>
        <input
          name="name"
          required
          placeholder="例: 東戸塚校"
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex-1">
        <label className="block text-xs font-medium text-slate-600">地域（任意）</label>
        <input
          name="region"
          placeholder="例: 神奈川県"
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="w-full sm:w-32">
        <label className="block text-xs font-medium text-slate-600">席数上限</label>
        <input
          name="seat_capacity"
          type="number"
          min={0}
          defaultValue={0}
          required
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isPending ? "登録中..." : "校舎を追加"}
      </button>
      {error && <p className="w-full text-sm text-red-600 sm:basis-full">{error}</p>}
    </form>
  );
}
