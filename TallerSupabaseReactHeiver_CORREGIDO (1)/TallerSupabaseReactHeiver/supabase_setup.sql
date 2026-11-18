-- =====================================================================
-- Ejecutar completo en Supabase → SQL Editor. Es seguro correrlo varias veces.
-- =====================================================================

-- 1. Estados de ticket (la app usa "Nuevo" al crear un ticket)
insert into public.estados_ticket (nombre) values
  ('Nuevo'), ('Pendiente'), ('Finalizado')
on conflict (nombre) do nothing;

-- 2. Trigger: crea el perfil en public.usuarios al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rol_solicitado text := new.raw_user_meta_data->>'rol';
  rol_final text;
begin
  -- Desde el registro solo se aceptan Aprendiz e Instructor
  if rol_solicitado in ('Aprendiz', 'Instructor') then
    rol_final := rol_solicitado;
  else
    rol_final := 'Aprendiz';
  end if;

  insert into public.usuarios (nombre, correo, rol, auth_user_id)
  values (
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    new.email,
    rol_final,
    new.id
  )
  on conflict (correo) do update set auth_user_id = excluded.auth_user_id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 3. Perfiles para usuarios que ya existen en Auth pero no en public.usuarios
insert into public.usuarios (nombre, correo, rol, auth_user_id)
select
  coalesce(u.raw_user_meta_data->>'nombre', split_part(u.email, '@', 1)),
  u.email,
  case when u.raw_user_meta_data->>'rol' in ('Aprendiz', 'Instructor')
       then u.raw_user_meta_data->>'rol' else 'Aprendiz' end,
  u.id
from auth.users u
where not exists (select 1 from public.usuarios x where x.auth_user_id = u.id)
on conflict (correo) do update set auth_user_id = excluded.auth_user_id;

-- 4. Funciones auxiliares (security definer evita recursión en las políticas)
create or replace function public.mi_usuario_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.usuarios where auth_user_id = auth.uid()
$$;

create or replace function public.mi_rol()
returns text language sql stable security definer set search_path = public as $$
  select rol from public.usuarios where auth_user_id = auth.uid()
$$;

-- 5. Row Level Security
alter table public.usuarios          enable row level security;
alter table public.salones           enable row level security;
alter table public.equipos           enable row level security;
alter table public.estados_ticket    enable row level security;
alter table public.tickets           enable row level security;
alter table public.historial_tickets enable row level security;
alter table public.registros_ingreso enable row level security;

-- Limpieza de políticas anteriores
drop policy if exists "reportadores crean tickets"  on public.tickets;
drop policy if exists "reportadores ven sus tickets" on public.tickets;
drop policy if exists usuarios_select   on public.usuarios;
drop policy if exists salones_select    on public.salones;
drop policy if exists equipos_select    on public.equipos;
drop policy if exists estados_select    on public.estados_ticket;
drop policy if exists tickets_select    on public.tickets;
drop policy if exists tickets_insert    on public.tickets;
drop policy if exists tickets_update    on public.tickets;
drop policy if exists historial_select  on public.historial_tickets;
drop policy if exists historial_insert  on public.historial_tickets;
drop policy if exists ingreso_select    on public.registros_ingreso;
drop policy if exists ingreso_insert    on public.registros_ingreso;

-- usuarios: sin políticas de insert/update/delete, así nadie cambia su rol desde el cliente
create policy usuarios_select on public.usuarios for select to authenticated
using (
  auth_user_id = auth.uid()
  or public.mi_rol() in ('Jefe', 'Experto')
  or id in (select asignado_a from public.tickets where reportado_por = public.mi_usuario_id())
);

-- catálogos: lectura para cualquier usuario autenticado
create policy salones_select on public.salones        for select to authenticated using (true);
create policy equipos_select on public.equipos        for select to authenticated using (true);
create policy estados_select on public.estados_ticket for select to authenticated using (true);

-- tickets
create policy tickets_select on public.tickets for select to authenticated
using (
  public.mi_rol() = 'Jefe'
  or reportado_por = public.mi_usuario_id()
  or asignado_a    = public.mi_usuario_id()
);

create policy tickets_insert on public.tickets for insert to authenticated
with check (
  public.mi_rol() in ('Aprendiz', 'Instructor')
  and reportado_por = public.mi_usuario_id()
);

create policy tickets_update on public.tickets for update to authenticated
using (
  public.mi_rol() = 'Jefe'
  or (public.mi_rol() = 'Experto' and asignado_a = public.mi_usuario_id())
)
with check (
  public.mi_rol() = 'Jefe'
  or (public.mi_rol() = 'Experto' and asignado_a = public.mi_usuario_id())
);

-- historial
create policy historial_select on public.historial_tickets for select to authenticated
using (exists (select 1 from public.tickets t where t.id = ticket_id));

create policy historial_insert on public.historial_tickets for insert to authenticated
with check (
  usuario_id = public.mi_usuario_id()
  and public.mi_rol() in ('Jefe', 'Experto')
);

-- registros de ingreso
create policy ingreso_select on public.registros_ingreso for select to authenticated
using (public.mi_rol() = 'Jefe' or usuario_id = public.mi_usuario_id());

create policy ingreso_insert on public.registros_ingreso for insert to authenticated
with check (usuario_id = public.mi_usuario_id());

-- 6. Asignar roles especiales (ejemplos, ejecutar a mano):
-- update public.usuarios set rol = 'Jefe'    where correo = 'jefe@ejemplo.com';
-- update public.usuarios set rol = 'Experto' where correo = 'experto@ejemplo.com';
