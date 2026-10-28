-- Prepared locally. Apply to the live database only with explicit approval.
-- Preserve the existing function body, triggers and data.
begin;

alter function public.set_updated_at() set search_path = '';

commit;
