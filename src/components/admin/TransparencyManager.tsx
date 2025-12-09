import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, Building2, DollarSign } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

interface Institution {
  id: string;
  name: string;
  type: string;
  contact_info: string | null;
  address: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface Donation {
  id: string;
  institution_id: string | null;
  amount: number | null;
  food_weight_kg: number | null;
  description: string | null;
  type: string;
  donation_date: string | null;
  institution?: Institution;
}

const TransparencyManager = () => {
  const { toast } = useToast();
  const { admin } = useAuth();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null);
  const [newInstitution, setNewInstitution] = useState({
    name: "",
    type: "",
    contact_info: "",
    address: "",
    description: "",
  });
  const [newDonation, setNewDonation] = useState({
    institution_id: "",
    amount: "",
    food_weight_kg: "",
    description: "",
    type: "dinheiro",
    donation_date: "",
  });

  useEffect(() => {
    fetchInstitutions();
    fetchDonations();
  }, []);

  const fetchInstitutions = async () => {
    const { data, error } = await supabase
      .from("institutions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar instituições",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setInstitutions(data || []);
    }
  };

  const fetchDonations = async () => {
    const { data, error } = await supabase
      .from("donations_institutions")
      .select("*, institution:institutions(*)")
      .order("donation_date", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar doações",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setDonations(data || []);
    }
  };

