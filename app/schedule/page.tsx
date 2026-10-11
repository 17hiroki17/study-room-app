import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;

  const supabase = getSupabaseAdmin();

  // 日本時間で今日の日付を取得
  const tokyoParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const yearPart = tokyoParts.find((part) => part.type === "year")?.value;
  const monthPart = tokyoParts.find((part) => part.type === "month")?.value;
  const dayPart = tokyoParts.find((part) => part.type === "day")?.value;

  const today = `${yearPart}-${monthPart}-${dayPart}`;

  const { data: schools } = await supabase
    .from("schools")
    .select("id, name")
    .order("name");

  const { data: slots } = await supabase
    .from("time_slots")
    .select("school_id, usage_date, start_time, end_time")
    .gte("usage_date", today)
    .order("usage_date");

  // 日付を「10月11日（日）」の形式にする
  const formatJapaneseDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number);

    return new Date(year, month - 1, day).toLocaleDateString("ja-JP", {
      month: "numeric",
      day: "numeric",
      weekday: "short",
    });
  };

  // 日付一覧画面
  if (!date) {
    const dates = [
      ...new Set((slots ?? []).map((slot) => slot.usage_date)),
    ];

    return (
      <div className="mx-auto max-w-xl p-5 sm:p-8">
        <h1 className="mb-6 text-2xl font-bold">
          アイリス講義室 開放日一覧
        </h1>

        {dates.length === 0 ? (
          <p className="rounded-xl border bg-slate-50 p-5 text-slate-600">
            現在、開放予定日はありません。
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {dates.map((d) => {
              const formattedDate = formatJapaneseDate(d);

              return (
                <a
                  key={d}
                  href={`/schedule?date=${d}`}
                  className="group flex touch-manipulation items-center justify-between rounded-xl border-2 border-slate-200 bg-white p-4 shadow-sm transition-all duration-150 hover:border-blue-400 hover:bg-blue-50 active:scale-[0.97] active:border-blue-500 active:bg-blue-100 active:shadow-inner focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-3 text-blue-700 transition-colors group-hover:bg-blue-200 group-active:bg-blue-200">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="4" width="18" height="17" rx="2" />
                        <path d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                    </div>

                    <div>
                      <div className="text-lg font-bold text-slate-800 transition-colors group-hover:text-blue-700 group-active:text-blue-700">
                        {formattedDate}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        開放教室を確認する
                      </div>
                    </div>
                  </div>

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-600"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </a>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // 過去の日付を直接開いた場合は表示しない
  if (date < today) {
    return (
      <div className="mx-auto max-w-xl p-5 sm:p-8">
        <a
          href="/schedule"
          className="mb-4 inline-block rounded-lg px-3 py-2 text-blue-600 transition-colors active:bg-blue-100 hover:underline"
        >
          ← 一覧へ戻る
        </a>

        <p className="rounded-xl border bg-slate-50 p-5 text-slate-600">
          この日付は過去の日付のため、表示できません。
        </p>
      </div>
    );
  }

  // 選択した日の開放教室を取得
  const selectedSlots = (slots ?? []).filter(
    (slot) => slot.usage_date === date
  );

  const startTime = selectedSlots[0]?.start_time;
  const endTime = selectedSlots[0]?.end_time;

  const openSchools = selectedSlots
    .map((slot) =>
      schools?.find((school) => school.id === slot.school_id)
    )
    .filter(Boolean);

  const formattedDate = formatJapaneseDate(date);

  // 日付の詳細画面
  return (
    <div className="mx-auto max-w-xl p-5 sm:p-8">
      <a
        href="/schedule"
        className="mb-4 inline-block rounded-lg px-3 py-2 text-blue-600 transition-colors active:bg-blue-100 hover:underline"
      >
        ← 一覧へ戻る
      </a>

      <h1 className="mb-6 text-2xl font-bold">
        {formattedDate}
      </h1>

      <div className="mb-6 rounded-xl border p-4">
        <h2 className="mb-2 font-semibold">利用時間</h2>
        <p className="text-lg">
          {startTime?.slice(0, 5)} ～ {endTime?.slice(0, 5)}
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4">
        <h2 className="mb-2 font-semibold">【注意事項】</h2>

        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
          <li>食事は禁止です。</li>
          <li>印刷を行う場合は、2号館のパソコンをご利用ください。</li>
          <li>施設利用の都合上、閉校時間は21:30です。</li>
          <li>
            東進衛星予備校 刈谷駅南口校に在籍している生徒のみ利用可能です。
          </li>
          <li>
            利用可能な教室は日によって異なります。必ず開放教室をご確認のうえ、ご利用ください。
          </li>
          <li>
            他の利用者の迷惑となる行為やマナー違反があった場合は、今後の利用をお断りする場合があります。
          </li>
        </ul>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-bold text-blue-700">
          開放教室
        </h2>

        <div className="flex flex-col gap-4">
          {openSchools.length === 0 ? (
            <p className="rounded-xl border bg-slate-50 p-4 text-slate-600">
              この日の開放教室は登録されていません。
            </p>
          ) : (
            openSchools.map((school) => (
              <div
                key={school!.id}
                className="rounded-xl border-2 border-blue-500 bg-blue-50 p-5 text-center text-3xl font-extrabold text-red-600 shadow sm:p-6 sm:text-4xl"
              >
                {school!.name}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
