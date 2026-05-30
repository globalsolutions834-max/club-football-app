-- =====================================================
-- SCHÉMA COMPLET — CLUB DE FOOTBALL
-- À exécuter dans Supabase > SQL Editor
-- =====================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ── Profiles (liés à auth.users) ─────────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text not null default '',
  role        text not null default 'staff' check (role in ('admin','staff','treasurer','parent')),
  player_id   uuid,
  avatar_url  text,
  created_at  timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Profiles: lecture selon rôle" on public.profiles
  for select using (auth.uid() = id or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));
create policy "Profiles: admin peut tout" on public.profiles
  for all using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));
create policy "Profiles: self update" on public.profiles
  for update using (auth.uid() = id);

-- Trigger: créer profil à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name',''), 'staff');
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Players ───────────────────────────────────────────────────────────────────
create table public.players (
  id               uuid primary key default uuid_generate_v4(),
  first_name       text not null,
  last_name        text not null,
  date_of_birth    date,
  position         text check (position in ('Gardien','Défenseur','Milieu','Attaquant')),
  category         text check (category in ('Équipe 1ère','U17','U15','U12')),
  status           text default 'actif' check (status in ('actif','inactif','suspendu')),
  photo_url        text,
  phone            text,
  parent_name      text,
  parent_phone     text,
  address          text,
  seasons_at_club  int default 1,
  jersey_number    int,
  season_goal      text,
  staff_notes      text,
  monthly_fee      int default 2000,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
alter table public.players enable row level security;
create policy "Players: staff+ lecture" on public.players
  for select using (exists (
    select 1 from public.profiles p where p.id = auth.uid()
    and p.role in ('admin','staff','treasurer')
  ) or exists (
    select 1 from public.profiles p where p.id = auth.uid()
    and p.player_id = players.id
  ));
create policy "Players: admin+staff écriture" on public.players
  for all using (exists (
    select 1 from public.profiles p where p.id = auth.uid()
    and p.role in ('admin','staff')
  ));

-- ── Attendances ───────────────────────────────────────────────────────────────
create table public.attendances (
  id            uuid primary key default uuid_generate_v4(),
  player_id     uuid not null references public.players(id) on delete cascade,
  session_date  date not null,
  session_type  text default 'Entraînement' check (session_type in ('Entraînement','Match','Tournoi')),
  status        text not null check (status in ('P','A','E')),
  note          text,
  created_by    uuid references public.profiles(id),
  created_at    timestamptz default now(),
  unique (player_id, session_date, session_type)
);
alter table public.attendances enable row level security;
create policy "Attendances: staff+ lecture" on public.attendances
  for select using (exists (
    select 1 from public.profiles p where p.id = auth.uid()
    and p.role in ('admin','staff','treasurer')
  ) or exists (
    select 1 from public.profiles p
    join public.players pl on pl.id = p.player_id
    where p.id = auth.uid() and pl.id = attendances.player_id
  ));
create policy "Attendances: staff+ écriture" on public.attendances
  for all using (exists (
    select 1 from public.profiles p where p.id = auth.uid()
    and p.role in ('admin','staff')
  ));

-- ── Payments ──────────────────────────────────────────────────────────────────
create table public.payments (
  id          uuid primary key default uuid_generate_v4(),
  player_id   uuid not null references public.players(id) on delete cascade,
  month       int not null check (month between 1 and 12),
  year        int not null,
  amount      int not null,
  paid_date   date,
  status      text default 'pending' check (status in ('paid','pending','late')),
  note        text,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz default now(),
  unique (player_id, month, year)
);
alter table public.payments enable row level security;
create policy "Payments: admin+treasurer lecture" on public.payments
  for select using (exists (
    select 1 from public.profiles p where p.id = auth.uid()
    and p.role in ('admin','treasurer')
  ) or exists (
    select 1 from public.profiles p
    join public.players pl on pl.id = p.player_id
    where p.id = auth.uid() and pl.id = payments.player_id
  ));
create policy "Payments: admin+treasurer écriture" on public.payments
  for all using (exists (
    select 1 from public.profiles p where p.id = auth.uid()
    and p.role in ('admin','treasurer')
  ));

-- ── Evaluations ───────────────────────────────────────────────────────────────
create table public.evaluations (
  id            uuid primary key default uuid_generate_v4(),
  player_id     uuid not null references public.players(id) on delete cascade,
  quarter       int not null check (quarter between 1 and 4),
  year          int not null,
  passing       int check (passing between 1 and 5),
  ball_control  int check (ball_control between 1 and 5),
  shooting      int check (shooting between 1 and 5),
  dribbling     int check (dribbling between 1 and 5),
  speed         int check (speed between 1 and 5),
  endurance     int check (endurance between 1 and 5),
  strength      int check (strength between 1 and 5),
  discipline    int check (discipline between 1 and 5),
  teamwork      int check (teamwork between 1 and 5),
  leadership    int check (leadership between 1 and 5),
  global_score  numeric(3,1),
  notes         text,
  created_by    uuid references public.profiles(id),
  created_at    timestamptz default now(),
  unique (player_id, quarter, year)
);
alter table public.evaluations enable row level security;
create policy "Evaluations: staff+ lecture" on public.evaluations
  for select using (exists (
    select 1 from public.profiles p where p.id = auth.uid()
    and p.role in ('admin','staff')
  ) or exists (
    select 1 from public.profiles p
    join public.players pl on pl.id = p.player_id
    where p.id = auth.uid() and pl.id = evaluations.player_id
  ));
create policy "Evaluations: staff+ écriture" on public.evaluations
  for all using (exists (
    select 1 from public.profiles p where p.id = auth.uid()
    and p.role in ('admin','staff')
  ));

-- ── Documents ─────────────────────────────────────────────────────────────────
create table public.documents (
  id          uuid primary key default uuid_generate_v4(),
  player_id   uuid not null references public.players(id) on delete cascade,
  doc_type    text check (doc_type in ('autorisation_parentale','licence','certificat_medical','autre')),
  file_name   text not null,
  file_url    text not null,
  file_size   int,
  validated   boolean default false,
  uploaded_by uuid references public.profiles(id),
  created_at  timestamptz default now()
);
alter table public.documents enable row level security;
create policy "Documents: admin lecture" on public.documents
  for select using (exists (
    select 1 from public.profiles p where p.id = auth.uid()
    and p.role in ('admin','staff')
  ));
create policy "Documents: admin écriture" on public.documents
  for all using (exists (
    select 1 from public.profiles p where p.id = auth.uid()
    and p.role = 'admin'
  ));

-- ── Competitions ──────────────────────────────────────────────────────────────
create table public.competitions (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  date        date not null,
  location    text,
  opponent    text,
  score_us    int,
  score_them  int,
  result      text check (result in ('V','N','D')),
  category    text,
  scorers     text[],
  notes       text,
  photos      text[],
  created_by  uuid references public.profiles(id),
  created_at  timestamptz default now()
);
alter table public.competitions enable row level security;
create policy "Competitions: tous lecture" on public.competitions
  for select using (auth.uid() is not null);
create policy "Competitions: staff+ écriture" on public.competitions
  for all using (exists (
    select 1 from public.profiles p where p.id = auth.uid()
    and p.role in ('admin','staff')
  ));

-- ── Storage buckets ───────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('documents', 'documents', false) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('competition-photos', 'competition-photos', true) on conflict do nothing;

create policy "Avatars: public lecture" on storage.objects for select using (bucket_id = 'avatars');
create policy "Avatars: auth upload" on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid() is not null);
create policy "Documents: admin access" on storage.objects for all using (
  bucket_id = 'documents' and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','staff')
  )
);
create policy "Photos: public lecture" on storage.objects for select using (bucket_id = 'competition-photos');
create policy "Photos: staff upload" on storage.objects for insert with check (
  bucket_id = 'competition-photos' and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','staff')
  )
);

