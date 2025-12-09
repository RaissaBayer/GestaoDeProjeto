import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserPlus, Shield, Mail, Calendar, User, Lock, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { hash } from '@/lib/bcryptjs';

interface Administrator {
  id: string;
  username: string;
  full_name: string;
  email: string | null;
  created_at: string;
}

const AdminsManager = () => {
  const [admins, setAdmins] = useState<Administrator[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Administrator | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    password: ''
  });
  const [editFormData, setEditFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    password: ''
  });
  const { admin } = useAuth();
  const { toast } = useToast();

  const fetchAdmins = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('administrators')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAdmins((data || []) as Administrator[]);
    } catch (error) {
      console.error('Erro ao carregar administradores:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os administradores.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const passwordHash = await hash(formData.password, 10);

      const { error } = await supabase.from('administrators').insert({
        username: formData.username,
        full_name: formData.full_name,
        email: formData.email,
        password_hash: passwordHash,
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Novo administrador cadastrado com sucesso!",
      });

      await fetchAdmins();

      setDialogOpen(false);
      setFormData({ username: '', full_name: '', email: '', password: '' });
    } catch (error) {
      console.error('Erro ao cadastrar administrador:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cadastrar o administrador.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (administrator: Administrator) => {
    setEditingAdmin(administrator);
    setEditFormData({
      username: administrator.username,
      full_name: administrator.full_name,
      email: administrator.email || '',
      password: ''
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingAdmin) return;

    try {
      const updateData: any = {
        username: editFormData.username,
        full_name: editFormData.full_name,
        email: editFormData.email,
      };

      // Se uma nova senha foi fornecida, inclui ela no update
      if (editFormData.password) {
        const passwordHash = await hash(editFormData.password, 10);
        updateData.password_hash = passwordHash;
      }

      const { error } = await supabase
        .from('administrators')
        .update(updateData)
        .eq('id', editingAdmin.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Administrador atualizado com sucesso!",
      });

      await fetchAdmins();

      setEditDialogOpen(false);
      setEditingAdmin(null);
      setEditFormData({ username: '', full_name: '', email: '', password: '' });
    } catch (error) {
      console.error('Erro ao atualizar administrador:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o administrador.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (administratorId: string) => {
    try {
      const { error } = await supabase
        .from('administrators')
        .delete()
        .eq('id', administratorId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Administrador removido com sucesso!",
      });

      await fetchAdmins();
    } catch (error) {
      console.error('Erro ao deletar administrador:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o administrador.",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async (administratorId: string, username: string) => {
    try {
      const newPassword = 'admin123'; // Senha temporária padrão
      const passwordHash = await hash(newPassword, 10);

      const { error } = await supabase
        .from('administrators')
        .update({ password_hash: passwordHash })
        .eq('id', administratorId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Senha redefinida para '${newPassword}' para o usuário ${username}`,
      });
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      toast({
        title: "Erro",
        description: "Não foi possível redefinir a senha.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Administradores</h2>
          <p className="text-muted-foreground">Cadastre e gerencie outros administradores do sistema</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero">
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Administrador
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Administrador</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nome de Usuário</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Ex: joao_admin"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Ex: João Silva"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ex: joao@aulaosolidario.org"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha Temporária</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Senha inicial para o novo admin"
                  required
                />
              </div>
              
              <div className="bg-primary/10 p-3 rounded-lg">
                <p className="text-xs text-primary">
                  <Shield className="h-3 w-3 inline mr-1" />
                  O novo administrador terá acesso completo ao painel administrativo e poderá gerenciar todos os aspectos do sistema.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Cadastrar Administrador
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog de Edição */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Administrador</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit_username">Nome de Usuário</Label>
                <Input
                  id="edit_username"
                  value={editFormData.username}
                  onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                  placeholder="Ex: joao_admin"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_full_name">Nome Completo</Label>
                <Input
                  id="edit_full_name"
                  value={editFormData.full_name}
                  onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                  placeholder="Ex: João Silva"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_email">Email</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  placeholder="Ex: joao@aulaosolidario.org"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_password">Nova Senha (opcional)</Label>
                <Input
                  id="edit_password"
                  type="password"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  placeholder="Deixe vazio para manter a senha atual"
                />
              </div>
              
              <div className="bg-yellow-500/10 p-3 rounded-lg">
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  <Shield className="h-3 w-3 inline mr-1" />
                  Deixe o campo senha vazio se não quiser alterá-la.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Salvar Alterações
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Administradores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {admins.map((administrator) => (
          <Card key={administrator.id} className="hover:shadow-medium transition-smooth">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 gradient-hero rounded-full flex items-center justify-center">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{administrator.full_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">@{administrator.username}</p>
                  </div>
                </div>
                {administrator.id === admin?.id && (
                  <Badge variant="default">
                    Você
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{administrator.email ?? 'E-mail não informado'}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Desde {new Date(administrator.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
              
              <div className="pt-2">
                <Badge variant="outline" className="text-success">
                  <Shield className="h-3 w-3 mr-1" />
                  Acesso Total
                </Badge>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleEdit(administrator)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                
                {administrator.id !== admin?.id && (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleResetPassword(administrator.id, administrator.username)}
                      className="flex-1"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Reset Senha
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o administrador "{administrator.full_name}"? 
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(administrator.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Informações de Segurança */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Informações de Segurança
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-foreground mb-2">Permissões de Administrador:</h4>
              <ul className="space-y-1">
                <li>• Gerenciar matérias e aulões</li>
                <li>• Aprovar ministrantes voluntários</li>
                <li>• Visualizar e confirmar inscrições</li>
                <li>• Cadastrar outros administradores</li>
                <li>• Acesso completo aos dados</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-2">Práticas de Segurança:</h4>
              <ul className="space-y-1">
                <li>• Use senhas fortes e únicas</li>
                <li>• Não compartilhe credenciais</li>
                <li>• Monitore atividades regulares</li>
                <li>• Remova acessos desnecessários</li>
                <li>• Mantenha dados atualizados</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminsManager;