-- ============================================================================
-- Florencia Meccico - Nutrición · esquema de base de datos
-- Pegar esto entero en Supabase → SQL Editor → New query → Run
-- ============================================================================

-- ---------- STAFF (nutricionistas) ----------
-- Por ahora solo Florencia, pero queda como tabla por si mañana se suma alguien más.
create table if not exists public.staff (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null default 'Florencia'
);

-- ---------- PACIENTES ----------
create table if not exists public.pacientes (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  iniciales text not null,
  genero text not null check (genero in ('M', 'F')),
  email text not null,
  acceso text not null default 'invitado' check (acceso in ('invitado', 'activo', 'inactivo')),
  plan jsonb not null default '{"desayuno":"","colacion":"","almuerzo":"","merienda":"","cena":""}',
  log jsonb not null default '{"desayuno":null,"colacion":null,"almuerzo":null,"merienda":null,"cena":null}',
  history jsonb not null default '{}',
  medidas jsonb not null default '[]',
  historia_clinica text not null default '',
  created_at timestamptz not null default now()
);

-- ---------- TURNOS ----------
create table if not exists public.turnos (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes(id) on delete cascade,
  fecha date not null,
  hora time not null,
  motivo text default '',
  avisar boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists turnos_paciente_idx on public.turnos (paciente_id);
create index if not exists turnos_fecha_idx on public.turnos (fecha);

-- ============================================================================
-- Helper: ¿el usuario logueado es staff (Florencia)?
-- security definer para poder consultar la tabla staff sin depender de RLS.
-- ============================================================================
create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.staff where id = auth.uid());
$$;

-- ============================================================================
-- Trigger: cuando se crea un usuario en Supabase Auth con metadata role='paciente',
-- le creamos automáticamente su fila en "pacientes". Si es role='staff', le
-- creamos su fila en "staff". La metadata la manda la Edge Function de invitación.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.raw_user_meta_data->>'role' = 'staff' then
    insert into public.staff (id, nombre)
    values (new.id, coalesce(new.raw_user_meta_data->>'nombre', 'Florencia'))
    on conflict (id) do nothing;
  else
    insert into public.pacientes (id, nombre, iniciales, genero, email, acceso)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'nombre', new.email),
      coalesce(new.raw_user_meta_data->>'iniciales', upper(left(new.email, 2))),
      coalesce(new.raw_user_meta_data->>'genero', 'F'),
      new.email,
      'invitado'
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Cuando el paciente confirma su cuenta (pone su propia contraseña / hace login
-- por primera vez), pasa de "invitado" a "activo".
create or replace function public.marcar_paciente_activo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.last_sign_in_at is not null and old.last_sign_in_at is null then
    update public.pacientes set acceso = 'activo' where id = new.id and acceso = 'invitado';
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_first_login on auth.users;
create trigger on_auth_user_first_login
  after update on auth.users
  for each row execute procedure public.marcar_paciente_activo();

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.staff enable row level security;
alter table public.pacientes enable row level security;
alter table public.turnos enable row level security;

-- staff: cada staff puede ver la lista de staff (uso interno, no crítico)
create policy "staff ve staff" on public.staff
  for select using (public.is_staff());

-- pacientes: Florencia ve y edita todo
create policy "staff accede a todos los pacientes" on public.pacientes
  for all using (public.is_staff()) with check (public.is_staff());

-- pacientes: cada paciente ve su propia ficha
create policy "paciente ve su propia ficha" on public.pacientes
  for select using (auth.uid() = id);

-- pacientes: cada paciente puede actualizar su propio registro del día (log)
-- Nota: por simplicidad esta policy permite actualizar la fila propia en general;
-- si más adelante querés bloquear que el paciente toque su "plan" o su
-- "historia_clinica" directamente, avisame y lo pasamos a una función RPC
-- que solo permita tocar la columna "log".
create policy "paciente actualiza su propio registro" on public.pacientes
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- turnos: Florencia ve y administra todos los turnos
create policy "staff accede a todos los turnos" on public.turnos
  for all using (public.is_staff()) with check (public.is_staff());

-- turnos: cada paciente ve solo sus propios turnos (no los puede crear/borrar,
-- eso lo hace Florencia desde la ficha)
create policy "paciente ve sus propios turnos" on public.turnos
  for select using (auth.uid() = paciente_id);

-- ============================================================================
-- Alta de Florencia como staff
-- ============================================================================
-- 1) Andá a Authentication → Users → Add user (o Invite) y creá el usuario de
--    Florencia con su email real.
-- 2) Copiá el UUID que le asignó Supabase (columna "id" de ese usuario) y
--    reemplazalo acá abajo, después ejecutá esta línea sola:
--
-- insert into public.staff (id, nombre) values ('PEGAR-UUID-DE-FLORENCIA-ACA', 'Florencia');
