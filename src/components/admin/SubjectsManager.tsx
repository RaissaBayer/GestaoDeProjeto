import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, BookOpen, Users, Calendar, Edit, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Subject {
  id: string;
  name: string;
  description: string;
  is_seeking_teachers: boolean;
  is_scheduled: boolean;
  created_at: string;
}

const SubjectsManager = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_seeking_teachers: true,
    is_scheduled: false
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Erro ao carregar matérias:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as matérias.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSubject) {
        const { error } = await supabase
          .from('subjects')
          .update(formData)
          .eq('id', editingSubject.id);
        
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Matéria atualizada com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('subjects')
          .insert(formData);
        
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Matéria cadastrada com sucesso!",
        });
      }
      
      setDialogOpen(false);
      setEditingSubject(null);
      setFormData({ name: '', description: '', is_seeking_teachers: true, is_scheduled: false });
      loadSubjects();
    } catch (error) {
      console.error('Erro ao salvar matéria:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a matéria.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      description: subject.description || '',
      is_seeking_teachers: subject.is_seeking_teachers,
      is_scheduled: subject.is_scheduled
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingSubject(null);
    setFormData({ name: '', description: '', is_seeking_teachers: true, is_scheduled: false });
    setDialogOpen(true);
  };

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando matérias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Matérias</h2>
          <p className="text-muted-foreground">Cadastre e gerencie as disciplinas disponíveis</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end w-full sm:w-auto">
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar matérias"
            className="w-full sm:w-64"
          />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Matéria
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingSubject ? 'Editar Matéria' : 'Cadastrar Nova Matéria'}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Matéria</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Cálculo I"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Breve descrição dos tópicos abordados..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="seeking">Procurando Ministrantes</Label>
                  <Switch
                    id="seeking"
                    checked={formData.is_seeking_teachers}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_seeking_teachers: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="scheduled">Aulão Agendado</Label>
                  <Switch
                    id="scheduled"
                    checked={formData.is_scheduled}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_scheduled: checked })
                    }
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingSubject ? 'Atualizar' : 'Cadastrar'}
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
        </div>
      </div>

      {/* Lista de Matérias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSubjects.map((subject) => (
          <Card key={subject.id} className="hover:shadow-medium transition-smooth">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{subject.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {subject.description || 'Sem descrição'}
                  </p>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => openEditDialog(subject)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {subject.is_seeking_teachers && (
                  <Badge variant="outline" className="text-warning">
                    <Users className="h-3 w-3 mr-1" />
                    Procurando Ministrantes
                  </Badge>
                )}
                {subject.is_scheduled && (
                  <Badge variant="outline" className="text-success">
                    <Calendar className="h-3 w-3 mr-1" />
                    Aulão Agendado
                  </Badge>
                )}
              </div>
              
              <div className="text-xs text-muted-foreground">
                Criada em {new Date(subject.created_at).toLocaleDateString('pt-BR')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredSubjects.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm
                ? 'Nenhuma matéria encontrada'
                : 'Nenhuma matéria cadastrada'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm
                ? 'Tente buscar por outro termo para encontrar matérias.'
                : 'Comece cadastrando as primeiras matérias para os aulões'}
            </p>
            {!searchTerm && (
              <Button variant="hero" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Primeira Matéria
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubjectsManager;
