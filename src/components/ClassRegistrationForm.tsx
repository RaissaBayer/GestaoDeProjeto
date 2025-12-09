import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { incrementPlatformStatistic } from "@/lib/platformStatistics";
import { formatDateToLocale, formatTimeToHoursMinutes } from "@/lib/utils";
import { Upload, DollarSign, Package } from "lucide-react";

type DonationOption = "alimento" | "pagamento_hora" | "pagamento_antecipado";

interface RegistrationFormData {
  student_name: string;
  student_email: string;
  student_phone: string;
  student_registration_number: string;
  donation_type: DonationOption | null;
  donation_amount: string;
}

interface ClassRegistrationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classData?: {
    id: string;
    title: string;
    date: string;
    start_time: string;
    end_time: string;
    location: string;
  };
}

const ClassRegistrationForm = ({ open, onOpenChange, classData }: ClassRegistrationFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<RegistrationFormData>({
    student_name: "",
    student_email: "",
    student_phone: "",
    student_registration_number: "",
    donation_type: null,
    donation_amount: "",
  });
  const [paymentProof, setPaymentProof] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classData) return;

    setLoading(true);
    try {
      // Inserir inscrição na tabela class_registrations
      const { data: registrationData, error: registrationError } = await supabase
        .from('class_registrations')
        .insert({
          class_id: classData.id,
          student_name: formData.student_name,
          student_email: formData.student_email,
          student_phone: formData.student_phone,
          student_registration_number: formData.student_registration_number,
          donation_type: formData.donation_type || null,
          donation_amount: formData.donation_amount || null,
        })
        .select()
        .single();

      if (registrationError) throw registrationError;

      // Se é pagamento antecipado, criar registro na tabela payment_details
      if (formData.donation_type === 'pagamento_antecipado' && registrationData) {
        const { error: paymentError } = await supabase
          .from('payment_details')
          .insert({
            registration_id: registrationData.id,
            payment_type: 'dinheiro_antecipado',
            amount: parseFloat(formData.donation_amount) || null,
            proof_file_name: paymentProof?.name || null,
            payment_date: new Date().toISOString(),
            status: 'pending'
          });

        if (paymentError) {
          console.error('Erro ao salvar detalhes do pagamento:', paymentError);
          // Não bloquear a inscrição por causa disso
        }
      }

      toast({
        title: "Inscrição realizada com sucesso!",
        description: "Você receberá um e-mail de confirmação em breve.",
      });

      try {
        await incrementPlatformStatistic("total_students");
      } catch (statsError) {
        console.error("Erro ao atualizar estatísticas de alunos:", statsError);
      }

      // Reset form
      setFormData({
        student_name: "",
        student_email: "",
        student_phone: "",
        student_registration_number: "",
        donation_type: null,
        donation_amount: "",
      });
      setPaymentProof(null);
      onOpenChange(false);

    } catch (error) {
      console.error('Erro ao fazer inscrição:', error);
      toast({
        title: "Erro ao fazer inscrição",
        description: "Tente novamente em alguns minutos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentProof(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gradient-hero">
            Garantir Vaga - {classData?.title}
          </DialogTitle>
        </DialogHeader>

        {classData && (
          <Card className="mb-6">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Data:</strong> {formatDateToLocale(classData.date)}
                </div>
                <div>
                  <strong>Horário:</strong> {formatTimeToHoursMinutes(classData.start_time)} - {formatTimeToHoursMinutes(classData.end_time)}
                </div>
                <div className="col-span-2">
                  <strong>Local:</strong> {classData.location}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Pessoais */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Dados Pessoais</h3>
            
            <div>
              <Label htmlFor="student_name">Nome completo *</Label>
              <Input
                id="student_name"
                value={formData.student_name}
                onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="student_email">E-mail *</Label>
              <Input
                id="student_email"
                type="email"
                value={formData.student_email}
                onChange={(e) => setFormData({ ...formData, student_email: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="student_registration_number">Número de matrícula *</Label>
              <Input
                id="student_registration_number"
                value={formData.student_registration_number}
                onChange={(e) =>
                  setFormData({ ...formData, student_registration_number: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="student_phone">Telefone</Label>
              <Input
                id="student_phone"
                type="tel"
                value={formData.student_phone}
                onChange={(e) => setFormData({ ...formData, student_phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          {/* Opções de Contribuição */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Gostaria de realizar uma contribuição para o Aulão Solidário? (opcional)</h3>
            
            <RadioGroup
              value={formData.donation_type ?? ""}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  donation_type:
                    prev.donation_type === value ? null : (value as DonationOption),
                }))
              }
            >
              {/*
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="alimento" id="alimento" />
                <Label htmlFor="alimento" className="flex items-center cursor-pointer">
                  <Package className="h-4 w-4 mr-2 text-success" />
                  Levar 1kg de alimento não perecível
                </Label>
              </div>
              */}
              
              {/*
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="pagamento_hora" id="pagamento_hora" />
                <Label htmlFor="pagamento_hora" className="flex items-center cursor-pointer">
                  <DollarSign className="h-4 w-4 mr-2 text-secondary" />
                  Pagar na hora do aulão
                </Label>
              </div>
              */}

              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="pagamento_antecipado" id="pagamento_antecipado" />
                <Label htmlFor="pagamento_antecipado" className="flex items-center cursor-pointer">
                  <Upload className="h-4 w-4 mr-2 text-primary" />
                  Sim, gostaria de ajudar com o projeto 😁 (opcional: 3,00)
                </Label>
              </div>
            </RadioGroup>

            {/* Campos condicionais baseados na opção selecionada */}
            {formData.donation_type === "pagamento_hora" && (
              <div>
                <Label htmlFor="donation_amount">Valor que pretende pagar (opcional)</Label>
                <Input
                  id="donation_amount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.donation_amount}
                  onChange={(e) => setFormData({ ...formData, donation_amount: e.target.value })}
                  placeholder="Ex: 10.00"
                />
              </div>
            )}

            {formData.donation_type === "pagamento_antecipado" && (
  <div className="space-y-3">
    <div className="flex flex-col gap-2">
      <Label
        htmlFor="donation_amount"
        className="block text-sm font-medium text-muted-foreground"
      >
        Por favor, utilize a chave Pix no email:
      </Label>

      <span className="block px-3 py-2 rounded-md bg-green-100 text-green-700 font-semibold text-sm w-fit shadow-sm">
        aulao.solidario@ufv.br
      </span>

      <Label
        htmlFor="donation_amount"
        className="block text-sm font-medium text-muted-foreground mt-2"
      >
        Valor pago *
      </Label>

      <Input
        id="donation_amount"
        type="number"
        min="1"
        step="0.01"
        value={formData.donation_amount}
        onChange={(e) =>
          setFormData({ ...formData, donation_amount: e.target.value })
        }
        placeholder="Ex: 3,00"
        required={formData.donation_type === "pagamento_antecipado"}
      />
    </div>

    <div className="flex flex-col gap-2">
      <Label htmlFor="payment_proof" className="block">
        Comprovante de pagamento (opcional)
      </Label>
      <Input
        id="payment_proof"
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileChange}
        className="cursor-pointer"
      />
      {paymentProof && (
        <p className="text-sm text-muted-foreground mt-1">
          Arquivo selecionado: {paymentProof.name}
        </p>
      )}
    </div>
  </div>
)}

          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Inscrevendo..." : "Garantir Vaga"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClassRegistrationForm;
