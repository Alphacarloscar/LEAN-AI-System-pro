BEGIN;

UPDATE auth.users
SET 
  email = 'superadmin@test.dev',
  raw_user_meta_data = raw_user_meta_data || '{"email": "superadmin@test.dev"}'::jsonb
WHERE email = 'david.baquero@consultoriaalpha.com';

UPDATE public.profiles
SET email = 'superadmin@test.dev'
WHERE email = 'david.baquero@consultoriaalpha.com';

COMMIT;