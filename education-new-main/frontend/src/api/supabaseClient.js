import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://zfyfhkhkxzgfencllpgv.supabase.co";

const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmeWZoa2hreHpnZmVuY2xscGd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2MjY3NjMsImV4cCI6MjEwMzIwMjc2M30.UYvJSfe6K4pASG2Mdqysc6zh_MMtwHafYziM6c5h0tg";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
