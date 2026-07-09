create extension if not exists pgcrypto;

create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  sort_order integer not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  recipient_name text not null default '',
  address text not null,
  driver_id uuid references public.drivers(id) on delete set null,
  notes text not null default '',
  lat double precision,
  lng double precision,
  completed_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.deliveries add column if not exists recipient_name text not null default '';
alter table public.drivers drop column if exists name;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'deliveries'
      and column_name = 'family_name'
  ) then
    execute 'update public.deliveries set recipient_name = family_name where recipient_name = ''''';
  end if;
end;
$$;

alter table public.deliveries drop column if exists family_name;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists deliveries_set_updated_at on public.deliveries;
create trigger deliveries_set_updated_at
before update on public.deliveries
for each row
execute function public.set_updated_at();

alter table public.drivers enable row level security;
alter table public.deliveries enable row level security;

drop policy if exists "Authenticated users can read drivers" on public.drivers;
create policy "Authenticated users can read drivers"
on public.drivers for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert drivers" on public.drivers;
create policy "Authenticated users can insert drivers"
on public.drivers for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update drivers" on public.drivers;
create policy "Authenticated users can update drivers"
on public.drivers for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete drivers" on public.drivers;
create policy "Authenticated users can delete drivers"
on public.drivers for delete
to authenticated
using (true);

drop policy if exists "Authenticated users can read deliveries" on public.deliveries;
create policy "Authenticated users can read deliveries"
on public.deliveries for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert deliveries" on public.deliveries;
create policy "Authenticated users can insert deliveries"
on public.deliveries for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update deliveries" on public.deliveries;
create policy "Authenticated users can update deliveries"
on public.deliveries for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete deliveries" on public.deliveries;
create policy "Authenticated users can delete deliveries"
on public.deliveries for delete
to authenticated
using (true);

insert into public.drivers (sort_order)
select 1
where not exists (select 1 from public.drivers where sort_order = 1);

insert into public.drivers (sort_order)
select 2
where not exists (select 1 from public.drivers where sort_order = 2);
