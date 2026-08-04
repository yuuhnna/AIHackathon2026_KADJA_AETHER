/**
 * Supabase browser client — singleton so every import shares one connection.
 *
 * Reads from NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * `supabase` is null when either is unset, so a machine without Supabase
 * configured still boots the app — activityStore/supabaseActivityStore
 * treat a null client as "unavailable" and fall back to localStorage,
 * instead of every page crashing at module-load time.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient<Database> | null =
  supabaseUrl && supabaseAnon ? createClient<Database>(supabaseUrl, supabaseAnon) : null;
