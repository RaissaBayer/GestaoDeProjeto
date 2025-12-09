import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, Clock, MapPin, Users, BookOpen, User, Edit, Trash2, Eye, Mail, FileUp, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { incrementPlatformStatistic } from '@/lib/platformStatistics';
import { useToast } from '@/hooks/use-toast';
import RegistrationsManager from './RegistrationsManager';
import EmailTemplateManager from './EmailTemplateManager';

interface Subject {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  full_name: string;
}

interface ScheduledClass {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  max_participants: number;
  topics: string[];
  materials_needed: string;
  status: string | null;
  file_url: string | null;
  subject: { name: string };
  teacher: { full_name: string } | null;
  created_at: string;
}

const formatDate = (dateString: string) => {
  if (!dateString) return '';

  const dateOnlyMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return `${day}/${month}/${year}`;
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const formatTime = (timeString: string) => {
  if (!timeString) return '';

  const [timePart] = timeString.split('.');
  const [hours, minutes] = timePart.split(':');

  if (hours !== undefined && minutes !== undefined) {
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  }

  const date = new Date(`1970-01-01T${timeString}`);
  if (Number.isNaN(date.getTime())) {
    return timeString;
  }

  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getClassStatus = (classItem: ScheduledClass) => {
  const normalizedLocation = classItem.location?.trim();
  const hasDefinedLocation = normalizedLocation && normalizedLocation !== 'Local a Definir';
  if (!hasDefinedLocation) {
    return 'pendente';
  }

  return classItem.status || 'agendado';
};

const getStatusBadgeClasses = (status: string) => {
  switch (status) {
    case 'agendado':
      return 'bg-success text-success-foreground border-transparent';
    case 'pendente':
      return 'bg-blue-100 text-blue-700 border border-blue-200';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const ClassesManager = () => {
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ScheduledClass | null>(null);
  const [selectedClassForRegistrations, setSelectedClassForRegistrations] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subject_id: '',
    teacher_id: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    max_participants: 50,
    topics: '',
    materials_needed: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Carregar aulões
      const { data: classesData, error: classesError } = await supabase
        .from('scheduled_classes')
        .select(`
          *,
          subject:subjects(name),
          teacher:volunteer_teachers(full_name)
        `)
        .order('date', { ascending: false });

      if (classesError) throw classesError;
      setClasses(classesData || []);

      // Carregar matérias
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name');

      if (subjectsError) throw subjectsError;
      setSubjects(subjectsData || []);

      // Carregar professores aprovados
      const { data: teachersData, error: teachersError } = await supabase
        .from('volunteer_teachers')
        .select('id, full_name')
        .eq('approved', true)
        .order('full_name');

      if (teachersError) throw teachersError;
      setTeachers(teachersData || []);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const uploadFile = async (classId: string): Promise<string | null> => {
    if (!selectedFile) return null;

    setUploadingFile(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${classId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('class-files')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('class-files')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload do arquivo:', error);
      toast({
        title: "Aviso",
        description: "Aulão criado, mas houve erro ao fazer upload do arquivo.",
        variant: "default",
      });
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const topicsArray = formData.topics.split(',').map(t => t.trim()).filter(t => t);
      const trimmedLocation = formData.location.trim();
      const location = trimmedLocation ? trimmedLocation : 'Local a Definir';
      const status = editingClass?.status ?? 'agendado';

      const classData = {
        ...formData,
        topics: topicsArray,
        location,
        status,
        teacher_id: formData.teacher_id || null
      };

      if (editingClass) {
        let fileUrl = editingClass.file_url;
        
        if (selectedFile) {
          fileUrl = await uploadFile(editingClass.id);
        }

        const { error } = await supabase
          .from('scheduled_classes')
          .update({ ...classData, file_url: fileUrl })
          .eq('id', editingClass.id);
        
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Aulão atualizado com sucesso!",
        });
      } else {
        const { data: newClass, error } = await supabase
          .from('scheduled_classes')
          .insert(classData)
          .select()
          .single();
        
        if (error) throw error;
        
        if (selectedFile && newClass) {
          const fileUrl = await uploadFile(newClass.id);
          if (fileUrl) {
            await supabase
              .from('scheduled_classes')
              .update({ file_url: fileUrl })
              .eq('id', newClass.id);
          }
        }
        
        toast({
          title: "Sucesso",
          description: "Aulão agendado com sucesso!",
        });

        try {
          await incrementPlatformStatistic('total_classes');
        } catch (statsError) {
          console.error('Erro ao atualizar estatísticas de aulões:', statsError);
        }
      }

      setDialogOpen(false);
      setEditingClass(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Erro ao processar aulão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível processar o aulão.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (classItem: ScheduledClass) => {
    setEditingClass(classItem);
    setFormData({
      title: classItem.title,
      subject_id: classItem.subject?.name ? subjects.find(s => s.name === classItem.subject.name)?.id || '' : '',
      teacher_id: classItem.teacher?.full_name ? teachers.find(t => t.full_name === classItem.teacher?.full_name)?.id || '' : '',
      date: classItem.date,
      start_time: classItem.start_time,
      end_time: classItem.end_time,
      location: !classItem.location || classItem.location === 'Local a Definir' ? '' : classItem.location,
      max_participants: classItem.max_participants,
      topics: classItem.topics?.join(', ') || '',
      materials_needed: classItem.materials_needed || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (classId: string) => {
    let currentStep = 'buscar inscrições vinculadas';

    try {
      const { data: registrations, error: registrationsFetchError } = await supabase
        .from('class_registrations')
        .select('id')
        .eq('class_id', classId);

      if (registrationsFetchError) throw registrationsFetchError;

      const registrationIds = registrations?.map((registration) => registration.id) ?? [];

      if (registrationIds.length > 0) {
        currentStep = 'remover detalhes de pagamento';
        const { error: paymentDetailsError } = await supabase
          .from('payment_details')
          .delete()
          .in('registration_id', registrationIds);

        if (paymentDetailsError) throw paymentDetailsError;
      }

      currentStep = 'desvincular doações do aulão';
      const { error: donationsUpdateError } = await supabase
        .from('donations')
        .update({ class_id: null })
        .eq('class_id', classId);

      if (donationsUpdateError) throw donationsUpdateError;

      currentStep = 'remover inscrições';
      const { error: registrationsDeleteError } = await supabase
        .from('class_registrations')
        .delete()
        .eq('class_id', classId);

      if (registrationsDeleteError) throw registrationsDeleteError;

      currentStep = 'remover o aulão';
      const { error: classError } = await supabase
        .from('scheduled_classes')
        .delete()
        .eq('id', classId);

      if (classError) throw classError;

      toast({
        title: "Sucesso",
        description: "Aulão excluído com sucesso. Doações relacionadas foram preservadas!",
      });

      loadData();
    } catch (error) {
      console.error('Erro ao excluir aulão:', error);
      toast({
        title: "Erro",
        description: `Não foi possível ${currentStep}. Alguns dados relacionados ao aulão podem permanecer parcialmente.`,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subject_id: '',
      teacher_id: '',
      date: '',
      start_time: '',
      end_time: '',
      location: '',
      max_participants: 50,
      topics: '',
      materials_needed: ''
    });
    setSelectedFile(null);
    setEditingClass(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando aulões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="manage" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manage">Gerenciar Aulões</TabsTrigger>
          <TabsTrigger value="email">Personalizar E-mails</TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Gerenciar Aulões</h2>
              <p className="text-muted-foreground">Agende e gerencie os aulões solidários</p>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="hero">
                  <Plus className="h-4 w-4 mr-2" />
                  Agendar Aulão
                </Button>
              </DialogTrigger>
              
              <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto pr-2">
                <DialogHeader>
                  <DialogTitle>{editingClass ? 'Editar Aulão' : 'Agendar Novo Aulão'}</DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título do Aulão</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Ex: Aulão de Cálculo I - Derivadas"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="subject">Matéria</Label>
                      <Select 
                        value={formData.subject_id} 
                        onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a matéria" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="teacher">Ministrante (opcional)</Label>
                      <Select 
                        value={formData.teacher_id} 
                        onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o ministrante" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="location">Local (opcional)</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Ex: Sala 201 - Bloco A"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Data</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="start_time">Hora Início</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="end_time">Hora Fim</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_participants">Número Máximo de Participantes</Label>
                    <Input
                      id="max_participants"
                      type="number"
                      value={formData.max_participants}
                      onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
                      min="1"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="topics">Tópicos Abordados (separados por vírgula)</Label>
                    <Textarea
                      id="topics"
                      value={formData.topics}
                      onChange={(e) => setFormData({ ...formData, topics: e.target.value })}
                      placeholder="Ex: Limites, Derivadas, Exercícios Práticos"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="materials">Materiais Necessários</Label>
                    <Textarea
                      id="materials"
                      value={formData.materials_needed}
                      onChange={(e) => setFormData({ ...formData, materials_needed: e.target.value })}
                      placeholder="Ex: Calculadora, caderno, apostila..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file">Arquivo do Aulão (PDF, Word, etc.)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="file"
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                      />
                      {selectedFile && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <FileUp className="h-3 w-3" />
                          {selectedFile.name}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Este arquivo será enviado por e-mail aos participantes
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={uploadingFile}>
                      {uploadingFile ? 'Enviando arquivo...' : editingClass ? 'Atualizar Aulão' : 'Agendar Aulão'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Lista de Aulões */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((classItem) => {
              const classStatus = getClassStatus(classItem);

              return (
                <Card key={classItem.id} className="hover:shadow-medium transition-smooth">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{classItem.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{classItem.subject?.name}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={getStatusBadgeClasses(classStatus)}
                      >
                        {classStatus}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>{formatDate(classItem.date)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-secondary" />
                      <span>{formatTime(classItem.start_time)} - {formatTime(classItem.end_time)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-accent" />
                      <span className="text-muted-foreground">{classItem.location || 'Local a Definir'}</span>
                    </div>

                    {classItem.teacher && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{classItem.teacher.full_name}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Máx. {classItem.max_participants} participantes
                      </span>
                    </div>

                    {classItem.topics && classItem.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {classItem.topics.slice(0, 3).map((topic, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                        {classItem.topics.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{classItem.topics.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {classItem.file_url && (
                      <div className="pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          asChild
                        >
                          <a
                            href={classItem.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Baixar Arquivo
                          </a>
                        </Button>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedClassForRegistrations(classItem.id)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Inscrições
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(classItem)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Aulão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir este aulão? Esta ação também excluirá todas as inscrições vinculadas e não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(classItem.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {classes.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum aulão agendado</h3>
                <p className="text-muted-foreground mb-4">
                  Comece agendando o primeiro aulão solidário
                </p>
                <Button variant="hero" onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agendar Primeiro Aulão
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Gerenciador de Inscrições */}
          {selectedClassForRegistrations && (
            <div className="border-t pt-6">
              <RegistrationsManager
                selectedClassId={selectedClassForRegistrations}
                onAttendanceChange={loadData}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="email">
          <EmailTemplateManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClassesManager;