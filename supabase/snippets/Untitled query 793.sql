-- Verifica cuántas filas hay antes de borrar
SELECT COUNT(*), interviewee_name, interviewee_role
FROM public.t1_dimension_scores
WHERE project_id = 'e2058bff-9759-465d-ae4d-df79fdf23815'
  AND interviewee_name = 'E2E-AuditBot'
GROUP BY interviewee_name, interviewee_role;

-- Ejecuta el borrado
DELETE FROM public.t1_dimension_scores
WHERE project_id = 'e2058bff-9759-465d-ae4d-df79fdf23815'
  AND interviewee_name = 'E2E-AuditBot';