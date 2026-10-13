-- DESTRUCTIVE. Drops everything in the public schema, then builds the stills
-- registry schema from scratch.
--
-- Wipe the storage bucket FIRST (python uploader/wipe_storage.py --yes), then
-- run this, then re-upload with uploader/upload.py. Doing storage first means a
-- failure there still leaves the rows that say what the bucket should contain.
--
-- Run the whole file as one query in the Supabase SQL editor. It is wrapped in a
-- transaction: if anything fails, nothing is dropped.

begin;

-- ── 1. drop every non-extension object in public ─────────────────────────────
-- Objects owned by an extension are skipped (pg_depend deptype 'e'), so
-- Supabase's own installed machinery is left alone.

do $$
declare
  obj record;
begin
  for obj in
    select c.relname, c.relkind
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    left join pg_depend d on d.objid = c.oid and d.deptype = 'e'
    where n.nspname = 'public' and c.relkind in ('v', 'm') and d.objid is null
  loop
    if obj.relkind = 'm' then
      execute format('drop materialized view if exists public.%I cascade', obj.relname);
    else
      execute format('drop view if exists public.%I cascade', obj.relname);
    end if;
  end loop;

  for obj in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    left join pg_depend d on d.objid = c.oid and d.deptype = 'e'
    where n.nspname = 'public' and c.relkind in ('r', 'p') and d.objid is null
  loop
    execute format('drop table if exists public.%I cascade', obj.relname);
  end loop;

  for obj in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    left join pg_depend d on d.objid = c.oid and d.deptype = 'e'
    where n.nspname = 'public' and c.relkind = 'S' and d.objid is null
  loop
    execute format('drop sequence if exists public.%I cascade', obj.relname);
  end loop;

  for obj in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    left join pg_depend d on d.objid = p.oid and d.deptype = 'e'
    where n.nspname = 'public' and p.prokind in ('f', 'p') and d.objid is null
  loop
    execute format('drop routine if exists %s cascade', obj.signature);
  end loop;

  for obj in
    select t.typname
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    left join pg_depend d on d.objid = t.oid and d.deptype = 'e'
    where n.nspname = 'public' and t.typtype in ('e', 'c', 'd') and d.objid is null
  loop
    execute format('drop type if exists public.%I cascade', obj.typname);
  end loop;
end;
$$;

-- ── 2. stills: the registry ──────────────────────────────────────────────────

create table stills (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  file_key     uuid not null unique,
  width        int not null check (width > 0),
  height       int not null check (height > 0),
  aspect_ratio numeric generated always as (width::numeric / height) stored,
  alt          text,
  lqip         text
);

comment on column stills.file_key is
  'Storage object stem: stills/{w480,w960,w1600}/<file_key>.webp';

comment on column stills.lqip is
  'Tiny blurred webp as a data URI, inlined into the page and shown while the '
  'real image loads. Written by the uploader; null just falls back to a shimmer.';

comment on column stills.aspect_ratio is
  'Shape of this file. Only read for stills with no parent work (hero/contact '
  'backdrops); work layouts use works.aspect_ratio instead.';

-- ── 3. works ─────────────────────────────────────────────────────────────────
-- aspect_ratio stays here on purpose: it is the layout contract for the whole
-- work (StillsRow renders a 3-cell grid at 3x this value, HorizontalWorkViewer
-- sizes its cover button by it), not a measurement of any one file. The uploader
-- enforces that every still in the work matches it.

create table works (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  name             text not null,
  description      text,
  description_long text,
  year             int,
  video_link       text,
  aspect_ratio     numeric not null,
  displayed        int,  -- null = not listed on /works
  highlighted      int   -- null = not shown on the home page
);

-- displayed/highlighted deliberately carry no UNIQUE: swapping two positions
-- would otherwise need a throwaway third value. Ties break on name.
create index works_displayed_idx   on works (displayed)   where displayed   is not null;
create index works_highlighted_idx on works (highlighted) where highlighted is not null;

-- ── 4. works_stills: membership + ordering ───────────────────────────────────
-- still_id is the primary key, so a still belongs to at most one work. Stills
-- with no row here are registry-only (hero/contact backdrops).

create table works_stills (
  still_id   uuid primary key references stills(id) on delete cascade,
  work_id    uuid not null    references works(id)  on delete cascade,
  sort_order int not null,
  constraint works_stills_order_key
    unique (work_id, sort_order) deferrable initially deferred
);

-- ── 5. still_placements: backdrop surfaces ───────────────────────────────────

create table still_placements (
  surface    text not null check (surface in ('hero', 'contact')),
  still_id   uuid not null references stills(id) on delete cascade,
  sort_order int,
  primary key (surface, still_id)
);

create index still_placements_still_id_idx on still_placements (still_id);

-- ── 6. delete guard: a stills row cannot go while its objects remain ─────────
-- The cascades above are safe because this is the one thing that blocks: you
-- cannot drop a still until its files are actually gone from the bucket.

create or replace function stills_block_delete_with_objects()
returns trigger
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  remaining int;
begin
  select count(*) into remaining
  from storage.objects
  where bucket_id = 'stills'
    and name like '%/' || old.file_key::text || '.%';

  if remaining > 0 then
    raise exception
      'still % still has % object(s) in the stills bucket; delete the files first',
      old.file_key, remaining
      using errcode = 'foreign_key_violation';
  end if;

  return old;
end;
$$;

create trigger stills_block_delete
  before delete on stills
  for each row execute function stills_block_delete_with_objects();

-- ── 7. RLS: public read, writes only via the secret key (bypasses RLS) ───────

alter table stills            enable row level security;
alter table works             enable row level security;
alter table works_stills      enable row level security;
alter table still_placements  enable row level security;

create policy "Public can read stills"      on stills
  for select to anon, authenticated using (true);
create policy "Public can read works"       on works
  for select to anon, authenticated using (true);
create policy "Public can read work stills" on works_stills
  for select to anon, authenticated using (true);
create policy "Public can read placements"  on still_placements
  for select to anon, authenticated using (true);

-- Supabase grants these by default on new tables in public; RLS above is what
-- actually gates access.
grant select on stills, works, works_stills, still_placements to anon, authenticated;
grant all    on stills, works, works_stills, still_placements to service_role;

commit;
