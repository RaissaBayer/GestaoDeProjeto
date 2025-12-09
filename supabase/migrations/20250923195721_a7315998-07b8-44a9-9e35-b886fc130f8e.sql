-- Corrigir políticas RLS para scheduled_classes para permitir administradores
-- Primeiro, remover as políticas existentes que estão bloqueando tudo
DROP POLICY IF EXISTS "Somente sistema pode criar aulões" ON scheduled_classes;
DROP POLICY IF EXISTS "Somente sistema pode atualizar aulões" ON scheduled_classes;

-- Criar políticas que permitem administradores autenticados
-- Nota: Como não temos auth implementado ainda, vamos permitir todas as operações por enquanto
-- e depois quando implementarmos auth, podemos restringir apenas para admins

-- Permitir inserção para todos (temporário até implementar auth)
CREATE POLICY "Permitir criação de aulões" 
ON scheduled_classes 
FOR INSERT 
WITH CHECK (true);

-- Permitir atualização para todos (temporário até implementar auth)
CREATE POLICY "Permitir atualização de aulões" 
ON scheduled_classes 
FOR UPDATE 
USING (true);