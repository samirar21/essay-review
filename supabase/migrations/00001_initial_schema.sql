-- Draft to Admit — initial schema
-- Run this in the Supabase SQL editor or via `supabase db push`.

-- ============================================================
-- Tables
-- ============================================================

create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text not null,
  email      text not null,
  role       text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);

create table public.essays (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid not null references public.profiles (id) on delete cascade,
  school_name      text not null,
  prompt           text not null,
  essay_type       text not null check (essay_type in ('common_app', 'supplemental', 'other')),
  word_limit       integer check (word_limit > 0),
  draft_number     integer not null default 1 check (draft_number > 0),
  content          text not null,
  deadline         date,
  feedback_request text,
  status           text not null default 'pending' check (status in ('pending', 'in_review', 'complete')),
  created_at       timestamptz not null default now()
);

create index essays_student_id_idx on public.essays (student_id);
create index essays_status_idx on public.essays (status);

create table public.feedback (
  id                 uuid primary key default gen_random_uuid(),
  essay_id           uuid not null references public.essays (id) on delete cascade,
  reviewer_id        uuid not null references public.profiles (id),
  overall_score      integer not null check (overall_score between 0 and 100),
  uniqueness_score   integer not null check (uniqueness_score between 0 and 100),
  voice_score        integer not null check (voice_score between 0 and 100),
  hook_score         integer not null check (hook_score between 0 and 100),
  authenticity_score integer not null check (authenticity_score between 0 and 100),
  flow_score         integer not null check (flow_score between 0 and 100),
  conciseness_score  integer not null check (conciseness_score between 0 and 100),
  summary            text not null,
  created_at         timestamptz not null default now(),
  unique (essay_id)
);

create table public.inline_comments (
  id           uuid primary key default gen_random_uuid(),
  essay_id     uuid not null references public.essays (id) on delete cascade,
  reviewer_id  uuid not null references public.profiles (id),
  start_index  integer not null check (start_index >= 0),
  end_index    integer not null check (end_index > start_index),
  comment_text text not null,
  created_at   timestamptz not null default now()
);

create index inline_comments_essay_id_idx on public.inline_comments (essay_id);

-- ============================================================
-- Profile auto-creation on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.essays enable row level security;
alter table public.feedback enable row level security;
alter table public.inline_comments enable row level security;

-- security definer so policies can check the caller's role without
-- recursing into the profiles RLS policies
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles ----------------------------------------------------

create policy "Users can view their own profile"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "Users can update their own name"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select p.role from public.profiles p where p.id = auth.uid()));

-- essays ------------------------------------------------------

create policy "Students can view their own essays"
  on public.essays for select
  using (student_id = auth.uid() or public.is_admin());

create policy "Students can submit their own essays"
  on public.essays for insert
  with check (student_id = auth.uid());

create policy "Admins can update essays"
  on public.essays for update
  using (public.is_admin());

-- feedback ----------------------------------------------------

create policy "Essay owner and admins can view feedback"
  on public.feedback for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.essays e
      where e.id = feedback.essay_id and e.student_id = auth.uid()
    )
  );

create policy "Admins can create feedback"
  on public.feedback for insert
  with check (public.is_admin() and reviewer_id = auth.uid());

create policy "Admins can update feedback"
  on public.feedback for update
  using (public.is_admin());

-- inline_comments ---------------------------------------------

create policy "Essay owner and admins can view inline comments"
  on public.inline_comments for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.essays e
      where e.id = inline_comments.essay_id and e.student_id = auth.uid()
    )
  );

create policy "Admins can create inline comments"
  on public.inline_comments for insert
  with check (public.is_admin() and reviewer_id = auth.uid());

create policy "Admins can delete inline comments"
  on public.inline_comments for delete
  using (public.is_admin());

-- ============================================================
-- Promote your own account to admin (run after you sign up):
--   update public.profiles set role = 'admin' where email = 'you@example.com';
-- ============================================================