  const handleSaveInstitution = async () => {
    if (!newInstitution.name || !newInstitution.type) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome e tipo da instituição",
        variant: "destructive",
      });
      return;
    }

    if (!admin) {
      toast({
        title: "Acesso restrito",
        description: "É necessário estar autenticado como administrador para realizar esta ação.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingInstitution) {
        const { error } = await supabase.rpc("admin_update_institution", {
          p_admin_id: admin.id,
          p_institution_id: editingInstitution.id,
          p_name: newInstitution.name,
          p_type: newInstitution.type,
          p_contact_info: newInstitution.contact_info || null,
          p_address: newInstitution.address || null,
          p_description: newInstitution.description || null,
        });

        if (error) {
          console.error("Erro ao atualizar instituição:", error);
          toast({
            title: "Erro ao atualizar instituição",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sucesso",
            description: "Instituição atualizada com sucesso",
          });
          resetInstitutionForm();
          fetchInstitutions();
        }
      } else {
        const { data, error } = await supabase.rpc("admin_create_institution", {
          p_admin_id: admin.id,
          p_name: newInstitution.name,
          p_type: newInstitution.type,
          p_contact_info: newInstitution.contact_info || null,
          p_address: newInstitution.address || null,
          p_description: newInstitution.description || null,
        });

        if (error) {
          console.error("Erro ao criar instituição:", error);
          toast({
            title: "Erro ao criar instituição",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Sucesso",
            description: "Instituição criada com sucesso",
          });
          resetInstitutionForm();
          fetchInstitutions();
        }
      }
    } catch (err) {
      console.error("Erro inesperado:", err);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    }
  };

  const handleDeleteInstitution = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta instituição?")) return;

    if (!admin) {
      toast({
        title: "Acesso restrito",
        description: "É necessário estar autenticado como administrador para realizar esta ação.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.rpc("admin_delete_institution", {
      p_admin_id: admin.id,
      p_institution_id: id,
    });

    if (error) {
      toast({
        title: "Erro ao excluir instituição",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Instituição excluída com sucesso",
      });
      fetchInstitutions();
    }
  };

  const handleEditInstitution = (institution: Institution) => {
    setEditingInstitution(institution);
    setNewInstitution({
      name: institution.name,
      type: institution.type,
      contact_info: institution.contact_info || "",
      address: institution.address || "",
      description: institution.description || "",
    });
  };

  const resetInstitutionForm = () => {
    setEditingInstitution(null);
    setNewInstitution({
      name: "",
      type: "",
      contact_info: "",
      address: "",
      description: "",
    });
  };

  const handleSaveDonation = async () => {
    if (!newDonation.institution_id || !newDonation.type) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione uma instituição e o tipo de doação",
        variant: "destructive",
      });
      return;
    }

    const donationData = {
      institution_id: newDonation.institution_id,
      type: newDonation.type,
      amount: newDonation.amount ? parseFloat(newDonation.amount) : null,
      food_weight_kg: newDonation.food_weight_kg ? parseFloat(newDonation.food_weight_kg) : null,
      description: newDonation.description || null,
      donation_date: newDonation.donation_date || new Date().toISOString().split('T')[0],
    };

    const { error } = await supabase.from("donations_institutions").insert([donationData]);

    if (error) {
      toast({
        title: "Erro ao registrar doação",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Doação registrada com sucesso",
      });
      resetDonationForm();
      fetchDonations();
    }
  };

  const handleDeleteDonation = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta doação?")) return;

    const { error } = await supabase.from("donations_institutions").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir doação",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Doação excluída com sucesso",
      });
      fetchDonations();
    }
  };

  const resetDonationForm = () => {
    setNewDonation({
      institution_id: "",
      amount: "",
      food_weight_kg: "",
      description: "",
      type: "dinheiro",
      donation_date: "",
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="institutions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="institutions">
            <Building2 className="h-4 w-4 mr-2" />
            Instituições
          </TabsTrigger>
          <TabsTrigger value="donations">
            <DollarSign className="h-4 w-4 mr-2" />
            Doações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="institutions" className="space-y-4">
          {/* Formulário de Instituição */}
          <Card>
            <CardHeader>
              <CardTitle>
                {editingInstitution ? "Editar Instituição" : "Nova Instituição"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="inst-name">Nome *</Label>
                  <Input
                    id="inst-name"
                    value={newInstitution.name}
                    onChange={(e) =>
                      setNewInstitution({ ...newInstitution, name: e.target.value })
                    }
                    placeholder="Nome da instituição"
                  />
                </div>
                <div>
                  <Label htmlFor="inst-type">Tipo *</Label>
                  <Input
                    id="inst-type"
                    value={newInstitution.type}
                    onChange={(e) =>
                      setNewInstitution({ ...newInstitution, type: e.target.value })
                    }
                    placeholder="Ex: Orfanato, Asilo, Creche"
                  />
                </div>
                <div>
                  <Label htmlFor="inst-contact">Contato</Label>
                  <Input
                    id="inst-contact"
                    value={newInstitution.contact_info}
                    onChange={(e) =>
                      setNewInstitution({ ...newInstitution, contact_info: e.target.value })
                    }
                    placeholder="Email ou telefone"
                  />
                </div>
                <div>
                  <Label htmlFor="inst-address">Endereço</Label>
                  <Input
                    id="inst-address"
                    value={newInstitution.address}
                    onChange={(e) =>
                      setNewInstitution({ ...newInstitution, address: e.target.value })
                    }
                    placeholder="Endereço completo"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="inst-description">Descrição</Label>
                <Textarea
                  id="inst-description"
                  value={newInstitution.description}
                  onChange={(e) =>
                    setNewInstitution({ ...newInstitution, description: e.target.value })
                  }
                  placeholder="Informações adicionais sobre a instituição"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveInstitution}>
                  <Plus className="h-4 w-4 mr-2" />
                  {editingInstitution ? "Atualizar" : "Adicionar"}
                </Button>
                {editingInstitution && (
                  <Button variant="outline" onClick={resetInstitutionForm}>
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista de Instituições */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {institutions.map((institution) => (
              <Card key={institution.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg">{institution.name}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditInstitution(institution)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteInstitution(institution.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Tipo:</strong> {institution.type}
                  </p>
                  {institution.contact_info && (
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Contato:</strong> {institution.contact_info}
                    </p>
                  )}
                  {institution.address && (
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Endereço:</strong> {institution.address}
                    </p>
                  )}
                  {institution.description && (
                    <p className="text-sm text-muted-foreground">
                      {institution.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="donations" className="space-y-4">
          {/* Formulário de Doação */}
          <Card>
            <CardHeader>
              <CardTitle>Registrar Nova Doação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="don-institution">Instituição *</Label>
                  <Select
                    value={newDonation.institution_id}
                    onValueChange={(value) =>
                      setNewDonation({ ...newDonation, institution_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma instituição" />
                    </SelectTrigger>
                    <SelectContent>
                      {institutions.map((inst) => (
                        <SelectItem key={inst.id} value={inst.id}>
                          {inst.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="don-type">Tipo de Doação *</Label>
                  <Select
                    value={newDonation.type}
                    onValueChange={(value) =>
                      setNewDonation({ ...newDonation, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="alimentos">Alimentos</SelectItem>
                      <SelectItem value="misto">Misto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(newDonation.type === "dinheiro" || newDonation.type === "misto") && (
                  <div>
                    <Label htmlFor="don-amount">Valor (R$)</Label>
                    <Input
                      id="don-amount"
                      type="number"
                      step="0.01"
                      value={newDonation.amount}
                      onChange={(e) =>
                        setNewDonation({ ...newDonation, amount: e.target.value })
                      }
                      placeholder="0.00"
                    />
                  </div>
                )}
                {(newDonation.type === "alimentos" || newDonation.type === "misto") && (
                  <div>
                    <Label htmlFor="don-food">Peso (kg)</Label>
                    <Input
                      id="don-food"
                      type="number"
                      step="0.01"
                      value={newDonation.food_weight_kg}
                      onChange={(e) =>
                        setNewDonation({ ...newDonation, food_weight_kg: e.target.value })
                      }
                      placeholder="0.00"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="don-date">Data da Doação</Label>
                  <Input
                    id="don-date"
                    type="date"
                    value={newDonation.donation_date}
                    onChange={(e) =>
                      setNewDonation({ ...newDonation, donation_date: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="don-description">Descrição</Label>
                <Textarea
                  id="don-description"
                  value={newDonation.description}
                  onChange={(e) =>
                    setNewDonation({ ...newDonation, description: e.target.value })
                  }
                  placeholder="Observações sobre a doação"
                />
              </div>
              <Button onClick={handleSaveDonation}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Doação
              </Button>
            </CardContent>
          </Card>

          {/* Lista de Doações */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Doações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {donations.map((donation) => (
                  <div
                    key={donation.id}
                    className="flex items-start justify-between border-b pb-4 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {donation.institution?.name || "Instituição não especificada"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {donation.type === "dinheiro" && `R$ ${donation.amount?.toFixed(2)}`}
                        {donation.type === "alimentos" && `${donation.food_weight_kg}kg de alimentos`}
                        {donation.type === "misto" && 
                          `R$ ${donation.amount?.toFixed(2)} + ${donation.food_weight_kg}kg`
                        }
                      </p>
                      {donation.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {donation.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {donation.donation_date
                          ? new Date(donation.donation_date).toLocaleDateString("pt-BR")
                          : "Data não informada"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteDonation(donation.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TransparencyManager;
