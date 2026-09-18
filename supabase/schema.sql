create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  password_hash text not null,
  role text not null check (role in ('Admin', 'Employee')),
  status text not null check (status in ('approved', 'pending')) default 'pending',
  avatar text default '',
  store_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  id uuid primary key references public.app_users(id) on delete cascade,
  name text not null,
  phone text not null,
  role text not null check (role in ('Admin', 'Employee')),
  status text not null check (status in ('approved', 'pending')),
  avatar text default '',
  store_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.app_sessions (
  token text primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  customer_name text not null,
  customer_phone text not null,
  fabric_type text not null,
  meters numeric not null,
  unit_price numeric not null,
  cost_per_meter numeric not null default 0,
  total numeric not null,
  profit numeric not null default 0,
  employee_id uuid not null references public.app_users(id),
  employee_name text not null,
  status text not null,
  created_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;
create policy "Public can read safe profiles" on public.user_profiles for select using (true);

alter table public.app_users enable row level security;
alter table public.app_sessions enable row level security;
alter table public.sales enable row level security;

alter publication supabase_realtime add table public.user_profiles;

create or replace function public.register_app_user(
  p_name text,
  p_phone text,
  p_password_hash text,
  p_role text,
  p_avatar text
) returns public.app_users
language plpgsql
security definer
set search_path = public
as $$
declare
  new_user public.app_users;
  is_first boolean;
begin
  select not exists(select 1 from public.app_users) into is_first;
  insert into public.app_users(name, phone, password_hash, role, status, avatar, store_name)
  values (
    trim(p_name),
    trim(p_phone),
    p_password_hash,
    case when is_first then 'Admin' else p_role end,
    case when is_first then 'approved' else 'pending' end,
    coalesce(p_avatar, ''),
    case when is_first then 'XULKAROY PARDALARI' else null end
  ) returning * into new_user;

  insert into public.user_profiles(id, name, phone, role, status, avatar, store_name)
  values (new_user.id, new_user.name, new_user.phone, new_user.role, new_user.status, new_user.avatar, new_user.store_name);
  return new_user;
end;
$$;
