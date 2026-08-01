-- drop old (safe re-run)
drop table if exists public.services cascade;
drop table if exists public.categories cascade;
drop table if exists public.promotions cascade;

create table public.categories (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null,
  slug text not null unique,
  subtitle text,
  description text,
  sort_order int not null default 0
);

create table public.services (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  category_id bigint not null references public.categories(id) on delete cascade,
  title text not null,
  price numeric,
  description text,
  duration text,
  volume text,
  sort_order int not null default 0
);

create table public.promotions (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  description text,
  image_url text,
  new_price numeric,
  old_price numeric,
  is_active boolean not null default true,
  sort_order int not null default 0
);

create index services_category_id_idx on public.services(category_id);
create index services_sort_order_idx on public.services(sort_order);
create index categories_sort_order_idx on public.categories(sort_order);

alter table public.categories enable row level security;
alter table public.services enable row level security;
alter table public.promotions enable row level security;

create policy "Public read categories"
  on public.categories for select
  to anon, authenticated
  using (true);

create policy "Public read services"
  on public.services for select
  to anon, authenticated
  using (true);

create policy "Public read promotions"
  on public.promotions for select
  to anon, authenticated
  using (true);

-- allow insert/update/delete for authenticated (admin later)
create policy "Auth write categories"
  on public.categories for all
  to authenticated
  using (true)
  with check (true);

create policy "Auth write services"
  on public.services for all
  to authenticated
  using (true)
  with check (true);

create policy "Auth write promotions"
  on public.promotions for all
  to authenticated
  using (true)
  with check (true);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at
  before update on public.services
  for each row
  execute function public.set_updated_at();

drop trigger if exists promotions_set_updated_at on public.promotions;
create trigger promotions_set_updated_at
  before update on public.promotions
  for each row
  execute function public.set_updated_at();
