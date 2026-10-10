-- Run once in a dedicated Supabase project's SQL editor. No existing tables are removed.
begin;
create table public.portfolio_admins (
 user_id uuid primary key references auth.users(id) on delete cascade
);
create function public.portfolio_is_admin() returns boolean
language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.portfolio_admins where user_id=(select auth.uid())); $$;
revoke all on function public.portfolio_is_admin() from public;
grant execute on function public.portfolio_is_admin() to anon,authenticated,service_role;
alter table public.portfolio_admins enable row level security;
revoke all on public.portfolio_admins from anon,authenticated;
grant select on public.portfolio_admins to authenticated;
grant all on public.portfolio_admins to service_role;
create policy admin_self_read on public.portfolio_admins for select to authenticated using(user_id=(select auth.uid()));

create table public.portfolio_settings(key text primary key,value jsonb not null);
create table public.portfolio_projects(id text primary key,data jsonb not null,published boolean not null default false,position integer not null default 0 check(position between 0 and 999));
create index portfolio_projects_public_order on public.portfolio_projects(published,position);
create table public.portfolio_messages(
 id uuid primary key default gen_random_uuid(),name text not null check(length(name) between 2 and 100),email text not null check(length(email)<=150),subject text not null check(length(subject) between 2 and 150),message text not null check(length(message) between 10 and 5000),created_at timestamptz not null default now(),read boolean not null default false,email_status text not null default 'pending' check(email_status in ('pending','sent','failed','not_configured')),email_provider_id text
);
create index portfolio_messages_created on public.portfolio_messages(created_at desc);
create table public.portfolio_rate_limits(key text primary key,count integer not null,expires timestamptz not null);
create table public.portfolio_api_cache(key text primary key,value jsonb not null,expires bigint not null);
alter table public.portfolio_settings enable row level security;
alter table public.portfolio_projects enable row level security;
alter table public.portfolio_messages enable row level security;
alter table public.portfolio_rate_limits enable row level security;
alter table public.portfolio_api_cache enable row level security;
revoke all on public.portfolio_settings,public.portfolio_projects,public.portfolio_messages,public.portfolio_rate_limits,public.portfolio_api_cache from anon,authenticated;
grant all on public.portfolio_settings,public.portfolio_projects,public.portfolio_messages,public.portfolio_rate_limits,public.portfolio_api_cache to service_role;
grant select on public.portfolio_settings,public.portfolio_projects to anon,authenticated;
grant insert,update,delete on public.portfolio_settings,public.portfolio_projects to authenticated;
grant select,update,delete on public.portfolio_messages to authenticated;
create policy settings_read on public.portfolio_settings for select to anon,authenticated using(key in ('profile','cv') or public.portfolio_is_admin());
create policy settings_admin_insert on public.portfolio_settings for insert to authenticated with check(public.portfolio_is_admin());
create policy settings_admin_update on public.portfolio_settings for update to authenticated using(public.portfolio_is_admin()) with check(public.portfolio_is_admin());
create policy settings_admin_delete on public.portfolio_settings for delete to authenticated using(public.portfolio_is_admin());
create policy projects_read on public.portfolio_projects for select to anon,authenticated using(published or public.portfolio_is_admin());
create policy projects_admin_insert on public.portfolio_projects for insert to authenticated with check(public.portfolio_is_admin());
create policy projects_admin_update on public.portfolio_projects for update to authenticated using(public.portfolio_is_admin()) with check(public.portfolio_is_admin());
create policy projects_admin_delete on public.portfolio_projects for delete to authenticated using(public.portfolio_is_admin());
create policy messages_admin_read on public.portfolio_messages for select to authenticated using(public.portfolio_is_admin());
create policy messages_admin_update on public.portfolio_messages for update to authenticated using(public.portfolio_is_admin()) with check(public.portfolio_is_admin());
create policy messages_admin_delete on public.portfolio_messages for delete to authenticated using(public.portfolio_is_admin());

-- Only the server's secret/service-role key may submit enquiries.
-- Rate-limit increment and message insertion share a transaction.
create function public.portfolio_submit_contact(p_name text,p_email text,p_subject text,p_message text,p_rate_key text) returns uuid
language plpgsql security definer set search_path='' as $$
declare requests integer; message_id uuid;
begin
 if length(p_rate_key)<>64 then raise exception 'INVALID_RATE_KEY'; end if;
 insert into public.portfolio_rate_limits(key,count,expires) values(p_rate_key,1,now()+interval '1 hour')
 on conflict(key) do update set count=case when public.portfolio_rate_limits.expires<=now() then 1 else public.portfolio_rate_limits.count+1 end,expires=case when public.portfolio_rate_limits.expires<=now() then now()+interval '1 hour' else public.portfolio_rate_limits.expires end
 returning count into requests;
 if requests>5 then raise exception 'RATE_LIMIT'; end if;
 insert into public.portfolio_messages(name,email,subject,message) values(p_name,p_email,p_subject,p_message) returning id into message_id;
 delete from public.portfolio_rate_limits where expires<now()-interval '1 day';
 return message_id;
end;$$;
revoke all on function public.portfolio_submit_contact(text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.portfolio_submit_contact(text,text,text,text,text) to service_role;

-- Private storage. Only active public project files and current CV are served by /media.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('portfolio-files','portfolio-files',false,4000000,array['image/png','image/jpeg','image/webp','application/pdf']);
create policy portfolio_storage_read on storage.objects for select to authenticated using(bucket_id='portfolio-files' and public.portfolio_is_admin());
create policy portfolio_storage_insert on storage.objects for insert to authenticated with check(bucket_id='portfolio-files' and public.portfolio_is_admin());
create policy portfolio_storage_update on storage.objects for update to authenticated using(bucket_id='portfolio-files' and public.portfolio_is_admin()) with check(bucket_id='portfolio-files' and public.portfolio_is_admin());
create policy portfolio_storage_delete on storage.objects for delete to authenticated using(bucket_id='portfolio-files' and public.portfolio_is_admin());
commit;
