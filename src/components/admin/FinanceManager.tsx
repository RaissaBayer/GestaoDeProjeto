import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Calendar, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FinanceData {
  total_money_donations: number;
  donations_by_class: {
    class_title: string;
    class_date: string;
    money_amount: number;
  }[];
  classes_with_donations: number;
}

const FinanceManager = () => {
  const [financeData, setFinanceData] = useState<FinanceData>({
    total_money_donations: 0,
    donations_by_class: [],
    classes_with_donations: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadFinanceData();
  }, []);

  const loadFinanceData = async () => {
    try {
      const { data: donations, error } = await supabase
        .from('donations')
        .select(`
          type,
          amount,
          class_id,
          class:scheduled_classes(title, date)
        `);

      if (error) throw error;

      let totalMoney = 0;
      const classDonations: {
        [key: string]: {
          title: string;
          date: string;
          money: number;
        };
      } = {};

      donations?.forEach((donation) => {
        if (donation.type !== 'dinheiro') {
          return;
        }

        const rawAmount = donation.amount ?? 0;
        const amount = typeof rawAmount === 'number'
          ? rawAmount
          : parseFloat(String(rawAmount).replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;

        if (amount <= 0) {
          return;
        }

        const classTitle = donation.class?.title ?? 'Aulão sem título';
        const classDate = donation.class?.date ?? '';
        const classKey = donation.class_id ?? `${classTitle}_${classDate}`;

        if (!classDonations[classKey]) {
          classDonations[classKey] = {
            title: classTitle,
            date: classDate,
            money: 0,
          };
        }

        classDonations[classKey].money += amount;
        totalMoney += amount;
      });

      const donationsByClass = Object.values(classDonations)
        .map((item) => ({
          class_title: item.title,
          class_date: item.date,
          money_amount: item.money,
        }))
        .sort((a, b) => new Date(b.class_date).getTime() - new Date(a.class_date).getTime());

      setFinanceData({
        total_money_donations: totalMoney,
        donations_by_class: donationsByClass,
        classes_with_donations: donationsByClass.filter((item) => item.money_amount > 0).length,
      });

    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados financeiros.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Relatório Financeiro</h2>
        <p className="text-muted-foreground">Acompanhe as doações e arrecadações acumulativas</p>
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Arrecadado</p>
                <p className="text-2xl font-bold text-success">
                  R$ {financeData.total_money_donations.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aulões com Doações</p>
                <p className="text-2xl font-bold text-primary">{financeData.classes_with_donations}</p>
                <p className="text-xs text-muted-foreground">eventos</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico por Aulão 
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico por Aulão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {financeData.donations_by_class.map((classData, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold">{classData.class_title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {classData.class_date
                        ? new Date(classData.class_date).toLocaleDateString('pt-BR')
                        : 'Data não informada'}
                    </span>
                  </div>
                </div>

                {classData.money_amount > 0 && (
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-success" />
                      <span className="font-semibold text-success">
                        R$ {classData.money_amount.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Dinheiro</p>
                  </div>
                )}
              </div>
            ))}

            {financeData.donations_by_class.length === 0 && (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma doação registrada</h3>
                <p className="text-muted-foreground">
                  As doações em dinheiro aparecerão aqui quando forem registradas nos aulões.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      */}

      {/* Informações Importantes */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Importantes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5">
                <DollarSign className="h-3 w-3 mr-1" />
                Dinheiro
              </Badge>
              <p className="text-muted-foreground">
                Valores mantidos mesmo quando aulões são excluídos, garantindo histórico completo das arrecadações.
              </p>
            </div>
            <p className="text-muted-foreground text-sm">
              Consideramos apenas doações em dinheiro registradas na plataforma.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceManager;
