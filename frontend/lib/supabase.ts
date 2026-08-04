/**
 * Supabase browser client — singleton so every import shares one connection.
 *
 * Reads from NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * These must be set in .env.local before the client is used.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnon) {
  throw new Error(
    "Missing Supabase env vars. " +
    "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnon);
