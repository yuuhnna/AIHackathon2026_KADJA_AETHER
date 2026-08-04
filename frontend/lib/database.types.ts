/**
 * Minimal hand-written database types that match supabase/schema.sql.
 * Replace with generated types from `npx supabase gen types typescript`
 * once you have the Supabase CLI set up.
 */

export interface Database {
  public: {
    Tables: {
      rehab_activities: {
        Row: {
          id: string;
          zone_id: string;
          date: string;
          status: "Planned" | "Active" | "Under Review" | "Completed";
          action_category: string;
          recommendation_name: string;
          recommendation_text: string | null;
          action_taken: string | null;
          implementing_unit: string | null;
          area_covered_ha: number | null;
          evidence_ref: string | null;
          officer_name: string | null;
          source: "seed" | "logged";
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["rehab_activities"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["rehab_activities"]["Insert"]>;
      };
      zone_assessments: {
        Row: {
          id: string;
          zone_id: string;
          recommendation_index: number;
          recommendation_text: string | null;
          date: string;
          status: "Planned" | "Ongoing" | "Completed";
          unit: string;
          officer: string | null;
          action: string;
          area_ha: number | null;
          evidence_ref: string | null;
          notes: string | null;
          validated_items: string[];
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["zone_assessments"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["zone_assessments"]["Insert"]>;
      };
    };
  };
}
