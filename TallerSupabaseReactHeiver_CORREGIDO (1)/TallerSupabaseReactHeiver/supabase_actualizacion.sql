-- =====================================================================
-- Ejecutar en Supabase → SQL Editor. Seguro de correr varias veces.
-- =====================================================================

-- 1. Estados del flujo: Nuevo → Pendiente → Finalizado
insert into public.estados_ticket (nombre) values ('Nuevo'), ('Pendiente'), ('Finalizado')
on conflict (nombre) do nothing;

-- Migrar tickets que ya usaban los estados anteriores
update public.tickets set estado_id = (select id from public.estados_ticket where nombre = 'Pendiente')
where estado_id in (select id from public.estados_ticket where nombre in ('Asignado', 'En proceso'));

update public.tickets set estado_id = (select id from public.estados_ticket where nombre = 'Finalizado')
where estado_id in (select id from public.estados_ticket where nombre = 'Cerrado');

update public.historial_tickets set estado_anterior = (select id from public.estados_ticket where nombre = 'Pendiente')
where estado_anterior in (select id from public.estados_ticket where nombre in ('Asignado', 'En proceso'));
update public.historial_tickets set estado_nuevo = (select id from public.estados_ticket where nombre = 'Pendiente')
where estado_nuevo in (select id from public.estados_ticket where nombre in ('Asignado', 'En proceso'));
update public.historial_tickets set estado_anterior = (select id from public.estados_ticket where nombre = 'Finalizado')
where estado_anterior in (select id from public.estados_ticket where nombre = 'Cerrado');
update public.historial_tickets set estado_nuevo = (select id from public.estados_ticket where nombre = 'Finalizado')
where estado_nuevo in (select id from public.estados_ticket where nombre = 'Cerrado');

delete from public.estados_ticket where nombre in ('Asignado', 'En proceso', 'Cerrado');

-- 2. Actualización en vivo (Realtime) para que el Jefe vea los tickets nuevos sin recargar
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tickets'
  ) then
    alter publication supabase_realtime add table public.tickets;
  end if;
end $$;

-- 3. Confirmar los correos que quedaron pendientes de confirmación
update auth.users set email_confirmed_at = now() where email_confirmed_at is null;
