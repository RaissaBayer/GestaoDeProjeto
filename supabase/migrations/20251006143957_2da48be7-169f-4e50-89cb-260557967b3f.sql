-- Remover a constraint antiga que impede a exclusão de ministrantes
ALTER TABLE scheduled_classes 
DROP CONSTRAINT IF EXISTS scheduled_classes_teacher_id_fkey;

-- Adicionar nova constraint com ON DELETE SET NULL
-- Isso permite que quando um ministrante for excluído, as aulas associadas terão teacher_id definido como NULL
ALTER TABLE scheduled_classes
ADD CONSTRAINT scheduled_classes_teacher_id_fkey 
FOREIGN KEY (teacher_id) 
REFERENCES volunteer_teachers(id) 
ON DELETE SET NULL;