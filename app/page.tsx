import { redirect } from "next/navigation";
import RoutePlanner from "@/app/_components/RoutePlanner";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Delivery, Driver } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!hasSupabaseConfig()) {
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [driversResult, deliveriesResult] = await Promise.all([
    supabase
      .from("drivers")
      .select("id,sort_order")
      .order("sort_order", { ascending: true }),
    supabase
      .from("deliveries")
      .select(
        "id,recipient_name,address,driver_id,notes,lat,lng,completed_at,sort_order",
      )
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  if (driversResult.error) {
    throw new Error(driversResult.error.message);
  }

  if (deliveriesResult.error) {
    throw new Error(deliveriesResult.error.message);
  }

  return (
    <RoutePlanner
      deliveries={(deliveriesResult.data ?? []) as Delivery[]}
      drivers={(driversResult.data ?? []) as Driver[]}
    />
  );
}
