-- Expandir opções de doação para incluir tipos específicos de pagamento
ALTER TABLE class_registrations 
DROP CONSTRAINT IF EXISTS class_registrations_donation_type_check;

-- Criar nova constraint com mais opções
ALTER TABLE class_registrations 
ADD CONSTRAINT class_registrations_donation_type_check 
CHECK (donation_type IN ('alimento', 'dinheiro', 'pagamento_hora', 'pagamento_antecipado'));

-- Adicionar coluna para armazenar detalhes do tipo de pagamento
ALTER TABLE class_registrations
ADD COLUMN payment_method TEXT;

-- Adicionar coluna para URL do comprovante de pagamento
ALTER TABLE class_registrations
ADD COLUMN payment_proof_url TEXT;

-- Criar tabela para armazenar informações detalhadas de pagamento
CREATE TABLE payment_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES class_registrations(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('dinheiro_antecipado', 'dinheiro_hora')),
  amount DECIMAL(10,2),
  proof_file_name TEXT,
  proof_file_url TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_payment_details_updated_at
  BEFORE UPDATE ON payment_details
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Índices para melhor performance
CREATE INDEX idx_payment_details_registration_id ON payment_details(registration_id);
CREATE INDEX idx_payment_details_status ON payment_details(status);

-- RLS para payment_details
ALTER TABLE payment_details ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção de novos detalhes de pagamento
CREATE POLICY "Permitir criação de detalhes de pagamento"
ON payment_details
FOR INSERT
WITH CHECK (true);

-- Política para visualização dos detalhes de pagamento
CREATE POLICY "Permitir visualização de detalhes de pagamento"
ON payment_details
FOR SELECT
USING (true);

-- Política para atualização (apenas sistema/admin)
CREATE POLICY "Sistema pode atualizar detalhes de pagamento"
ON payment_details
FOR UPDATE
USING (true);