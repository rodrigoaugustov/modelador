create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  current_version integer not null default 1,
  working_snapshot_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  version_number integer not null,
  snapshot_json jsonb not null,
  created_at timestamptz not null default now(),
  unique (project_id, version_number)
);

create table if not exists public.data_types (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  label text not null,
  dialect text not null,
  is_active boolean not null default true
);
