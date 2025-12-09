import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type PlatformStatisticField = "total_classes" | "total_students";

type PlatformStatisticsUpdate = Database["public"]["Tables"]["platform_statistics"]["Update"];
type PlatformStatisticsInsert = Database["public"]["Tables"]["platform_statistics"]["Insert"];

export const incrementPlatformStatistic = async (field: PlatformStatisticField) => {
  const currentYear = new Date().getFullYear();

  const { data: stats, error: fetchError } = await supabase
    .from("platform_statistics")
    .select("id, total_classes, total_students")
    .eq("year", currentYear)
    .maybeSingle();

  if (fetchError) throw fetchError;

  const timestamp = new Date().toISOString();

  if (stats) {
    const updates: PlatformStatisticsUpdate = {
      updated_at: timestamp,
    };

    if (field === "total_classes") {
      updates.total_classes = stats.total_classes + 1;
    } else {
      updates.total_students = stats.total_students + 1;
    }

    const { error: updateError } = await supabase
      .from("platform_statistics")
      .update(updates)
      .eq("id", stats.id);

    if (updateError) throw updateError;
  } else {
    const insertData: PlatformStatisticsInsert = {
      year: currentYear,
      total_classes: field === "total_classes" ? 1 : 0,
      total_students: field === "total_students" ? 1 : 0,
      updated_at: timestamp,
    };

    const { error: insertError } = await supabase
      .from("platform_statistics")
      .insert(insertData);

    if (insertError) throw insertError;
  }
};
