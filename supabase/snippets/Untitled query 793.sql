SELECT created_at, service_name, method_name, status, user_email, duration_ms
FROM public.audit_logs
ORDER BY created_at DESC
LIMIT 10;