-- ── Données de démonstration ──────────────────────────────────────────────────
insert into public.players (first_name, last_name, date_of_birth, position, category, status, phone, parent_name, parent_phone, seasons_at_club, jersey_number, monthly_fee, season_goal, staff_notes) values
  ('Mamadou','Coulibaly','2006-03-15','Milieu','U17','actif','76001001','Fatoumata Coulibaly','76001002',2,8,2000,'Intégrer l''équipe 1ère','Bon entrain, manque de puissance physique'),
  ('Ibrahim','Diallo','2005-07-22','Attaquant','U17','actif','70001001','Mariam Diallo','70001002',3,9,2000,'Capitaine U17','Leader naturel, excellent finisseur'),
  ('Seydou','Traoré','2004-01-01','Défenseur','Équipe 1ère','actif','66001001',null,null,4,4,5000,'Stabiliser le poste','Pilier de la défense, relance à améliorer'),
  ('Moussa','Keïta','2007-06-05','Gardien','U15','actif','79001001','Aminata Keïta','79001002',1,1,1500,'Progresser techniquement','Première saison, très bonne mentalité'),
  ('Ali','Sanogo','2003-11-12','Milieu','Équipe 1ère','actif','65001001',null,null,5,10,5000,'Top 4 tournoi principal','Pilier du club, aide à l''encadrement'),
  ('Oumar','Bah','2006-09-18','Attaquant','U17','actif','78001001','Kadiatou Bah','78001002',2,11,2000,'Travailler la finition','Rapide, doit améliorer son positionnement'),
  ('Lassana','Doumbia','2005-02-28','Défenseur','U17','actif','77001001','Tenin Doumbia','77001002',3,5,2000,'Constance en match','Solide défenseur central'),
  ('Aboubacar','Camara','2003-04-14','Gardien','Équipe 1ère','actif','64001001',null,null,6,16,5000,'Zéro encaissé en tournoi','Meilleur gardien de la saison passée');
