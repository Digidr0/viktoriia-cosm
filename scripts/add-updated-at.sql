-- last modified timestamps for prices & promotions
alter table public.services
  add column if not exists updated_at timestamptz not null default now();

alter table public.promotions
  add column if not exists updated_at timestamptz not null default now();

-- backfill
update public.services set updated_at = coalesce(created_at, now()) where updated_at is null;
update public.promotions set updated_at = coalesce(created_at, now()) where updated_at is null;

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
