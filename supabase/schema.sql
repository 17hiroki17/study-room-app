-- 自習室管理システム DBスキーマ
-- Supabase の SQL Editor でこのファイルの内容をそのまま実行してください。

-- 拡張機能（UUID生成に使用。Supabaseでは通常デフォルトで有効）
create extension if not exists "pgcrypto";

-- 校舎マスタ
create table if not exists schools (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, -- 例: 東戸塚校
  region text, -- 例: 神奈川県 / 埼玉県 / 愛知県 / 岐阜県（未設定可）
  seat_capacity int not null default 0, -- 自習室の席数（ブース数）上限
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 使用日時枠（校舎ごとに、いつ自習室を開放するかを管理者が登録する）
create table if not exists time_slots (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  usage_date date not null, -- 利用日
  start_time time not null, -- 開始時刻
  end_time time not null, -- 終了時刻
  created_at timestamptz not null default now(),
  unique (school_id, usage_date, start_time, end_time),
  constraint time_slots_valid_range check (end_time > start_time)
);

create index if not exists idx_time_slots_school_date
  on time_slots (school_id, usage_date);

-- 予約（生徒が選択したブース）
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  time_slot_id uuid not null references time_slots(id) on delete cascade,
  seat_number int not null, -- 1 〜 school.seat_capacity のブース番号
  student_name text not null,
  student_number text not null,
  status text not null default 'active', -- 'active' | 'canceled'
  cancel_token uuid not null default gen_random_uuid(), -- 生徒がログインなしでキャンセルするための鍵
  created_at timestamptz not null default now(),
  canceled_at timestamptz,
  constraint bookings_seat_range check (seat_number >= 1)
);

-- 同じ枠・同じブース番号に対して「有効な予約」は同時に1件までとするユニーク制約。
-- これにより「選択されたブースはキャンセルされない限り他の生徒は選べない」という
-- 要件を、アプリのロジックだけでなくDBレベルで保証する（同時クリックのレース条件にも安全）。
create unique index if not exists bookings_active_seat_unique
  on bookings (time_slot_id, seat_number)
  where status = 'active';

create index if not exists idx_bookings_time_slot on bookings (time_slot_id);
create index if not exists idx_bookings_cancel_token on bookings (cancel_token);

-- Row Level Security: アプリはすべて Service Role（secret key）経由でアクセスするため、
-- RLSは有効にしつつポリシーは作成しない（mendan-appと同じ方針）。
alter table schools enable row level security;
alter table time_slots enable row level security;
alter table bookings enable row level security;
