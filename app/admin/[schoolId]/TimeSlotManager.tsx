"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTimeSlots, deleteTimeSlot } from "../actions";
import { formatTimeRange, formatUsageDate, todayDateStringJST } from "@/lib/format";
import type { TimeSlot } from "@/lib/types";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export default function TimeSlotManager({
  schoolId,
  timeSlots,
}: {
  schoolId: string;
  timeSlots: TimeSlot[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();
  const today = todayDateStringJST();

  function handleCreate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createTimeSlots(schoolId, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleDelete(timeSlotId: string) {
    setError(null);
    setDeletingId(timeSlotId);
    startTransition(async () => {
      const result = await deleteTimeSlot(schoolId, timeSlotId);
      setDeletingId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const upcoming = timeSlots.filter((slot) => slot.usage_date >= today);
  const past = timeSlots.filter((slot) => slot.usage_date < today);

  return (
    <div className="flex flex-col gap-4">
      <form
        action={handleCreate}
        className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      >
        <p className="text-xs font-semibold text-slate-600">使用日時を追加</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className="block text-xs text-slate-600">開始日</label>
            <input
              type="date"
              name="start_date"
              required
              defaultValue={today}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600">終了日（任意・連続登録用）</label>
            <input
              type="date"
              name="end_date"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600">開始時刻</label>
            <input
              type="time"
              name="start_time"
              required
              defaultValue="09:00"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600">終了時刻</label>
            <input
              type="time"
              name="end_time"
              required
              defaultValue="21:00"
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs text-slate-600">
            対象曜日（未選択の場合は期間内すべての日を登録します）
          </p>
          <div className="flex flex-wrap gap-3">
            {WEEKDAY_LABELS.map((label, i) => (
              <label key={i} className="flex items-center gap-1 text-sm">
                <input type="checkbox" name={`weekday_${i}`} />
                {label}
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-fit rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "登録中..." : "この内容で登録する"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      <div>
        <p className="mb-2 text-xs font-semibold text-slate-600">
          登録済みの使用日時（今後）
        </p>
        {upcoming.length === 0 && (
          <p className="text-sm text-slate-500">登録されている使用日時はありません。</p>
        )}
        <ul className="flex flex-col gap-1">
          {upcoming.map((slot) => (
            <li
              key={slot.id}
              className="flex items-center justify-between rounded border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <span>
                {formatUsageDate(slot.usage_date)} {formatTimeRange(slot.start_time, slot.end_time)}
              </span>
              <button
                onClick={() => handleDelete(slot.id)}
                disabled={isPending && deletingId === slot.id}
                className="text-xs text-red-600 hover:underline disabled:opacity-50"
              >
                削除
              </button>
            </li>
          ))}
        </ul>

        {past.length > 0 && (
          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-slate-500">
              過去の使用日時（{past.length}件）
            </summary>
            <ul className="mt-2 flex flex-col gap-1">
              {past.map((slot) => (
                <li
                  key={slot.id}
                  className="flex items-center justify-between rounded border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500"
                >
                  <span>
                    {formatUsageDate(slot.usage_date)}{" "}
                    {formatTimeRange(slot.start_time, slot.end_time)}
                  </span>
                  <button
                    onClick={() => handleDelete(slot.id)}
                    disabled={isPending && deletingId === slot.id}
                    className="text-xs text-red-600 hover:underline disabled:opacity-50"
                  >
                    削除
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}
