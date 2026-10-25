import { createClient } from "@supabase/supabase-js";

if (typeof window === "undefined" && typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = class MockWebSocket {};
}

const env = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : (typeof process !== "undefined" ? process.env : {});

const supabaseUrl =
  env.VITE_SUPABASE_URL ||
  "https://zfyfhkhkxzgfencllpgv.supabase.co";

const supabaseAnonKey =
  env.VITE_SUPABASE_ANON_KEY ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmeWZoa2hreHpnZmVuY2xscGd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2MjY3NjMsImV4cCI6MjEwMzIwMjc2M30.UYvJSfe6K4pASG2Mdqysc6zh_MMtwHafYziM6c5h0tg";

if (!env.VITE_SUPABASE_URL) {
  console.warn(
    "[Supabase] Warning: VITE_SUPABASE_URL is not set in environment variables. Falling back to default URL."
  );
}

if (!env.VITE_SUPABASE_ANON_KEY && !env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  console.warn(
    "[Supabase] Warning: VITE_SUPABASE_ANON_KEY is not set in environment variables. Falling back to default key."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;

