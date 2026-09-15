"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  createBooking,
  getSeatAvailability,
  listAvailableTimeSlots,
  type PublicSchool,
} from "./actions";
import { formatTimeRange, formatUsageDate } from "@/lib/format";
import type { SeatAvailability, TimeSlot } from "@/lib/types";

type Step = "region" | "school" | "slot" | "seat" | "done";

export default function ReserveWizard({ schools }: { schools: PublicSchool[] }) {
  const regions = useMemo(() => {
    const set = new Set<string>();
    for (const s of schools) {
      if (s.region) set.add(s.region);
    }
    return Array.from(set);
  }, [schools]);

  const needsRegionStep = regions.length > 1;

  const [step, setStep] = useState<Step>(needsRegionStep ? "region" : "school");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<PublicSchool | null>(null);

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const [seatCapacity, setSeatCapacity] = useState(0);
  const [seats, setSeats] = useState<SeatAvailability[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);

  const [studentName, setStudentName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");

  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [confirmation, setConfirmation] = useState<{ cancelToken: string } | null>(null);

  const visibleSchools = selectedRegion
    ? schools.filter((s) => (s.region ?? "未設定") === selectedRegion)
    : schools;

  function handleSelectRegion(region: string) {
    setSelectedRegion(region);
    setStep("school");
  }

  function handleSelectSchool(school: PublicSchool) {
    setSelectedSchool(school);
    setLoadError(null);
    startTransition(async () => {
      try {
        const slots = await listAvailableTimeSlots(school.id);
        setTimeSlots(slots);
        setStep("slot");
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "読み込みに失敗しました。");
      }
    });
  }

  function handleSelectSlot(slot: TimeSlot) {
    if (!selectedSchool) return;
    setSelectedSlot(slot);
    setSelectedSeat(null);
    setLoadError(null);
    startTransition(async () => {
      try {
        const availability = await getSeatAvailability(selectedSchool.id, slot.id);
        setSeatCapacity(availability.seatCapacity);
        setSeats(availability.seats);
        setStep("seat");
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "読み込みに失敗しました。");
      }
    });
  }

  function refreshSeatAvailability() {
    if (!selectedSchool || !selectedSlot) return;
    setLoadError(null);
    startTransition(async () => {
      try {
        const availability = await getSeatAvailability(selectedSchool.id, selectedSlot.id);
        setSeatCapacity(availability.seatCapacity);
        setSeats(availability.seats);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "読み込みに失敗しました。");
      }
    });
  }

  function handleSubmit() {
    if (!selectedSchool || !selectedSlot || selectedSeat === null) return;
    setSubmitError(null);
    startTransition(async () => {
      const result = await createBooking({
        schoolId: selectedSchool.id,
        timeSlotId: selectedSlot.id,
        seatNumber: selectedSeat,
        studentName,
        studentNumber,
      });

      if (!result.ok) {
        setSubmitError(result.error);
        if (result.reason === "taken") {
          refreshSeatAvailability();
          setSelectedSeat(null);
        }
        return;
      }

      setConfirmation({ cancelToken: result.cancelToken });
      setStep("done");
    });
  }

  function resetAll() {
    setStep(needsRegionStep ? "region" : "school");
    setSelectedRegion(null);
    setSelectedSchool(null);
    setTimeSlots([]);
    setSelectedSlot(null);
    setSeats([]);
    setSelectedSeat(null);
    setStudentName("");
    setStudentNumber("");
    setSubmitError(null);
    setConfirmation(null);
  }

  return (
   <div className="flex items-center justify-between">
  <h1 className="text-lg font-bold">アイリス講義室予約フォーム</h1>
</div>

      {loadError && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{loadError}</p>
      )}

      {step === "region" && (
        <StepCard title="地域を選択してください">
          <div className="flex flex-col gap-2">
            {regions.map((region) => (
              <button
                key={region}
                onClick={() => handleSelectRegion(region)}
                className="rounded border border-slate-300 bg-white px-4 py-3 text-left hover:bg-slate-100"
              >
                {region}
              </button>
            ))}
          </div>
        </StepCard>
      )}

      {step === "school" && (
        <StepCard
          title="校舎を選択してください"
          onBack={needsRegionStep ? () => setStep("region") : undefined}
        >
          <div className="flex flex-col gap-2">
            {visibleSchools.length === 0 && (
              <p className="text-sm text-slate-500">予約可能な校舎がありません。</p>
            )}
            {visibleSchools.map((school) => (
              <button
                key={school.id}
                onClick={() => handleSelectSchool(school)}
                disabled={isPending}
                className="rounded border border-slate-300 bg-white px-4 py-3 text-left hover:bg-slate-100 disabled:opacity-50"
              >
                {school.name}
              </button>
            ))}
          </div>
        </StepCard>
      )}

      {step === "slot" && selectedSchool && (
        <StepCard
          title={`${selectedSchool.name}: 使用日時を選択してください`}
          onBack={() => setStep("school")}
        >
          <div className="flex flex-col gap-2">
            {timeSlots.length === 0 && (
              <p className="text-sm text-slate-500">
                現在予約可能な使用日時がありません。校舎にお問い合わせください。
              </p>
            )}
            {timeSlots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => handleSelectSlot(slot)}
                disabled={isPending}
                className="rounded border border-slate-300 bg-white px-4 py-3 text-left hover:bg-slate-100 disabled:opacity-50"
              >
                {formatUsageDate(slot.usage_date)} {formatTimeRange(slot.start_time, slot.end_time)}
              </button>
            ))}
          </div>
        </StepCard>
      )}

      {step === "seat" && selectedSchool && selectedSlot && (
        <StepCard
          title={`${selectedSchool.name}: ブースを選択してください`}
          onBack={() => setStep("slot")}
        >
          <p className="mb-2 text-sm text-slate-600">
            {formatUsageDate(selectedSlot.usage_date)}{" "}
            {formatTimeRange(selectedSlot.start_time, selectedSlot.end_time)}
          </p>

          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded bg-white border border-slate-300" />
                空き
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded bg-slate-300" />
                予約済み
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded bg-blue-600" />
                選択中
              </span>
            </div>
            <button
              onClick={refreshSeatAvailability}
              disabled={isPending}
              className="text-xs text-blue-600 hover:underline disabled:opacity-50"
            >
              最新の状況に更新
            </button>
          </div>

          {seatCapacity === 0 ? (
            <p className="text-sm text-slate-500">この校舎には席が設定されていません。</p>
          ) : (
            <div className="mb-4 grid grid-cols-5 gap-2 sm:grid-cols-6">
              {seats.map((seat) => {
                const isSelected = selectedSeat === seat.seatNumber;
                return (
                  <button
                    key={seat.seatNumber}
                    disabled={seat.booked || isPending}
                    onClick={() => setSelectedSeat(seat.seatNumber)}
                    className={[
                      "rounded border px-2 py-3 text-sm font-medium",
                      seat.booked
                        ? "cursor-not-allowed border-slate-200 bg-slate-300 text-slate-500"
                        : isSelected
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white hover:bg-slate-100",
                    ].join(" ")}
                  >
                    {seat.seatNumber}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-slate-200 pt-4">
            <label className="text-xs font-medium text-slate-600">氏名</label>
            <input
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="例: 東進 太郎"
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <label className="text-xs font-medium text-slate-600">生徒番号</label>
            <input
              value={studentNumber}
              onChange={(e) => setStudentNumber(e.target.value)}
              placeholder="生徒番号を入力してください"
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />

            {submitError && <p className="text-sm text-red-600">{submitError}</p>}

            <button
              onClick={handleSubmit}
              disabled={isPending || selectedSeat === null || !studentName || !studentNumber}
              className="mt-2 rounded bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? "予約中..." : "このブースで予約する"}
            </button>
          </div>
        </StepCard>
      )}

      {step === "done" && selectedSchool && selectedSlot && confirmation && (
        <StepCard title="予約が完了しました">
          <div className="flex flex-col gap-2 text-sm">
            <p>
              <span className="font-semibold">校舎:</span> {selectedSchool.name}
            </p>
            <p>
              <span className="font-semibold">使用日時:</span>{" "}
              {formatUsageDate(selectedSlot.usage_date)}{" "}
              {formatTimeRange(selectedSlot.start_time, selectedSlot.end_time)}
            </p>
            <p>
              <span className="font-semibold">ブース番号:</span> {selectedSeat}
            </p>
            <p>
              <span className="font-semibold">氏名:</span> {studentName}
            </p>

            <div className="mt-3 rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
              予約を取り消す場合は、下のリンクを開いてください。このページを閉じると
              リンクは表示されなくなりますので、必要であればブックマークしてください。
            </div>
            <Link
              href={`/cancel/${confirmation.cancelToken}`}
              className="rounded border border-slate-300 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              この予約をキャンセルする画面を開く
            </Link>

            <button
              onClick={resetAll}
              className="mt-2 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              続けて別の予約をする
            </button>
          </div>
        </StepCard>
      )}
    </div>
  );
}

function StepCard({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        {onBack && (
          <button onClick={onBack} className="text-sm text-blue-600 hover:underline">
            ← 戻る
          </button>
        )}
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      </div>
      {children}
    </div>
  );
}
