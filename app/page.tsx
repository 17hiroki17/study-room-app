import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-4 text-center">
      <div>
        <h1 className="text-2xl font-bold">自習室予約システム</h1>
        <p className="mt-2 text-sm text-slate-600">
          校舎の自習室ブースの予約・管理を行います。
        </p>
      </div>

      <div className="flex w-full flex-col gap-3">
        <Link
          href="/reserve"
          className="rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow hover:bg-blue-700"
        >
          生徒: 自習室を予約する
        </Link>
        <Link
          href="/admin"
          className="rounded-lg border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 shadow-sm hover:bg-slate-100"
        >
          管理者: 校舎の設定を行う
        </Link>
      </div>
    </main>
  );
}
