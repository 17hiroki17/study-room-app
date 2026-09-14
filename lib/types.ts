export type School = {
  id: string;
  name: string;
  region: string | null;
  seat_capacity: number;
  created_at: string;
  updated_at: string;
};

export type TimeSlot = {
  id: string;
  school_id: string;
  usage_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  created_at: string;
};

export type BookingStatus = "active" | "canceled";

export type Booking = {
  id: string;
  school_id: string;
  time_slot_id: string;
  seat_number: number;
  student_name: string;
  student_number: string;
  status: BookingStatus;
  cancel_token: string;
  created_at: string;
  canceled_at: string | null;
};

export type SeatAvailability = {
  seatNumber: number;
  booked: boolean;
};
