import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const supabase = getSupabaseAdmin();

  const { data: schools } = await supabase
    .from("schools")
    .select("id, name")
    .order("name");

  const { data: slots } = await supabase
    .from("time_slots")
    .select("school_id, usage_date")
    .order("usage_date");

  const dates = [
    ...new Set((slots ?? []).map((s) => s.usage_date)),
  ];

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">
        アイリス講義室 空き状況
      </h1>

      <table className="border-collapse border">
        <thead>
          <tr>
            <th className="border p-2">日付</th>

            {(schools ?? []).map((school) => (
              <th key={school.id} className="border p-2">
                {school.name}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {dates.map((date) => (
            <tr key={date}>
              <td className="border p-2">{date}</td>

              {(schools ?? []).map((school) => {
                const exists = (slots ?? []).some(
                  (slot) =>
                    slot.school_id === school.id &&
                    slot.usage_date === date
                );

                return (
                  <td key={school.id} className="border p-2 text-center">
                    {exists ? "○" : "×"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
