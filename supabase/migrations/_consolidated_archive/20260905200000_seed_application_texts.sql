-- Seed: Application Texts (Textos por Herramienta)
-- Carga textos iniciales de diferentes módulos para que los administradores puedan editarlos

BEGIN;

-- T1: Maturity Radar
INSERT INTO public.application_texts (tool_module, text_key, filename, text_override) VALUES
  ('t1', 'radar.title', 'T1View.tsx:45', 'Radar de Madurez'),
  ('t1', 'radar.subtitle', 'T1View.tsx:46', 'Evaluación del estado actual de transformación'),
  ('t1', 'radar.dimension.strategia', 'T1View.tsx:120', 'Estrategia'),
  ('t1', 'radar.dimension.organizacion', 'T1View.tsx:121', 'Organización'),
  ('t1', 'radar.dimension.tecnologia', 'T1View.tsx:122', 'Tecnología'),
  ('t1', 'dimension.select.label', 'IntervieweeSelector.tsx:30', 'Selecciona una dimensión');

-- T10: AI Value Dashboard
INSERT INTO public.application_texts (tool_module, text_key, filename, text_override) VALUES
  ('t10', 'dashboard.title', 'T10View.tsx:50', 'Dashboard de Valor AI'),
  ('t10', 'dashboard.total_initiatives', 'T10View.tsx:85', 'Total de Iniciativas'),
  ('t10', 'dashboard.expected_value', 'T10View.tsx:86', 'Valor Esperado'),
  ('t10', 'dashboard.filters', 'T10View.tsx:120', 'Filtros');

-- T11: Operating Rhythm
INSERT INTO public.application_texts (tool_module, text_key, filename, text_override) VALUES
  ('t11', 'rhythm.title', 'T11View.tsx:40', 'Ritmo Operacional'),
  ('t11', 'rhythm.quarterly_review', 'T11View.tsx:70', 'Revisión Trimestral'),
  ('t11', 'rhythm.roadmap', 'T11View.tsx:75', 'Mapa de Ruta'),
  ('t11', 'rhythm.save_button', 'T11View.tsx:180', 'Guardar Cambios');

-- T12: ISO Assessment
INSERT INTO public.application_texts (tool_module, text_key, filename, text_override) VALUES
  ('t12', 'assessment.title', 'T12View.tsx:45', 'Evaluación ISO'),
  ('t12', 'assessment.standard', 'T12View.tsx:60', 'Estándar ISO/IEC'),
  ('t12', 'assessment.controls', 'T12View.tsx:120', 'Controles de Gobernanza'),
  ('t12', 'assessment.status', 'T12View.tsx:155', 'Estado Actual');

-- Admin Panel
INSERT INTO public.application_texts (tool_module, text_key, filename, text_override) VALUES
  ('admin', 'admin.title', 'AdminView.tsx:50', 'Panel de Administración'),
  ('admin', 'admin.companies', 'AdminView.tsx:95', 'Empresas'),
  ('admin', 'admin.users', 'AdminView.tsx:96', 'Usuarios'),
  ('admin', 'admin.projects', 'AdminView.tsx:97', 'Proyectos');

-- Admin Authentication
INSERT INTO public.application_texts (tool_module, text_key, filename, text_override) VALUES
  ('admin_auth', 'auth.login_title', 'LoginView.tsx:30', 'Iniciar Sesión'),
  ('admin_auth', 'auth.email_label', 'LoginView.tsx:60', 'Correo Electrónico'),
  ('admin_auth', 'auth.password_label', 'LoginView.tsx:65', 'Contraseña'),
  ('admin_auth', 'auth.login_button', 'LoginView.tsx:120', 'Ingresar');

-- Company Profile
INSERT INTO public.application_texts (tool_module, text_key, filename, text_override) VALUES
  ('company_profile', 'profile.title', 'ProjectDetailView.tsx:40', 'Perfil de la Empresa'),
  ('company_profile', 'profile.company_info', 'ProjectDetailView.tsx:75', 'Información de la Empresa'),
  ('company_profile', 'profile.projects', 'ProjectDetailView.tsx:76', 'Proyectos'),
  ('company_profile', 'profile.save', 'ProjectDetailView.tsx:200', 'Guardar');

-- Navigation
INSERT INTO public.application_texts (tool_module, text_key, filename, text_override) VALUES
  ('navegacion', 'nav.home', 'AppSidebar.tsx:30', 'Inicio'),
  ('navegacion', 'nav.tools', 'AppSidebar.tsx:35', 'Herramientas'),
  ('navegacion', 'nav.admin', 'AppSidebar.tsx:45', 'Administración'),
  ('navegacion', 'nav.logout', 'AppSidebar.tsx:200', 'Cerrar Sesión');

COMMIT;
