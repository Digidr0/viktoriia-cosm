-- Run after 001-admin-access.sql in Supabase SQL Editor as postgres.
-- All inserted rows/updates/deletes are rolled back, including on test failure.
begin;

select set_config('test.owner_id', (
  select id::text from auth.users where lower(email) = 'digidro.work@gmail.com'
), true);
select set_config('request.jwt.claim.sub', current_setting('test.owner_id'), true);
select set_config('request.jwt.claims', json_build_object(
  'sub', current_setting('test.owner_id'), 'role', 'authenticated'
)::text, true);
set local role authenticated;

do $$
declare
  row_id bigint;
begin
  if public.is_admin() is distinct from true then
    raise exception 'FAIL: owner must be an admin';
  end if;

  insert into public.categories (name, slug)
  values ('RLS access test', '__rls_test_' || gen_random_uuid()::text)
  returning id into row_id;
  perform set_config('test.category_id', row_id::text, true);

  insert into public.services (category_id, title)
  values (row_id, 'RLS access test') returning id into row_id;
  perform set_config('test.service_id', row_id::text, true);

  insert into public.promotions (title)
  values ('RLS access test') returning id into row_id;
  perform set_config('test.promotion_id', row_id::text, true);
end;
$$;

-- Emulate a signed-in user without an assigned role, then an anonymous visitor.
select set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
select set_config('request.jwt.claims', json_build_object(
  'sub', current_setting('request.jwt.claim.sub'), 'role', 'authenticated'
)::text, true);

do $$
declare
  pass int;
  target text;
  row_id text;
  affected bigint;
  insert_query text;
begin
  for pass in 1..2 loop
    if public.is_admin() is distinct from false then
      raise exception 'FAIL: ordinary/anonymous user must not be an admin';
    end if;

    begin
      perform 1 from private.admin_users;
      raise exception 'FAIL: role table is readable';
    exception when insufficient_privilege then null;
    end;

    foreach target in array array['categories', 'services', 'promotions'] loop
      row_id := current_setting(case target
        when 'categories' then 'test.category_id'
        when 'services' then 'test.service_id'
        else 'test.promotion_id' end);

      execute format('select count(*) from public.%I where id = %L', target, row_id) into affected;
      if affected <> 1 then raise exception 'FAIL: public read blocked on %', target; end if;

      execute format('update public.%I set sort_order = sort_order + 1 where id = %L', target, row_id);
      get diagnostics affected = row_count;
      if affected <> 0 then raise exception 'FAIL: unauthorized update on %', target; end if;

      execute format('delete from public.%I where id = %L', target, row_id);
      get diagnostics affected = row_count;
      if affected <> 0 then raise exception 'FAIL: unauthorized delete on %', target; end if;

      insert_query := case target
        when 'categories' then 'insert into public.categories (name, slug) values (''denied'', gen_random_uuid()::text)'
        when 'services' then format('insert into public.services (category_id, title) values (%L, ''denied'')', current_setting('test.category_id'))
        else 'insert into public.promotions (title) values (''denied'')' end;
      begin
        execute insert_query;
        raise exception 'FAIL: unauthorized insert on %', target;
      exception when insufficient_privilege then null;
      end;

      if has_table_privilege(current_user, 'public.' || target, 'TRUNCATE') then
        raise exception 'FAIL: TRUNCATE privilege on %', target;
      end if;
    end loop;

    if pass = 1 then
      execute 'set local role anon';
      perform set_config('request.jwt.claim.sub', '', true);
      perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    end if;
  end loop;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.owner_id'), true);
select set_config('request.jwt.claims', json_build_object(
  'sub', current_setting('test.owner_id'), 'role', 'authenticated'
)::text, true);

do $$
declare
  target text;
  row_id text;
  affected bigint;
begin
  -- Delete the category last because its services use ON DELETE CASCADE.
  foreach target in array array['services', 'promotions', 'categories'] loop
    row_id := current_setting(case target
      when 'categories' then 'test.category_id'
      when 'services' then 'test.service_id'
      else 'test.promotion_id' end);
    execute format('update public.%I set sort_order = sort_order + 1 where id = %L', target, row_id);
    get diagnostics affected = row_count;
    if affected <> 1 then raise exception 'FAIL: owner update denied on %', target; end if;
    execute format('delete from public.%I where id = %L', target, row_id);
    get diagnostics affected = row_count;
    if affected <> 1 then raise exception 'FAIL: owner delete denied on %', target; end if;
  end loop;
  raise notice 'PASS: owner CRUD; ordinary/anonymous read-only access; role table protected';
end;
$$;

rollback;
