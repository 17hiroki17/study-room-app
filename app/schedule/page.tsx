import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;

  const supabase = getSupabaseAdmin();

  const { data: schools } = await supabase
    .from("schools")
    .select("id, name")
    .order("name");

  const { data: slots } = await supabase
    .from("time_slots")
    .select("school_id, usage_date, start_time, end_time")
    .order("usage_date");

  if (!date) {
    const dates = [
      ...new Set((slots ?? []).map((slot) => slot.usage_date)),
    ];

    return (
      <div className="mx-auto max-w-xl p-8">
        <h1 className="mb-6 text-2xl font-bold">
          アイリス講義室 開放日一覧
        </h1>

        <div className="flex flex-col gap-3">
          {dates.map((d) => {
            const displayDate = new Date(d);

            const formattedDate = displayDate.toLocaleDateString("ja-JP", {
              month: "numeric",
              day: "numeric",
              weekday: "short",
            });

            return (
              <a
                key={d}
                href={`/schedule?date=${d}`}
                className="rounded border p-4 hover:bg-slate-50"
              >
                {formattedDate}
              </a>
            );
          })}
        </div>
      </div>
    );
  }

  const selectedSlots =
    (slots ?? []).filter((slot) => slot.usage_date === date);

  const startTime = selectedSlots[0]?.start_time;
  const endTime = selectedSlots[0]?.end_time;

  const openSchools = selectedSlots
    .map((slot) =>
      schools?.find((school) => school.id === slot.school_id)
    )
    .filter(Boolean);

  const displayDate = new Date(date);

  const formattedDate = displayDate.toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });

  return (
    <div className="mx-auto max-w-xl p-8">
      <a
        href="/schedule"
        className="mb-4 inline-block text-blue-600 hover:underline"
      >
        ← 一覧へ戻る
      </a>

      <h1 className="mb-6 text-2xl font-bold">
        {formattedDate}
      </h1>

      <div className="mb-6">
        <h2 className="font-semibold">利用時間</h2>
        <p>
          {startTime?.slice(0, 5)} ～ {endTime?.slice(0, 5)}
        </p>
      </div>

      <div className="mb-6 rounded border border-amber-300 bg-amber-50 p-4">
        <h2 className="mb-2 font-semibold">【注意事項】</h2>

        <ul className="list-disc pl-5 space-y-1">
          <li>食事は禁止です。</li>
          <li>印刷を行う場合は、2号館のパソコンをご利用ください。</li>
          <li>施設利用の都合上、閉校時間は21:30です。</li>
          <li>東進衛星予備校 刈谷駅南口校に在籍している生徒のみ利用可能です。</li>
          <li>
            他の利用者の迷惑となる行為やマナー違反があった場合は、今後の利用をお断りする場合があります。
          </li>
        </ul>
      </div>

      <div>
        <h2 className="mb-2 font-semibold">開放教室</h2>

        <ul className="list-disc pl-6">
          {openSchools.map((school) => (
            <li key={school!.id}>
              {school!.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
