"use server";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export type CancelableBooking = {
  id: string;
  seat_number: number;
  student_name: string;
  student_number: string;
  status: "active" | "canceled";
  school_name: string;
  usage_date: string;
  start_time: string;
  end_time: string;
};

export async function getBookingByToken(token: string): Promise<CancelableBooking | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, seat_number, student_name, student_number, status, schools(name), time_slots(usage_date, start_time, end_time)"
    )
    .eq("cancel_token", token)
    .maybeSingle();

  if (error) throw new Error(`予約情報の取得に失敗しました: ${error.message}`);
  if (!data) return null;

  const school = data.schools as unknown as { name: string } | null;
  const slot = data.time_slots as unknown as {
    usage_date: string;
    start_time: string;
    end_time: string;
  } | null;

  return {
    id: data.id as string,
    seat_number: data.seat_number as number,
    student_name: data.student_name as string,
    student_number: data.student_number as string,
    status: data.status as "active" | "canceled",
    school_name: school?.name ?? "不明な校舎",
    usage_date: slot?.usage_date ?? "",
    start_time: slot?.start_time ?? "",
    end_time: slot?.end_time ?? "",
  };
}

export async function cancelBookingByToken(
  token: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "canceled", canceled_at: new Date().toISOString() })
    .eq("cancel_token", token)
    .eq("status", "active")
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: `キャンセルに失敗しました: ${error.message}` };
  if (!data) return { ok: false, error: "この予約は既にキャンセルされているか、見つかりませんでした。" };

  return { ok: true };
}
