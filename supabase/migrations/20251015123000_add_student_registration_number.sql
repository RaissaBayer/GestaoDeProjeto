alter table class_registrations
  add column if not exists student_registration_number text not null default '';
