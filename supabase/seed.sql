insert into public.data_types (code, label, dialect)
values
  ('uuid', 'UUID', 'postgres'),
  ('text', 'Text', 'postgres'),
  ('integer', 'Integer', 'postgres')
on conflict do nothing;
