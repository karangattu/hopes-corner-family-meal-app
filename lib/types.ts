export type Driver = {
  id: string;
  sort_order: number;
};

export type Delivery = {
  id: string;
  recipient_name: string;
  address: string;
  driver_id: string | null;
  notes: string;
  lat: number | null;
  lng: number | null;
  completed_at: string | null;
  sort_order: number;
};
