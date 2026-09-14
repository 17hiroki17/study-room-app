"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { Booking, School, TimeSlot } from "@/lib/types";

type ActionResult = { ok: true } | { ok: false; error: string };

function asErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "不明なエラーが発生しました。";
}

// ---------- 校舎 ----------

export async function listSchools(): Promise<School[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("schools")
    .select("*")
    .order("region", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(`校舎一覧の取得に失敗しました: ${error.message}`);
  return (data ?? []) as School[];
}

export async function getSchool(schoolId: string): Promise<School | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("schools")
    .select("*")
    .eq("id", schoolId)
    .maybeSingle();

  if (error) throw new Error(`校舎情報の取得に失敗しました: ${error.message}`);
  return (data as School) ?? null;
}

export async function createSchool(formData: FormData): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const seatCapacityRaw = String(formData.get("seat_capacity") ?? "").trim();
  const seatCapacity = Number(seatCapacityRaw);

  if (!name) return { ok: false, error: "校舎名を入力してください。" };
  if (!Number.isInteger(seatCapacity) || seatCapacity < 0) {
    return { ok: false, error: "席数は0以上の整数で入力してください。" };
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("schools").insert({
    name,
    region: region || null,
    seat_capacity: seatCapacity,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: `校舎名「${name}」は既に登録されています。` };
    }
    return { ok: false, error: `校舎の登録に失敗しました: ${error.message}` };
  }

  revalidatePath("/admin");
  return { ok: true };
}

export async function updateSchool(
  schoolId: string,
  formData: FormData
): Promise<ActionResult> {
  const region = String(formData.get("region") ?? "").trim();
  const seatCapacityRaw = String(formData.get("seat_capacity") ?? "").trim();
  const seatCapacity = Number(seatCapacityRaw);

  if (!Number.isInteger(seatCapacity) || seatCapacity < 0) {
    return { ok: false, error: "席数は0以上の整数で入力してください。" };
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("schools")
    .update({
      region: region || null,
      seat_capacity: seatCapacity,
      updated_at: new Date().toISOString(),
    })
    .eq("id", schoolId);

  if (error) {
    return { ok: false, error: `校舎情報の更新に失敗しました: ${error.message}` };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/${schoolId}`);
  return { ok: true };
}

// ---------- 使用日時枠 ----------

export async function listTimeSlots(schoolId: string): Promise<TimeSlot[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("time_slots")
    .select("*")
    .eq("school_id", schoolId)
    .order("usage_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw new Error(`使用日時の取得に失敗しました: ${error.message}`);
  return (data ?? []) as TimeSlot[];
}

function parseWeekdaySelection(formData: FormData): Set<number> {
  // 0=日,1=月,...,6=土
  const selected = new Set<number>();
  for (let i = 0; i < 7; i++) {
    if (formData.get(`weekday_${i}`)) selected.add(i);
  }
  return selected;
}

export async function createTimeSlots(
  schoolId: string,
  formData: FormData
): Promise<ActionResult> {
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? startDate);
  const startTime = String(formData.get("start_time") ?? "");
  const endTime = String(formData.get("end_time") ?? "");
  const weekdays = parseWeekdaySelection(formData);

  if (!startDate || !startTime || !endTime) {
    return { ok: false, error: "日付・開始時刻・終了時刻を入力してください。" };
  }
  if (startTime >= endTime) {
    return { ok: false, error: "終了時刻は開始時刻より後にしてください。" };
  }

  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (end < start) {
    return { ok: false, error: "終了日は開始日以降にしてください。" };
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const maxDays = 366;
  const dayCount = Math.round((end.getTime() - start.getTime()) / dayMs) + 1;
  if (dayCount > maxDays) {
    return { ok: false, error: "一度に登録できる期間は1年までです。" };
  }

  const rows: { school_id: string; usage_date: string; start_time: string; end_time: string }[] = [];
  for (let i = 0; i < dayCount; i++) {
    const d = new Date(start.getTime() + i * dayMs);
    // 曜日指定がある場合はその曜日のみ、指定がなければ毎日
    if (weekdays.size > 0 && !weekdays.has(d.getUTCDay())) continue;
    rows.push({
      school_id: schoolId,
      usage_date: d.toISOString().slice(0, 10),
      start_time: startTime,
      end_time: endTime,
    });
  }

  if (rows.length === 0) {
    return { ok: false, error: "登録対象の日付がありません（曜日の指定を確認してください）。" };
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("time_slots")
    .upsert(rows, { onConflict: "school_id,usage_date,start_time,end_time", ignoreDuplicates: true });

  if (error) {
    return { ok: false, error: `使用日時の登録に失敗しました: ${error.message}` };
  }

  revalidatePath(`/admin/${schoolId}`);
  return { ok: true };
}

export async function deleteTimeSlot(
  schoolId: string,
  timeSlotId: string
): Promise<ActionResult> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("time_slots").delete().eq("id", timeSlotId);

  if (error) {
    return { ok: false, error: `使用日時の削除に失敗しました: ${error.message}` };
  }

  revalidatePath(`/admin/${schoolId}`);
  return { ok: true };
}

// ---------- 予約（管理側） ----------

export type BookingWithSlot = Booking & {
  time_slots: Pick<TimeSlot, "usage_date" | "start_time" | "end_time"> | null;
};

export async function listBookingsForSchool(
  schoolId: string
): Promise<BookingWithSlot[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, time_slots(usage_date, start_time, end_time)")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`予約一覧の取得に失敗しました: ${error.message}`);
  return (data ?? []) as unknown as BookingWithSlot[];
}

export async function adminCancelBooking(
  schoolId: string,
  bookingId: string
): Promise<ActionResult> {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("bookings")
      .update({ status: "canceled", canceled_at: new Date().toISOString() })
      .eq("id", bookingId)
      .eq("status", "active");

    if (error) return { ok: false, error: `キャンセル処理に失敗しました: ${error.message}` };

    revalidatePath(`/admin/${schoolId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: asErrorMessage(err) };
  }
}
