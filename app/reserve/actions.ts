"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { todayDateStringJST } from "@/lib/format";
import type { School, SeatAvailability, TimeSlot } from "@/lib/types";

export type PublicSchool = Pick<School, "id" | "name" | "region" | "seat_capacity">;

export async function listSchoolsPublic(): Promise<PublicSchool[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("schools")
    .select("id, name, region, seat_capacity")
    .gt("seat_capacity", 0)
    .order("region", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(`校舎一覧の取得に失敗しました: ${error.message}`);
  return (data ?? []) as PublicSchool[];
}

export async function listAvailableTimeSlots(schoolId: string): Promise<TimeSlot[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("time_slots")
    .select("*")
    .eq("school_id", schoolId)
    .gte("usage_date", todayDateStringJST())
    .order("usage_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw new Error(`使用日時の取得に失敗しました: ${error.message}`);
  return (data ?? []) as TimeSlot[];
}

export async function getSeatAvailability(
  schoolId: string,
  timeSlotId: string
): Promise<{ seatCapacity: number; seats: SeatAvailability[] }> {
  const supabase = getSupabaseAdmin();

  const { data: school, error: schoolError } = await supabase
    .from("schools")
    .select("seat_capacity")
    .eq("id", schoolId)
    .maybeSingle();

  if (schoolError) throw new Error(`校舎情報の取得に失敗しました: ${schoolError.message}`);
  const seatCapacity = school?.seat_capacity ?? 0;

  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("seat_number")
    .eq("time_slot_id", timeSlotId)
    .eq("status", "active");

  if (bookingsError) {
    throw new Error(`予約状況の取得に失敗しました: ${bookingsError.message}`);
  }

  const bookedSeats = new Set((bookings ?? []).map((b) => b.seat_number as number));
  const seats: SeatAvailability[] = Array.from({ length: seatCapacity }, (_, i) => {
    const seatNumber = i + 1;
    return { seatNumber, booked: bookedSeats.has(seatNumber) };
  });

  return { seatCapacity, seats };
}

export type CreateBookingResult =
  | { ok: true; bookingId: string; cancelToken: string }
  | { ok: false; error: string; reason?: "taken" | "validation" | "unknown" };

export async function createBooking(input: {
  schoolId: string;
  timeSlotId: string;
  seatNumber: number;
  studentName: string;
  studentNumber: string;
}): Promise<CreateBookingResult> {
  const studentName = input.studentName.trim();
  const studentNumber = input.studentNumber.trim();

  if (!studentName) {
    return { ok: false, error: "氏名を入力してください。", reason: "validation" };
  }
  if (!studentNumber) {
    return { ok: false, error: "生徒番号を入力してください。", reason: "validation" };
  }
  if (!Number.isInteger(input.seatNumber) || input.seatNumber < 1) {
    return { ok: false, error: "ブースを選択してください。", reason: "validation" };
  }

  const supabase = getSupabaseAdmin();

  // 念のため、指定された枠が指定された校舎のものであることを確認する
  const { data: slot, error: slotError } = await supabase
    .from("time_slots")
    .select("id, school_id")
    .eq("id", input.timeSlotId)
    .eq("school_id", input.schoolId)
    .maybeSingle();

  if (slotError) {
    return { ok: false, error: `使用日時の確認に失敗しました: ${slotError.message}`, reason: "unknown" };
  }
  if (!slot) {
    return { ok: false, error: "選択された使用日時が見つかりません。最初からやり直してください。", reason: "validation" };
  }

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      school_id: input.schoolId,
      time_slot_id: input.timeSlotId,
      seat_number: input.seatNumber,
      student_name: studentName,
      student_number: studentNumber,
    })
    .select("id, cancel_token")
    .single();

  if (error) {
    // 23505 = unique_violation。他の生徒が同じブースを先に予約した場合。
    if (error.code === "23505") {
      return {
        ok: false,
        error: "そのブースは、たった今 他の生徒が予約しました。別のブースを選び直してください。",
        reason: "taken",
      };
    }
    return { ok: false, error: `予約の登録に失敗しました: ${error.message}`, reason: "unknown" };
  }

  revalidatePath("/reserve");
  return { ok: true, bookingId: data.id as string, cancelToken: data.cancel_token as string };
}
