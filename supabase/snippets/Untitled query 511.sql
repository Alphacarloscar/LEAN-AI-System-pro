SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'projects'
AND column_name IN ('objetivo_principal', 'horizonte_valor', 'ecosistema_tecnologico', 'restricciones', 'fricciones_oportunidades')
ORDER BY column_name;