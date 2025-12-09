import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Package, DollarSign, Building2, TrendingUp, Users, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TransparenciaSection = () => {
  const [donations, setDonations] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [stats, setStats] = useState({
    totalFood: 0,
    totalMoney: 0,
    totalInstitutions: 0,
    totalClasses: 0,
  });

  useEffect(() => {
    fetchAvailableYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchDonations();
      fetchClassesCount();
    }
  }, [selectedYear]);

  const fetchAvailableYears = async () => {
    const { data, error } = await supabase
      .from("donations_institutions")
      .select("donation_date")
      .order("donation_date", { ascending: false });

    if (data) {
      const years = new Set(
        data
          .filter(d => d.donation_date)
          .map(d => new Date(d.donation_date).getFullYear().toString())
      );
      const yearsList = Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
      setAvailableYears(yearsList.length > 0 ? yearsList : [new Date().getFullYear().toString()]);
    }
  };

  const fetchDonations = async () => {
    const startDate = `${selectedYear}-01-01`;
    const endDate = `${selectedYear}-12-31`;

    const { data, error } = await supabase
      .from("donations_institutions")
      .select("*, institution:institutions(*)")
      .gte("donation_date", startDate)
      .lte("donation_date", endDate)
      .order("donation_date", { ascending: false });

    if (error) {
      console.error("Erro ao buscar doações:", error);
      return;
    }

    if (data) {
      setDonations(data);
      
      // Calcular estatísticas
      const totalFood = data.reduce((sum, d) => sum + (d.food_weight_kg || 0), 0);
      const totalMoney = data.reduce((sum, d) => sum + (d.amount || 0), 0);
      const uniqueInstitutions = new Set(data.map(d => d.institution_id).filter(Boolean));
      
      setStats(prev => ({
        ...prev,
        totalFood,
        totalMoney,
        totalInstitutions: uniqueInstitutions.size,
      }));
    }
  };

  const fetchClassesCount = async () => {
    const startDate = `${selectedYear}-01-01`;
    const endDate = `${selectedYear}-12-31`;

    const { data, error } = await supabase
      .from("scheduled_classes")
      .select("id")
      .gte("date", startDate)
      .lte("date", endDate);

    if (data) {
      setStats(prev => ({
        ...prev,
        totalClasses: data.length,
      }));
    }
  };


  const formatDonation = (donation: any) => {
    if (donation.type === "alimento" && donation.food_weight_kg) {
      return `${donation.food_weight_kg}kg de alimentos`;
    } else if (donation.type === "dinheiro" && donation.amount) {
      return `R$ ${donation.amount.toFixed(2)}`;
    }
    return donation.description || "Doação registrada";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Data não informada";
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  return (
    <section id="doacoes" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gradient-hero mb-4">
            Transparência das Doações
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Acompanhe o impacto real dos nossos aulões solidários. Toda doação é registrada e 
            destinada integralmente às instituições parceiras.
          </p>
          
          <div className="flex justify-center mt-6">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione o ano" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-12">
          {/*
          <Card className="text-center shadow-success">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-6 w-6 text-success" />
              </div>
              <div className="text-2xl font-bold text-success mb-1">
                {doacoesData.alimentos.arrecadado}{doacoesData.alimentos.unidade}
              </div>
              <p className="text-sm text-muted-foreground">Alimentos Arrecadados</p>
              <Progress 
                value={(doacoesData.alimentos.arrecadado / doacoesData.alimentos.meta) * 100} 
                className="mt-2"
              />
            </CardContent>
          </Card>
          */}

          <Card className="text-center shadow-medium">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary mb-1">
                R$ {stats.totalMoney.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">Valores Arrecadados</p>
            </CardContent>
          </Card>

          <Card className="text-center shadow-medium">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <div className="text-2xl font-bold text-secondary mb-1">
                {stats.totalInstitutions}
              </div>
              <p className="text-sm text-muted-foreground">Instituições Beneficiadas</p>
            </CardContent>
          </Card>

          {/*
          <Card className="text-center shadow-medium">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <div className="text-2xl font-bold text-accent mb-1">
                {stats.totalClasses}
              </div>
              <p className="text-sm text-muted-foreground">Aulões Realizados</p>
            </CardContent>
          </Card>
          */}
        </div>

        {/* Doações Realizadas */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-3 text-primary" />
              Doações Realizadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {donations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma doação registrada ainda.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {donations.map((donation) => (
                  <div key={donation.id} className="p-4 border rounded-lg hover:shadow-soft transition-smooth">
                    <h4 className="font-semibold text-primary mb-1">
                      {donation.institution?.name || "Instituição não informada"}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {donation.institution?.type || "Tipo não informado"}
                    </p>
                    <div className="text-sm space-y-1">
                      <p className="font-medium text-success">
                        {formatDonation(donation)}
                      </p>
                      {donation.description && (
                        <p className="text-xs text-muted-foreground">
                          {donation.description}
                        </p>
                      )}
                      <div className="flex items-center text-xs text-muted-foreground mt-2">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(donation.donation_date)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            * Dados atualizados mensalmente. Para mais detalhes, entre em contato conosco.
          </p>
        </div>
      </div>
    </section>
  );
};

export default TransparenciaSection;
