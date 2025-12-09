import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CheckCircle, Users, Phone, Mail, Package, DollarSign, Search, Send, Trash2, CircleSlash, IdCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Registration {
  id: string;
  student_name: string;
  student_email: string;
  student_phone: string;
  student_registration_number: string;
  donation_type: string | null;
  donation_amount: string | null;
  confirmed_presence: boolean;
  attended: boolean;
  created_at: string;
  class: {
    title: string;
    date: string;
    location: string;
  };
}

const monetaryDonationTypes = ['pagamento_antecipado', 'pagamento_hora', 'dinheiro'];

interface RegistrationsManagerProps {
  selectedClassId?: string;
  onAttendanceChange?: () => void | Promise<void>;
}

const RegistrationsManager = ({ selectedClassId, onAttendanceChange }: RegistrationsManagerProps) => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [donationFilter, setDonationFilter] = useState('all');
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [deletingRegistrationId, setDeletingRegistrationId] = useState<string | null>(null);
  const [attendanceUpdatingId, setAttendanceUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadRegistrations();
  }, [selectedClassId]);

  useEffect(() => {
    filterRegistrations();
  }, [registrations, searchTerm, statusFilter, donationFilter]);

  const loadRegistrations = async () => {
    try {
      let query = supabase
        .from('class_registrations')
        .select(`
          *,
          class:scheduled_classes(title, date, location)
        `);

      if (selectedClassId) {
        query = query.eq('class_id', selectedClassId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      console.error('Erro ao carregar inscrições:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as inscrições.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterRegistrations = () => {
    let filtered = registrations;

    // Filtro por texto
    if (searchTerm) {
      filtered = filtered.filter(reg =>
        reg.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.student_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.student_registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.class.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      if (statusFilter === 'confirmed') {
        filtered = filtered.filter(reg => reg.confirmed_presence);
      } else if (statusFilter === 'pending') {
        filtered = filtered.filter(reg => !reg.confirmed_presence);
      } else if (statusFilter === 'attended') {
        filtered = filtered.filter(reg => reg.attended);
      }
    }

    // Filtro por tipo de doação
    if (donationFilter !== 'all') {
      if (donationFilter === 'none') {
        filtered = filtered.filter(reg => !reg.donation_type);
      } else {
        filtered = filtered.filter(reg => reg.donation_type === donationFilter);
      }
    }

    setFilteredRegistrations(filtered);
  };

  const handleConfirmPresence = async (registrationId: string, confirmed: boolean) => {
    try {
      const { error } = await supabase
        .from('class_registrations')
        .update({ confirmed_presence: confirmed })
        .eq('id', registrationId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Presença ${confirmed ? 'confirmada' : 'removida'} com sucesso!`,
      });

      await loadRegistrations();

      if (onAttendanceChange) {
        await onAttendanceChange();
      }
    } catch (error) {
      console.error('Erro ao atualizar presença:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a presença.",
        variant: "destructive",
      });
    }
  };

  const handleMarkAttendance = async (registrationId: string, attended: boolean) => {
    setAttendanceUpdatingId(registrationId);

    try {
      const { data: updatedRegistrations, error: updateError } = await supabase
        .from('class_registrations')
        .update({ attended, confirmed_presence: attended })
        .eq('id', registrationId)
        .select('id, class_id, donation_type, donation_amount');

      if (updateError) throw updateError;

      let warningDescription: string | null = null;
      const registration = updatedRegistrations?.[0];

      setRegistrations((prevRegistrations) =>
        prevRegistrations.map((prevRegistration) =>
          prevRegistration.id === registrationId
            ? {
                ...prevRegistration,
                attended,
                confirmed_presence: attended,
              }
            : prevRegistration
        )
      );

      if (
        attended &&
        registration &&
        registration.donation_type &&
        monetaryDonationTypes.includes(registration.donation_type)
      ) {
        const { data: existingDonations, error: existingDonationsError } = await supabase
          .from('donations')
          .select('id')
          .eq('registration_id', registrationId)
          .eq('type', 'dinheiro');

        if (existingDonationsError) {
          console.error('Erro ao verificar doações existentes:', existingDonationsError);
          warningDescription = 'Participação registrada, mas não foi possível verificar doações existentes para esta inscrição.';
        } else if (!existingDonations || existingDonations.length === 0) {
          let donationAmount: number | null = null;

          if (registration.donation_amount !== null && registration.donation_amount !== '') {
            const parsedAmount = Number(registration.donation_amount);
            donationAmount = Number.isFinite(parsedAmount) ? parsedAmount : null;
          }

          const { error: insertDonationError } = await supabase.from('donations').insert({
            class_id: registration.class_id,
            registration_id: registrationId,
            type: 'dinheiro',
            amount: donationAmount,
          });

          if (insertDonationError) {
            console.error('Erro ao registrar doação:', insertDonationError);
            warningDescription = 'Participação registrada, mas não foi possível registrar a doação automaticamente.';
          }
        }
      }

      toast({
        title: "Sucesso",
        description: attended
          ? 'Participação registrada e presença confirmada com sucesso!'
          : 'Participação removida e presença desmarcada com sucesso!',
      });

      if (warningDescription) {
        toast({
          title: 'Atenção',
          description: warningDescription,
          variant: 'destructive',
        });
      }

      await loadRegistrations();

      if (onAttendanceChange) {
        await onAttendanceChange();
      }
    } catch (error) {
      console.error('Erro ao marcar participação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar a participação.",
        variant: "destructive",
      });
    } finally {
      setAttendanceUpdatingId(null);
    }
  };

  const handleDeleteRegistration = async (registrationId: string) => {
    setDeletingRegistrationId(registrationId);

    try {
      const { error } = await supabase
        .from('class_registrations')
        .delete()
        .eq('id', registrationId);

      if (error) throw error;

      toast({
        title: "Inscrição removida",
        description: "A inscrição foi excluída com sucesso.",
      });

      await loadRegistrations();
    } catch (error) {
      console.error('Erro ao excluir inscrição:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a inscrição.",
        variant: "destructive",
      });
    } finally {
      setDeletingRegistrationId(null);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedClassId) {
      toast({
        title: "Erro",
        description: "Nenhum aulão selecionado.",
        variant: "destructive",
      });
      return;
    }

    setSendingEmail(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-class-email', {
        body: {
          classId: selectedClassId
        }
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: data.message || "E-mails enviados com sucesso!",
      });
      
      setEmailDialogOpen(false);
    } catch (error: any) {
      console.error('Erro ao enviar e-mails:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível enviar os e-mails.",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const confirmedCount = registrations.filter(r => r.confirmed_presence).length;
  const attendedCount = registrations.filter(r => r.attended).length;
  const foodDonations = registrations.filter(r => r.donation_type === 'alimento').length;
  const financialDonations = registrations.filter(
    r => r.donation_type !== null && monetaryDonationTypes.includes(r.donation_type)
  ).length;
  const noDonationCount = registrations.filter(r => !r.donation_type).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando inscrições...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Inscrições</h2>
          <p className="text-muted-foreground">Confirme presenças e acompanhe participações</p>
        </div>
        
        {selectedClassId && registrations.length > 0 && (
          <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero">
                <Send className="h-4 w-4 mr-2" />
                Enviar E-mail aos Participantes
              </Button>
            </DialogTrigger>
            
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enviar E-mail aos Participantes</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Isso enviará um e-mail personalizado para todos os {registrations.length} participantes inscritos neste aulão.
                </p>
                
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">📧 O e-mail incluirá:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Informações detalhadas do aulão</li>
                    <li>• Data, horário e local</li>
                    <li>• Materiais necessários</li>
                    <li>• Tópicos que serão abordados</li>
                    <li>• Lembrete sobre a doação</li>
                  </ul>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  💡 Para personalizar o conteúdo do e-mail, acesse a aba "Aulões" e use a seção "Personalizar E-mails".
                </p>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSendEmail} 
                    disabled={sendingEmail}
                    className="flex-1"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {sendingEmail ? 'Enviando...' : 'Enviar E-mails'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setEmailDialogOpen(false)}
                    disabled={sendingEmail}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Inscrições</p>
                <p className="text-2xl font-bold text-primary">{registrations.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Confirmadas</p>
                <p className="text-2xl font-bold text-success">{confirmedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        
        {/*
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Doações Alimento</p>
                <p className="text-2xl font-bold text-secondary">{foodDonations}</p>
              </div>
              <Package className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
        */}

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contribuições Financeiras</p>
                <p className="text-2xl font-bold text-accent">{financialDonations}</p>
              </div>
              <DollarSign className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sem Doação</p>
                <p className="text-2xl font-bold text-muted-foreground">{noDonationCount}</p>
              </div>
              <CircleSlash className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou aulão..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status da presença" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="confirmed">Presença confirmada</SelectItem>
                <SelectItem value="pending">Aguardando confirmação</SelectItem>
                <SelectItem value="attended">Participaram</SelectItem>
              </SelectContent>
            </Select>

            <Select value={donationFilter} onValueChange={setDonationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de doação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as doações</SelectItem>
                <SelectItem value="alimento">Alimentos</SelectItem>
                <SelectItem value="dinheiro">Dinheiro (geral)</SelectItem>
                <SelectItem value="pagamento_hora">Pagar na hora</SelectItem>
                <SelectItem value="pagamento_antecipado">Pagamento antecipado</SelectItem>
                <SelectItem value="none">Sem doação</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDonationFilter('all');
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Inscrições */}
      <div className="space-y-4">
        {filteredRegistrations.map((registration) => (
          <Card key={registration.id}>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                <div>
                  <h3 className="font-semibold">{registration.student_name}</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <IdCard className="h-3 w-3" />
                      {registration.student_registration_number}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {registration.student_email}
                    </div>
                    {registration.student_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {registration.student_phone}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <p className="font-medium">{registration.class.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(registration.class.date).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-xs text-muted-foreground">{registration.class.location}</p>
                </div>

                <div className="space-y-2">
                  {registration.donation_type ? (
                    <Badge
                      variant={registration.donation_type === 'alimento' ? 'outline' : 'secondary'}
                      className={registration.donation_type === 'alimento' ? 'text-secondary' : ''}
                    >
                      {registration.donation_type === 'alimento' ? (
                        <>
                          <Package className="h-3 w-3 mr-1" />
                          Alimento
                        </>
                      ) : registration.donation_type === 'pagamento_hora' ? (
                        <>
                          <DollarSign className="h-3 w-3 mr-1" />
                          Pagar na hora
                        </>
                      ) : registration.donation_type === 'pagamento_antecipado' ? (
                        <>
                          <DollarSign className="h-3 w-3 mr-1" />
                          Pago antecipado
                        </>
                      ) : (
                        <>
                          <DollarSign className="h-3 w-3 mr-1" />
                          Dinheiro
                        </>
                      )}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      <CircleSlash className="h-3 w-3 mr-1" />
                      Sem doação
                    </Badge>
                  )}
                  {registration.donation_amount && (
                    <p className="text-xs text-muted-foreground">
                      {registration.donation_amount}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-1">
                    {registration.confirmed_presence && (
                      <Badge className="bg-success text-success-foreground text-xs">
                        Confirmado
                      </Badge>
                    )}
                    {registration.attended && (
                      <Badge className="bg-primary text-primary-foreground text-xs">
                        Participou
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant={registration.attended ? "outline" : "default"}
                    onClick={() => handleMarkAttendance(registration.id, !registration.attended)}
                    disabled={registration.attended || attendanceUpdatingId === registration.id}
                  >
                    {attendanceUpdatingId === registration.id
                      ? 'Atualizando...'
                      : registration.attended
                        ? 'Participação Verificada!'
                        : 'Marcar como Participou'}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={deletingRegistrationId === registration.id}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {deletingRegistrationId === registration.id ? 'Excluindo...' : 'Excluir Inscrição'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir inscrição</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. Tem certeza que deseja excluir a inscrição de {registration.student_name}?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteRegistration(registration.id)}
                          disabled={deletingRegistrationId === registration.id}
                        >
                          Confirmar exclusão
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRegistrations.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {registrations.length === 0 ? 'Nenhuma inscrição encontrada' : 'Nenhuma inscrição corresponde aos filtros'}
            </h3>
            <p className="text-muted-foreground">
              {registrations.length === 0 
                ? 'As inscrições dos estudantes aparecerão aqui quando começarem a se registrar nos aulões.'
                : 'Tente ajustar os filtros para ver mais resultados.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RegistrationsManager;
