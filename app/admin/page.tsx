import Link from "next/link";
import { listSchools } from "./actions";
import NewSchoolForm from "./NewSchoolForm";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const schools = await listSchools();

  const grouped = new Map<string, typeof schools>();
  for (const school of schools) {
    const key = school.region ?? "未設定";
    const list = grouped.get(key) ?? [];
    list.push(school);
    grouped.set(key, list);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">管理画面: 校舎一覧</h1>
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          トップに戻る
        </Link>
      </div>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">校舎を追加</h2>
        <NewSchoolForm />
      </section>

      <section className="flex flex-col gap-6">
        {schools.length === 0 && (
          <p className="text-sm text-slate-500">まだ校舎が登録されていません。</p>
        )}

        {Array.from(grouped.entries()).map(([region, list]) => (
          <div key={region}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {region}
            </h3>
            <ul className="flex flex-col gap-2">
              {list.map((school) => (
                <li key={school.id}>
                  <Link
                    href={`/admin/${school.id}`}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm hover:bg-slate-50"
                  >
                    <span className="font-medium">{school.name}</span>
                    <span className="text-sm text-slate-500">
                      席数上限: {school.seat_capacity}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </main>
  );
}
