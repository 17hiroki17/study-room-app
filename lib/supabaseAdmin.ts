import { createClient } from "@supabase/supabase-js";

// このアプリはすべてのDBアクセスをサーバー側（Server Actions）から
// Service Role Key を使って行う。RLSは有効だがポリシーを作らないため、
// このクライアントはRLSをバイパスしてすべてのテーブルを読み書きできる。
// ブラウザ（クライアントコンポーネント）からは絶対に呼び出さないこと。

// Database の型定義（supabase gen types 等）を作っていないため、
// ここでは any を指定してテーブル操作の型を緩めている。
// スキーマは supabase/schema.sql を参照。
/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyClient = ReturnType<typeof createClient<any, any, any>>;

let cachedClient: AnyClient | null = null;

export function getSupabaseAdmin() {
  if (cachedClient) return cachedClient;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabaseの環境変数が設定されていません（SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY）。" +
        ".env.local またはVercelの環境変数を確認してください。"
    );
  }

  cachedClient = createClient<any, any, any>(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  return cachedClient;
}
