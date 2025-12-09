import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  UserPlus,
  Settings,
  Eye,
  Plus,
  CheckCircle,
  X,
  AlertCircle,
  TrendingUp,
  LayoutDashboard,
  ShieldCheck,
  UserCog,
  Menu
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import SubjectsManager from './admin/SubjectsManager';
import TeachersManager from './admin/TeachersManager';
import ClassesManager from './admin/ClassesManager';
import RegistrationsManager from './admin/RegistrationsManager';
import AdminsManager from './admin/AdminsManager';
import FinanceManager from './admin/FinanceManager';
import TransparencyManager from './admin/TransparencyManager';

const AdminPanel = () => {
  const { admin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    pendingTeachers: 0,
    activeClasses: 0,
    totalRegistrations: 0,
    activeSubjects: 0,
    loading: true
  });

  const tabs = [
    { value: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
    { value: 'subjects', label: 'Matérias', icon: BookOpen },
    { value: 'teachers', label: 'Ministrantes', icon: GraduationCap },
    { value: 'classes', label: 'Aulões', icon: Calendar },
    { value: 'registrations', label: 'Inscrições', icon: Users },
    { value: 'finance', label: 'Financeiro', icon: TrendingUp },
    { value: 'transparency', label: 'Transparência', icon: ShieldCheck },
    { value: 'admins', label: 'Administradores', icon: UserCog }
  ];

  const activeTabData = tabs.find(tab => tab.value === activeTab) ?? tabs[0];

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      // Fetch pending teachers
      const { data: pendingTeachers } = await supabase
        .from('volunteer_teachers')
        .select('id')
        .eq('status', 'pending');

      // Fetch active classes (scheduled)
      const { data: activeClasses } = await supabase
        .from('scheduled_classes')
        .select('id')
        .eq('status', 'agendado');

      // Fetch total registrations (cumulative)
      const { data: totalRegistrations } = await supabase
        .from('class_registrations')
        .select('id');

      // Fetch active subjects (seeking teachers or scheduled)
      const { data: activeSubjects } = await supabase
        .from('subjects')
        .select('id')
        .or('is_seeking_teachers.eq.true,is_scheduled.eq.true');

      setDashboardData({
        pendingTeachers: pendingTeachers?.length || 0,
        activeClasses: activeClasses?.length || 0,
        totalRegistrations: totalRegistrations?.length || 0,
        activeSubjects: activeSubjects?.length || 0,
        loading: false
      });
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      setDashboardData(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header do Painel */}
      <div className="bg-white border-b shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-hero rounded-full flex items-center justify-center">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gradient-hero">Painel Administrativo</h1>
                <p className="text-sm text-muted-foreground">Bem-vindo, {admin?.full_name}</p>
              </div>
            </div>
            
            <Button variant="outline" onClick={logout}>
              <X className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="md:hidden">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
            >
              <span className="flex items-center gap-2">
                <activeTabData.icon className="h-4 w-4" />
                {activeTabData.label}
              </span>
              <Menu className="h-4 w-4" />
            </Button>
            {isMobileMenuOpen && (
              <div className="mt-2 space-y-1 rounded-lg border bg-background p-2 shadow-soft">
                {tabs.map(tab => (
                  <Button
                    key={tab.value}
                    variant={tab.value === activeTab ? 'secondary' : 'ghost'}
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      setActiveTab(tab.value);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <TabsList className="hidden w-full grid-cols-8 md:grid">
            {tabs.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Ministrantes Pendentes</p>
                      <p className="text-2xl font-bold text-warning">
                        {dashboardData.loading ? '...' : dashboardData.pendingTeachers}
                      </p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-warning" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Aulões Ativos</p>
                      <p className="text-2xl font-bold text-primary">
                        {dashboardData.loading ? '...' : dashboardData.activeClasses}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total de Inscrições</p>
                      <p className="text-2xl font-bold text-success">
                        {dashboardData.loading ? '...' : dashboardData.totalRegistrations}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-success" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Matérias Ativas</p>
                      <p className="text-2xl font-bold text-secondary">
                        {dashboardData.loading ? '...' : dashboardData.activeSubjects}
                      </p>
                    </div>
                    <BookOpen className="h-8 w-8 text-secondary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ações Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant="hero" 
                    className="h-16 justify-start gap-4"
                    onClick={() => setActiveTab('subjects')}
                  >
                    <Plus className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-semibold">Cadastrar Matéria</div>
                      <div className="text-xs opacity-80">Adicionar nova disciplina</div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="success" 
                    className="h-16 justify-start gap-4"
                    onClick={() => setActiveTab('classes')}
                  >
                    <Calendar className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-semibold">Agendar Aulão</div>
                      <div className="text-xs opacity-80">Criar novo evento</div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="secondary" 
                    className="h-16 justify-start gap-4"
                    onClick={() => setActiveTab('teachers')}
                  >
                    <Eye className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-semibold">Aprovar Ministrantes</div>
                      <div className="text-xs opacity-80">Revisar candidatos</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Alertas e Notificações 
            <Card>
              <CardHeader>
                <CardTitle>Notificações Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.pendingTeachers > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-warning/10 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-warning" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {dashboardData.pendingTeachers} ministrante{dashboardData.pendingTeachers > 1 ? 's' : ''} aguardando aprovação
                        </p>
                        <p className="text-xs text-muted-foreground">Clique para revisar</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setActiveTab('teachers')}>Ver</Button>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Aulão de Cálculo I em 2 dias</p>
                      <p className="text-xs text-muted-foreground">15 inscritos confirmados</p>
                    </div>
                    <Button size="sm" variant="outline">Detalhes</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            */}
          </TabsContent>

          <TabsContent value="subjects">
            <SubjectsManager />
          </TabsContent>

          <TabsContent value="teachers">
            <TeachersManager />
          </TabsContent>

          <TabsContent value="classes">
            <ClassesManager />
          </TabsContent>

          <TabsContent value="registrations">
            <RegistrationsManager />
          </TabsContent>

          <TabsContent value="finance">
            <FinanceManager />
          </TabsContent>

          <TabsContent value="transparency">
            <TransparencyManager />
          </TabsContent>

          <TabsContent value="admins">
            <AdminsManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
