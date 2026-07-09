"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function authedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return supabase;
}

async function nextSortOrder(driverId: string) {
  const supabase = await authedClient();
  const { data } = await supabase
    .from("deliveries")
    .select("sort_order")
    .eq("driver_id", driverId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  return Number(data?.sort_order ?? 0) + 1;
}

export async function addDelivery(formData: FormData) {
  const recipientName = String(formData.get("recipientName") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const driverId = String(formData.get("driverId") ?? "").trim();

  if (!recipientName || !address || !driverId) {
    return;
  }

  const supabase = await authedClient();
  const sortOrder = await nextSortOrder(driverId);

  await supabase.from("deliveries").insert({
    recipient_name: recipientName,
    address,
    driver_id: driverId,
    sort_order: sortOrder,
  });

  revalidatePath("/");
}

export async function assignDelivery(deliveryId: string, driverId: string) {
  const supabase = await authedClient();
  const sortOrder = await nextSortOrder(driverId);

  await supabase
    .from("deliveries")
    .update({ driver_id: driverId, sort_order: sortOrder })
    .eq("id", deliveryId);

  revalidatePath("/");
}

export async function toggleDelivery(deliveryId: string, done: boolean) {
  const supabase = await authedClient();

  await supabase
    .from("deliveries")
    .update({ completed_at: done ? new Date().toISOString() : null })
    .eq("id", deliveryId);

  revalidatePath("/");
}

export async function updateDeliveryLocation(
  deliveryId: string,
  lat: number,
  lng: number,
) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return;
  }

  const supabase = await authedClient();

  await supabase.from("deliveries").update({ lat, lng }).eq("id", deliveryId);

  revalidatePath("/");
}

export async function updateDeliveryNotes(formData: FormData) {
  const deliveryId = String(formData.get("deliveryId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!deliveryId) {
    return;
  }

  const supabase = await authedClient();

  await supabase.from("deliveries").update({ notes }).eq("id", deliveryId);

  revalidatePath("/");
}

export async function deleteDelivery(deliveryId: string) {
  const supabase = await authedClient();

  await supabase.from("deliveries").delete().eq("id", deliveryId);

  revalidatePath("/");
}
