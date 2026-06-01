-- ================================================================
-- GOBY — gobytech_pro Production Setup
-- Bloque 01: BACKUP REMINDER
--
-- Este bloque NO ejecuta nada destructivo.
-- Imprime instrucciones obligatorias antes del reset.
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '================================================================';
  RAISE NOTICE 'BACKUP OBLIGATORIO ANTES DE CONTINUAR';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'PASOS MANUALES:';
  RAISE NOTICE '';
  RAISE NOTICE '  1. Supabase Dashboard → gobytech_pro';
  RAISE NOTICE '     Project Settings → Database → Backups';
  RAISE NOTICE '     → Descargar el último backup disponible';
  RAISE NOTICE '     → Guardar en lugar seguro (nombre: gobytech_pro_pre_migration_FECHA.sql)';
  RAISE NOTICE '';
  RAISE NOTICE '  2. Si no hay backup automático disponible:';
  RAISE NOTICE '     Conectar pg_dump con la connection string de gobytech_pro:';
  RAISE NOTICE '     pg_dump "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" > backup.sql';
  RAISE NOTICE '';
  RAISE NOTICE '  3. Confirmar backup guardado ANTES de ejecutar 02_RESET_PUBLIC_SCHEMA.sql';
  RAISE NOTICE '';
  RAISE NOTICE 'El bloque 02 es DESTRUCTIVO e IRREVERSIBLE sin backup.';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'PLAN DE ROLLBACK (si algo sale mal):';
  RAISE NOTICE '  1. Restaurar backup desde Dashboard o pg_restore';
  RAISE NOTICE '  2. gobytech_pro vuelve al estado anterior';
  RAISE NOTICE '  3. Revisar el error, corregir el script, reintentar';
  RAISE NOTICE '';
  RAISE NOTICE 'CONFIRMACIÓN: Cuando hayas hecho el backup, escribe en el chat:';
  RAISE NOTICE '  "backup confirmado" y continúa con el bloque 02.';
  RAISE NOTICE '================================================================';
END $$;
