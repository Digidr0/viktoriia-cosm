-- Run in Supabase SQL Editor as postgres. Does not delete catalog data.
begin;

create schema if not exists private;

create table if not exists private.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin')),
  created_at timestamptz not null default now()
);

alter table private.admin_users enable row level security;
revoke all on table private.admin_users from public, anon, authenticated;

-- Bind access to an existing Auth UUID, not to an editable profile/JWT metadata.
do $$
declare
  owner_id uuid;
begin
  select id into strict owner_id
  from auth.users
  where lower(email) = 'digidro.work@gmail.com';

  insert into private.admin_users (user_id, role)
  values (owner_id, 'owner')
  on conflict (user_id) do update set role = excluded.role;
exception
  when no_data_found then
    raise exception 'Admin account digidro.work@gmail.com does not exist in Supabase Auth. Create it first, then rerun this migration.';
end;
$$;

-- Exposes only the caller's own access flag, never the role table or other users.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.admin_users
    where user_id = (select auth.uid()) and role in ('owner', 'admin')
  );
$$;

revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- Keep existing SELECT policies unchanged. Restrictive write guards also cover
-- any additional permissive write policies that may exist in the live database.
do $$
declare
  target text;
begin
  foreach target in array array['categories', 'services', 'promotions'] loop
    execute format('alter table public.%I enable row level security', target);
    execute format('drop policy if exists %I on public.%I', 'Auth write ' || target, target);
    execute format('drop policy if exists "Admin write" on public.%I', target);
    execute format('drop policy if exists "Admin insert guard" on public.%I', target);
    execute format('drop policy if exists "Admin update guard" on public.%I', target);
    execute format('drop policy if exists "Admin delete guard" on public.%I', target);

    execute format(
      'create policy "Admin write" on public.%I for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))',
      target
    );
    execute format(
      'create policy "Admin insert guard" on public.%I as restrictive for insert to public with check ((select public.is_admin()))',
      target
    );
    execute format(
      'create policy "Admin update guard" on public.%I as restrictive for update to public using ((select public.is_admin())) with check ((select public.is_admin()))',
      target
    );
    execute format(
      'create policy "Admin delete guard" on public.%I as restrictive for delete to public using ((select public.is_admin()))',
      target
    );
    -- These privileges bypass RLS and are not needed by the browser client.
    execute format('revoke truncate, references, trigger on table public.%I from public, anon, authenticated', target);
  end loop;
end;
$$;

commit;
