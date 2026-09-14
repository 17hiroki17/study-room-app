"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminCancelBooking, type BookingWithSlot } from "../actions";
import { formatTimeRange, formatUsageDate } from "@/lib/format";

export default function BookingsList({
  schoolId,
  bookings,
}: {
  schoolId: string;
  bookings: BookingWithSlot[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const router = useRouter();

  function handleCancel(bookingId: string) {
    setError(null);
    setCancelingId(bookingId);
    startTransition(async () => {
      const result = await adminCancelBooking(schoolId, bookingId);
      setCancelingId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (bookings.length === 0) {
    return <p className="text-sm text-slate-500">まだ予約はありません。</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">使用日時</th>
              <th className="px-3 py-2">ブース</th>
              <th className="px-3 py-2">氏名</th>
              <th className="px-3 py-2">生徒番号</th>
              <th className="px-3 py-2">状態</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-t border-slate-100">
                <td className="px-3 py-2">
                  {booking.time_slots
                    ? `${formatUsageDate(booking.time_slots.usage_date)} ${formatTimeRange(
                        booking.time_slots.start_time,
                        booking.time_slots.end_time
                      )}`
                    : "不明"}
                </td>
                <td className="px-3 py-2">{booking.seat_number}</td>
                <td className="px-3 py-2">{booking.student_name}</td>
                <td className="px-3 py-2">{booking.student_number}</td>
                <td className="px-3 py-2">
                  {booking.status === "active" ? (
                    <span className="text-green-600">予約中</span>
                  ) : (
                    <span className="text-slate-400">キャンセル済み</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  {booking.status === "active" && (
                    <button
                      onClick={() => handleCancel(booking.id)}
                      disabled={isPending && cancelingId === booking.id}
                      className="text-xs text-red-600 hover:underline disabled:opacity-50"
                    >
                      キャンセルする
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
