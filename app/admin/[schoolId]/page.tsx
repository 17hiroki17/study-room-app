import Link from "next/link";
import { notFound } from "next/navigation";
import { getSchool, listBookingsForSchool, listTimeSlots } from "../actions";
import SchoolSettingsForm from "./SchoolSettingsForm";
import TimeSlotManager from "./TimeSlotManager";
import BookingsList from "./BookingsList";

export const dynamic = "force-dynamic";

export default async function SchoolDetailPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = await params;
  const school = await getSchool(schoolId);
  if (!school) notFound();

  const [timeSlots, bookings] = await Promise.all([
    listTimeSlots(schoolId),
    listBookingsForSchool(schoolId),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">{school.name}</h1>
        <Link href="/admin" className="text-sm text-blue-600 hover:underline">
          校舎一覧に戻る
        </Link>
      </div>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">校舎の設定</h2>
        <SchoolSettingsForm school={school} />
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">
          自習室の使用日時（席数上限: {school.seat_capacity}）
        </h2>
        <TimeSlotManager schoolId={school.id} timeSlots={timeSlots} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-700">予約状況</h2>
        <BookingsList schoolId={school.id} bookings={bookings} />
      </section>
    </main>
  );
}
