import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookingByToken } from "../actions";
import { formatTimeRange, formatUsageDate } from "@/lib/format";
import CancelButton from "./CancelButton";

export const dynamic = "force-dynamic";

export default async function CancelPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const booking = await getBookingByToken(token);
  if (!booking) notFound();

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-8">
      <h1 className="text-lg font-bold">予約の確認・キャンセル</h1>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <dl className="flex flex-col gap-2 text-sm">
          <Row label="校舎" value={booking.school_name} />
          <Row
            label="使用日時"
            value={
              booking.usage_date
                ? `${formatUsageDate(booking.usage_date)} ${formatTimeRange(
                    booking.start_time,
                    booking.end_time
                  )}`
                : "不明"
            }
          />
          <Row label="ブース番号" value={String(booking.seat_number)} />
          <Row label="氏名" value={booking.student_name} />
          <Row label="生徒番号" value={booking.student_number} />
          <Row
            label="状態"
            value={booking.status === "active" ? "予約中" : "キャンセル済み"}
          />
        </dl>
      </div>

      {booking.status === "active" ? (
        <CancelButton token={token} />
      ) : (
        <p className="text-sm text-slate-500">この予約は既にキャンセルされています。</p>
      )}

      <Link href="/reserve" className="text-sm text-blue-600 hover:underline">
        予約画面に戻る
      </Link>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
