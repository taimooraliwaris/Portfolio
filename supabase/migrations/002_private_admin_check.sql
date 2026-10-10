create schema if not exists portfolio_private;
revoke all on schema portfolio_private from public;
grant usage on schema portfolio_private to anon,authenticated,service_role;
alter function public.portfolio_is_admin() set schema portfolio_private;
