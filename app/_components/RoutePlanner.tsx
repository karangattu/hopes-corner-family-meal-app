"use client";

import type {
  LatLngBoundsExpression,
  LayerGroup,
  Map as LeafletMap,
} from "leaflet";
import {
  CheckCircle2,
  Circle,
  LogOut,
  MapPin,
  Navigation,
  Plus,
  Route,
  Save,
  StickyNote,
  Trash2,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { signOut } from "@/app/actions/auth";
import {
  addDelivery,
  assignDelivery,
  deleteDelivery,
  toggleDelivery,
  updateDeliveryLocation,
  updateDeliveryNotes,
} from "@/app/actions/deliveries";
import type { Delivery, Driver } from "@/lib/types";

type RoutePlannerProps = {
  drivers: Driver[];
  deliveries: Delivery[];
};

const DEFAULT_CENTER = { lat: 37.3861, lng: -122.0839 };

export default function RoutePlanner({
  drivers,
  deliveries,
}: RoutePlannerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedDriverId, setSelectedDriverId] = useState(
    drivers[0]?.id ?? "",
  );
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(
    null,
  );

  const selectedDelivery = useMemo(
    () => deliveries.find((delivery) => delivery.id === selectedDeliveryId),
    [deliveries, selectedDeliveryId],
  );
  const driverLabels = useMemo(() => {
    return new Map(
      drivers.map((driver, index) => [driver.id, `Driver ${index + 1}`]),
    );
  }, [drivers]);
  const deliveriesByDriver = useMemo(() => {
    return drivers.map((driver) => ({
      driver,
      stops: deliveries.filter((delivery) => delivery.driver_id === driver.id),
    }));
  }, [deliveries, drivers]);

  const selectedStops = useMemo(() => {
    return selectedDriverId
      ? deliveries.filter((delivery) => delivery.driver_id === selectedDriverId)
      : deliveries;
  }, [deliveries, selectedDriverId]);

  const runAction = useCallback(
    (action: () => Promise<unknown>) => {
      startTransition(() => {
        void action().then(() => router.refresh());
      });
    },
    [router],
  );

  const tagLocation = useCallback(
    (deliveryId: string, lat: number, lng: number) => {
      runAction(() => updateDeliveryLocation(deliveryId, lat, lng));
    },
    [runAction],
  );

  if (!drivers.length) {
    return (
      <main className="empty-state">
        <h1>Delivery routes</h1>
        <p>Run the Supabase schema to create the default drivers.</p>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Hope&apos;s Corner</p>
          <h1>Delivery routes</h1>
        </div>
        <div className="topbar-actions">
          <form action={signOut}>
            <button className="icon-button" type="submit" title="Sign out">
              <LogOut aria-hidden size={18} />
            </button>
          </form>
        </div>
      </header>

      <section className="route-layout" aria-busy={isPending}>
        <div className="driver-board">
          {deliveriesByDriver.map(({ driver, stops }) => {
            const driverLabel = driverLabels.get(driver.id) ?? "Driver";

            return (
              <section className="driver-section" key={driver.id}>
                <div className="driver-header">
                  <h2>{driverLabel}</h2>
                  <a
                    className={
                      stops.some((stop) => !stop.completed_at)
                        ? "route-link"
                        : "route-link disabled"
                    }
                    href={driverDirectionsUrl(stops)}
                    target="_blank"
                    rel="noreferrer"
                    title="Open route"
                  >
                    <Route aria-hidden size={17} />
                  </a>
                </div>

                <form
                  className="add-stop"
                  action={async (formData) => {
                    await addDelivery(formData);
                    router.refresh();
                  }}
                >
                  <input type="hidden" name="driverId" value={driver.id} />
                  <input
                    aria-label={`${driverLabel} delivery name`}
                    name="recipientName"
                    placeholder="Name"
                    required
                  />
                  <input
                    aria-label={`${driverLabel} address`}
                    name="address"
                    placeholder="Address"
                    required
                  />
                  <button
                    className="icon-button add-button"
                    type="submit"
                    title="Add"
                  >
                    <Plus aria-hidden size={18} />
                  </button>
                </form>

                <div className="delivery-list">
                  {stops.map((delivery) => {
                    return (
                      <article
                        className={`delivery-row ${delivery.completed_at ? "done" : ""}`}
                        key={delivery.id}
                      >
                        <button
                          className="check-button"
                          type="button"
                          title={
                            delivery.completed_at ? "Mark open" : "Mark done"
                          }
                          onClick={() =>
                            runAction(() =>
                              toggleDelivery(
                                delivery.id,
                                !delivery.completed_at,
                              ),
                            )
                          }
                        >
                          {delivery.completed_at ? (
                            <CheckCircle2 aria-hidden size={24} />
                          ) : (
                            <Circle aria-hidden size={24} />
                          )}
                        </button>

                        <div className="delivery-main">
                          <div className="delivery-title">
                            <strong>{delivery.recipient_name}</strong>
                            <span>-</span>
                            <a
                              href={mapSearchUrl(delivery)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {delivery.address}
                            </a>
                          </div>

                          <div className="delivery-tools">
                            <select
                              aria-label={`Assign ${delivery.recipient_name}`}
                              value={delivery.driver_id ?? ""}
                              onChange={(event) =>
                                runAction(() =>
                                  assignDelivery(
                                    delivery.id,
                                    event.target.value,
                                  ),
                                )
                              }
                            >
                              {drivers.map((driverOption) => (
                                <option
                                  key={driverOption.id}
                                  value={driverOption.id}
                                >
                                  {driverLabels.get(driverOption.id) ??
                                    "Driver"}
                                </option>
                              ))}
                            </select>

                            <button
                              className={
                                selectedDeliveryId === delivery.id
                                  ? "icon-button selected"
                                  : "icon-button"
                              }
                              type="button"
                              title="Tag on map"
                              onClick={() => setSelectedDeliveryId(delivery.id)}
                            >
                              <MapPin aria-hidden size={17} />
                            </button>

                            <a
                              className="icon-button"
                              href={stopDirectionsUrl(delivery)}
                              target="_blank"
                              rel="noreferrer"
                              title="Open directions"
                            >
                              <Navigation aria-hidden size={17} />
                            </a>

                            <button
                              className="icon-button danger"
                              type="button"
                              title="Delete"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Delete ${delivery.recipient_name}?`,
                                  )
                                ) {
                                  runAction(() => deleteDelivery(delivery.id));
                                }
                              }}
                            >
                              <Trash2 aria-hidden size={16} />
                            </button>
                          </div>

                          <form
                            className="note-form"
                            action={async (formData) => {
                              await updateDeliveryNotes(formData);
                              router.refresh();
                            }}
                          >
                            <input
                              type="hidden"
                              name="deliveryId"
                              value={delivery.id}
                            />
                            <StickyNote aria-hidden size={16} />
                            <textarea
                              aria-label={`Notes for ${delivery.recipient_name}`}
                              name="notes"
                              defaultValue={delivery.notes}
                              rows={1}
                              placeholder="Notes"
                            />
                            <button
                              className="icon-button"
                              type="submit"
                              title="Save"
                            >
                              <Save aria-hidden size={16} />
                            </button>
                          </form>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <aside className="map-panel">
          <div className="map-toolbar">
            <div className="segmented-control">
              <button
                className={!selectedDriverId ? "active" : ""}
                type="button"
                onClick={() => setSelectedDriverId("")}
              >
                All
              </button>
              {drivers.map((driver) => (
                <button
                  className={selectedDriverId === driver.id ? "active" : ""}
                  key={driver.id}
                  type="button"
                  onClick={() => setSelectedDriverId(driver.id)}
                >
                  <UserRound aria-hidden size={15} />
                  {driverLabels.get(driver.id) ?? "Driver"}
                </button>
              ))}
            </div>

            {selectedDelivery ? (
              <span className="tagging-label">
                <MapPin aria-hidden size={15} />
                {selectedDelivery.recipient_name}
              </span>
            ) : null}
          </div>

          <DeliveryMap
            deliveries={selectedStops}
            selectedDeliveryId={selectedDeliveryId}
            onSelectDelivery={setSelectedDeliveryId}
            onTagLocation={tagLocation}
          />
        </aside>
      </section>
    </main>
  );
}

function DeliveryMap({
  deliveries,
  selectedDeliveryId,
  onSelectDelivery,
  onTagLocation,
}: {
  deliveries: Delivery[];
  selectedDeliveryId: string | null;
  onSelectDelivery: (id: string) => void;
  onTagLocation: (id: string, lat: number, lng: number) => void;
}) {
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerLayerRef = useRef<LayerGroup | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const selectedRef = useRef(selectedDeliveryId);
  const onTagRef = useRef(onTagLocation);
  const onSelectRef = useRef(onSelectDelivery);
  const tileUrl =
    process.env.NEXT_PUBLIC_OSM_TILE_URL ??
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

  useEffect(() => {
    selectedRef.current = selectedDeliveryId;
  }, [selectedDeliveryId]);

  useEffect(() => {
    onTagRef.current = onTagLocation;
  }, [onTagLocation]);

  useEffect(() => {
    onSelectRef.current = onSelectDelivery;
  }, [onSelectDelivery]);

  useEffect(() => {
    if (!mapNodeRef.current || mapRef.current) {
      return;
    }

    let cancelled = false;

    void import("leaflet").then((leaflet) => {
      if (cancelled || !mapNodeRef.current) {
        return;
      }

      leafletRef.current = leaflet;
      const map = leaflet
        .map(mapNodeRef.current, { zoomControl: true })
        .setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], 12);

      leaflet
        .tileLayer(tileUrl, {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 19,
        })
        .addTo(map);

      markerLayerRef.current = leaflet.layerGroup().addTo(map);
      map.on("click", (event) => {
        const deliveryId = selectedRef.current;
        if (deliveryId) {
          onTagRef.current(deliveryId, event.latlng.lat, event.latlng.lng);
        }
      });

      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [tileUrl]);

  useEffect(() => {
    const leaflet = leafletRef.current;
    const map = mapRef.current;
    const markerLayer = markerLayerRef.current;

    if (!leaflet || !map || !markerLayer) {
      return;
    }

    markerLayer.clearLayers();
    const tagged = deliveries.filter(
      (delivery) => delivery.lat !== null && delivery.lng !== null,
    );

    const bounds: LatLngBoundsExpression = [];

    tagged.forEach((delivery, index) => {
      const lat = delivery.lat as number;
      const lng = delivery.lng as number;
      const isSelected = selectedDeliveryId === delivery.id;
      const marker = leaflet
        .marker([lat, lng], {
          icon: leaflet.divIcon({
            className: "delivery-marker",
            html: `<button class="${delivery.completed_at ? "marker-dot done" : "marker-dot"} ${isSelected ? "selected" : ""}" type="button">${index + 1}</button>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          }),
        })
        .addTo(markerLayer);

      marker.on("click", () => onSelectRef.current(delivery.id));
      marker.bindPopup(
        `<strong>${escapeHtml(delivery.recipient_name)}</strong><br>${escapeHtml(delivery.address)}`,
      );
      bounds.push([lat, lng]);
    });

    if (tagged.length) {
      map.fitBounds(bounds, { maxZoom: 14, padding: [32, 32] });
    } else {
      map.setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], 12);
    }
  }, [deliveries, selectedDeliveryId]);

  return <div className="map-canvas" ref={mapNodeRef} />;
}

function stopDirectionsUrl(delivery: Delivery) {
  const destination =
    delivery.lat !== null && delivery.lng !== null
      ? `${delivery.lat},${delivery.lng}`
      : delivery.address;

  return `https://www.google.com/maps/dir/?api=1&travelmode=driving&dir_action=navigate&destination=${encodeURIComponent(destination)}`;
}

function driverDirectionsUrl(stops: Delivery[]) {
  const openStops = stops.filter((stop) => !stop.completed_at);

  if (!openStops.length) {
    return "#";
  }

  const locations = openStops.map((stop) =>
    stop.lat !== null && stop.lng !== null
      ? `${stop.lat},${stop.lng}`
      : stop.address,
  );
  const destination = locations.at(-1) as string;
  const waypoints = locations.slice(0, -1).slice(0, 9);
  const params = new URLSearchParams({
    api: "1",
    travelmode: "driving",
    dir_action: "navigate",
    destination,
  });

  if (waypoints.length) {
    params.set("waypoints", waypoints.join("|"));
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function mapSearchUrl(delivery: Delivery) {
  const query =
    delivery.lat !== null && delivery.lng !== null
      ? `${delivery.lat},${delivery.lng}`
      : delivery.address;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return entities[char];
  });
}
