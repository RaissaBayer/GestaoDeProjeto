import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, X, Edit2, Save, XCircle, GraduationCap, Clock, Eye, Heart, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface VolunteerTeacher {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  university: string;
  course: string;
  subjects_can_teach: string[];
  experience_level: string | null;
  availability: string;
  motivation: string | null;
  approved: boolean;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  registration_number: string;
  photo_url: string | null;
  academic_history_url: string;
}

const TEACHER_DOCUMENTS_BUCKET = 'teacher-documents';
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB

const getUniqueId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const createFilePath = (folder: string, file: File) => {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const baseName = file.name
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  const uniqueId = getUniqueId();
  const ext = extension ? `.${extension}` : '';
  return `${folder}/${uniqueId}-${baseName || 'arquivo'}${ext}`;
};

const uploadPhotoToStorage = async (file: File) => {
  const filePath = createFilePath('photos', file);
  const { error } = await supabase.storage
    .from(TEACHER_DOCUMENTS_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(TEACHER_DOCUMENTS_BUCKET).getPublicUrl(filePath);

  return publicUrl;
};

const TeachersManager = () => {
  const [teachers, setTeachers] = useState<VolunteerTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<VolunteerTeacher | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<VolunteerTeacher>>({});
  const [detailsForm, setDetailsForm] = useState<VolunteerTeacher | null>(null);
  const [newSubject, setNewSubject] = useState('');
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [savingDetails, setSavingDetails] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<VolunteerTeacher | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('volunteer_teachers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const normalizedData = (data || []).map(item => ({
        ...item,
        subjects_can_teach: Array.isArray(item.subjects_can_teach)
          ? item.subjects_can_teach
          : [],
      })) as VolunteerTeacher[];
      setTeachers(normalizedData);
    } catch (error) {
      console.error('Erro ao carregar ministrantes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os ministrantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (teacherId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('volunteer_teachers')
        .update({ status, approved: status === 'approved' })
        .eq('id', teacherId);

      if (error) throw error;

      const statusText = status === 'approved' ? 'aprovado' : 'rejeitado';
      toast({
        title: "Sucesso",
        description: `Ministrante ${statusText} com sucesso!`,
      });

      loadTeachers();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do ministrante.",
        variant: "destructive",
      });
    }
  };

  const startEditing = (teacher: VolunteerTeacher) => {
    setEditingId(teacher.id);
    setEditForm({ ...teacher });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingId || !editForm) return;

    try {
      const { error } = await supabase
        .from('volunteer_teachers')
        .update({
          full_name: editForm.full_name,
          email: editForm.email,
          phone: editForm.phone,
          university: editForm.university,
          course: editForm.course,
          availability: editForm.availability,
          motivation: editForm.motivation,
          registration_number: editForm.registration_number,
        })
        .eq('id', editingId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Dados do ministrante atualizados com sucesso!",
      });

      setEditingId(null);
      setEditForm({});
      loadTeachers();
    } catch (error) {
      console.error('Erro ao atualizar ministrante:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os dados do ministrante.",
        variant: "destructive",
      });
    }
  };

  const allSubjects = useMemo(() => {
    const subjectsSet = new Set<string>();
    teachers.forEach(teacher => {
      teacher.subjects_can_teach.forEach(subject => subjectsSet.add(subject));
    });
    return Array.from(subjectsSet).sort((a, b) => a.localeCompare(b));
  }, [teachers]);

  const subjectOptions = useMemo(() => {
    const subjectsSet = new Set(allSubjects);
    if (detailsForm) {
      detailsForm.subjects_can_teach.forEach(subject => subjectsSet.add(subject));
    }
    return Array.from(subjectsSet).sort((a, b) => a.localeCompare(b));
  }, [allSubjects, detailsForm]);

  const openTeacherDetails = (teacher: VolunteerTeacher) => {
    const subjects = Array.isArray(teacher.subjects_can_teach)
      ? teacher.subjects_can_teach
      : [];
    setSelectedTeacher(teacher);
    setDetailsForm({
      ...teacher,
      subjects_can_teach: [...subjects],
    });
    setEditingId(null);
    setEditForm({});
    setNewPhotoFile(null);
    setPhotoPreviewUrl(null);
    setSavingDetails(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setDetailsOpen(true);
  };

  const closeTeacherDetails = () => {
    setDetailsOpen(false);
    setDetailsForm(null);
    setSelectedTeacher(null);
    setNewSubject('');
    setNewPhotoFile(null);
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
    setPhotoPreviewUrl(null);
    setSavingDetails(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDetailsInputChange = <K extends keyof VolunteerTeacher>(key: K, value: VolunteerTeacher[K]) => {
    if (!detailsForm) return;
    setDetailsForm({
      ...detailsForm,
      [key]: value,
    });
  };

  const toggleSubject = (subject: string) => {
    if (!detailsForm) return;
    const hasSubject = detailsForm.subjects_can_teach.includes(subject);
    const updatedSubjects = hasSubject
      ? detailsForm.subjects_can_teach.filter(item => item !== subject)
      : [...detailsForm.subjects_can_teach, subject];
    handleDetailsInputChange('subjects_can_teach', updatedSubjects);
  };

  const addNewSubject = () => {
    if (!detailsForm) return;
    const trimmedSubject = newSubject.trim();
    if (!trimmedSubject) {
      return;
    }
    if (!detailsForm.subjects_can_teach.includes(trimmedSubject)) {
      handleDetailsInputChange('subjects_can_teach', [
        ...detailsForm.subjects_can_teach,
        trimmedSubject,
      ]);
    }
    setNewSubject('');
  };

  const handlePhotoFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setNewPhotoFile(null);
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
      setPhotoPreviewUrl(null);
      return;
    }

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      toast({
        title: 'Formato inválido',
        description: 'A foto deve ser uma imagem nos formatos JPG, PNG ou WEBP.',
        variant: 'destructive',
      });
      setNewPhotoFile(null);
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
      setPhotoPreviewUrl(null);
      event.target.value = '';
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      toast({
        title: 'Arquivo muito grande',
        description: 'A foto deve ter no máximo 5MB.',
        variant: 'destructive',
      });
      setNewPhotoFile(null);
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
      setPhotoPreviewUrl(null);
      event.target.value = '';
      return;
    }

    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setNewPhotoFile(file);
    setPhotoPreviewUrl(previewUrl);
  };

  const clearPhotoSelection = () => {
    setNewPhotoFile(null);
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
    setPhotoPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const saveDetailsEdit = async () => {
    if (!detailsForm || !selectedTeacher) return;

    if (!detailsForm.full_name || !detailsForm.email || !detailsForm.university || !detailsForm.course) {
      toast({
        title: 'Atenção',
        description: 'Nome, e-mail, universidade e curso são obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    setSavingDetails(true);

    let uploadedPhotoUrl = detailsForm.photo_url;

    if (newPhotoFile) {
      try {
        uploadedPhotoUrl = await uploadPhotoToStorage(newPhotoFile);
      } catch (error) {
        console.error('Erro ao enviar foto do ministrante:', error);
        toast({
          title: 'Erro no upload',
          description: 'Não foi possível enviar a nova foto. Tente novamente.',
          variant: 'destructive',
        });
        setSavingDetails(false);
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('volunteer_teachers')
        .update({
          full_name: detailsForm.full_name,
          email: detailsForm.email,
          phone: detailsForm.phone,
          university: detailsForm.university,
          course: detailsForm.course,
          availability: detailsForm.availability,
          motivation: detailsForm.motivation,
          registration_number: detailsForm.registration_number,
          subjects_can_teach: detailsForm.subjects_can_teach,
          experience_level: detailsForm.experience_level,
          photo_url: uploadedPhotoUrl,
          academic_history_url: detailsForm.academic_history_url,
        })
        .eq('id', selectedTeacher.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Dados do ministrante atualizados com sucesso!',
      });

      clearPhotoSelection();
      closeTeacherDetails();
      await loadTeachers();
    } catch (error) {
      console.error('Erro ao atualizar ministrante:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar os dados do ministrante.',
        variant: 'destructive',
      });
    } finally {
      setSavingDetails(false);
    }
  };

  const confirmDeleteTeacher = (teacher: VolunteerTeacher) => {
    setTeacherToDelete(teacher);
    setDeleteDialogOpen(true);
  };

  const handleDeleteTeacher = async () => {
    if (!teacherToDelete) return;

    try {
      const { error } = await supabase
        .from('volunteer_teachers')
        .delete()
        .eq('id', teacherToDelete.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Ministrante excluído com sucesso!',
      });

      setDeleteDialogOpen(false);
      setTeacherToDelete(null);
      
      if (selectedTeacher?.id === teacherToDelete.id) {
        closeTeacherDetails();
      }
      
      await loadTeachers();
    } catch (error) {
      console.error('Erro ao excluir ministrante:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o ministrante.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-success text-success-foreground">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="outline" className="text-warning border-warning">Aguardando aprovação</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando ministrantes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gerenciar Ministrantes</h2>
        <p className="text-muted-foreground">Aprove e gerencie os professores voluntários</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-warning">{teachers.filter(t => t.status === 'pending').length}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aprovados</p>
                <p className="text-2xl font-bold text-success">{teachers.filter(t => t.status === 'approved').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-primary">{teachers.length}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Ministrantes */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Ministrantes</CardTitle>
        </CardHeader>
        <CardContent>
          {teachers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome Completo</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Celular/WhatsApp</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Matérias</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell>
                      {editingId === teacher.id ? (
                        <Input
                          value={editForm.full_name || ''}
                          onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                          className="w-full"
                        />
                      ) : (
                        teacher.full_name
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === teacher.id ? (
                        <Input
                          value={editForm.email || ''}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full"
                        />
                      ) : (
                        teacher.email
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === teacher.id ? (
                        <Input
                          value={editForm.phone || ''}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="w-full"
                        />
                      ) : (
                        teacher.phone || 'Não informado'
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === teacher.id ? (
                        <Input
                          value={editForm.registration_number || ''}
                          onChange={(e) =>
                            setEditForm({ ...editForm, registration_number: e.target.value })
                          }
                          className="w-full"
                        />
                      ) : (
                        teacher.registration_number || 'Não informado'
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === teacher.id ? (
                        <Input
                          value={editForm.course || ''}
                          onChange={(e) => setEditForm({ ...editForm, course: e.target.value })}
                          className="w-full"
                        />
                      ) : (
                        teacher.course
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {teacher.subjects_can_teach.slice(0, 2).map((subject, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {subject}
                          </Badge>
                        ))}
                        {teacher.subjects_can_teach.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{teacher.subjects_can_teach.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(teacher.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {editingId === teacher.id ? (
                          <>
                            <Button size="sm" onClick={saveEdit}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEditing}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" onClick={() => startEditing(teacher)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => openTeacherDetails(teacher)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {teacher.status === 'pending' && (
                              <>
                                <Button size="sm" variant="success" onClick={() => handleStatusChange(teacher.id, 'approved')}>
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleStatusChange(teacher.id, 'rejected')}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {teacher.status === 'rejected' && (
                              <Button size="sm" variant="success" onClick={() => handleStatusChange(teacher.id, 'approved')}>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Aprovar
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center">
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum ministrante cadastrado</h3>
              <p className="text-muted-foreground">
                Os ministrantes aparecerão aqui quando se inscreverem
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Detalhes do Ministrante */}
      <Dialog
        open={detailsOpen}
        onOpenChange={open => {
          if (!open) {
            closeTeacherDetails();
          } else {
            setDetailsOpen(true);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Perfil do Ministrante</DialogTitle>
          </DialogHeader>

          {selectedTeacher && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Informações Pessoais</h3>
                  <div className="space-y-2 text-sm">
                    <div className="space-y-2">
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="teacher-name">Nome</Label>
                        <Input
                          id="teacher-name"
                          value={detailsForm?.full_name || ''}
                          onChange={e => handleDetailsInputChange('full_name', e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="teacher-email">Email</Label>
                        <Input
                          id="teacher-email"
                          type="email"
                          value={detailsForm?.email || ''}
                          onChange={e => handleDetailsInputChange('email', e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="teacher-phone">Telefone</Label>
                        <Input
                          id="teacher-phone"
                          value={detailsForm?.phone || ''}
                          onChange={e => handleDetailsInputChange('phone', e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor="teacher-registration">Matrícula</Label>
                        <Input
                          id="teacher-registration"
                          value={detailsForm?.registration_number || ''}
                          onChange={e => handleDetailsInputChange('registration_number', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

              <div>
                <h3 className="font-semibold mb-2">Formação Acadêmica</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="teacher-university">Universidade</Label>
                    <Input
                      id="teacher-university"
                      value={detailsForm?.university || ''}
                      onChange={e => handleDetailsInputChange('university', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="teacher-course">Curso</Label>
                    <Input
                      id="teacher-course"
                      value={detailsForm?.course || ''}
                      onChange={e => handleDetailsInputChange('course', e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label>Experiência</Label>
                    <Select
                      value={detailsForm?.experience_level || undefined}
                      onValueChange={value => handleDetailsInputChange('experience_level', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o nível de experiência" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="iniciante">Iniciante</SelectItem>
                        <SelectItem value="intermediario">Intermediário</SelectItem>
                        <SelectItem value="avancado">Avançado</SelectItem>
                        <SelectItem value="profissional">Profissional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Documentos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div className="space-y-3">
                  <span className="text-sm font-medium">Foto</span>
                  <div className="flex flex-col items-center gap-3">
                    {photoPreviewUrl || detailsForm?.photo_url ? (
                      <img
                        src={(photoPreviewUrl || detailsForm?.photo_url) ?? ''}
                        alt={selectedTeacher ? `Foto de ${selectedTeacher.full_name}` : 'Foto do ministrante'}
                        className="h-32 w-32 rounded-full object-cover border"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground text-center">
                        Foto não enviada
                      </p>
                    )}
                    <div className="flex flex-col gap-2 w-full">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoFileChange}
                      />
                      {newPhotoFile && (
                        <Button type="button" variant="outline" size="sm" onClick={clearPhotoSelection}>
                          Limpar seleção
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Formatos permitidos: JPG, PNG, WEBP. Tamanho máximo: 5MB.
                    </p>
                  </div>
                  <Input
                    placeholder="URL da foto"
                    value={detailsForm?.photo_url || ''}
                    onChange={e => handleDetailsInputChange('photo_url', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium">Histórico Acadêmico</span>
                  {detailsForm?.academic_history_url ? (
                    <Button asChild variant="outline">
                      <a
                        href={detailsForm.academic_history_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Visualizar histórico
                      </a>
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Histórico não disponível
                    </p>
                  )}
                  <Input
                    placeholder="URL do histórico acadêmico"
                    value={detailsForm?.academic_history_url || ''}
                    onChange={e => handleDetailsInputChange('academic_history_url', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Matérias que pode ensinar</h3>
              <div className="flex flex-wrap gap-2">
                {subjectOptions.map(subject => (
                  <Label key={subject} className="flex items-center gap-2 border rounded-md px-2 py-1 text-sm">
                    <Checkbox
                      checked={detailsForm?.subjects_can_teach?.includes(subject) ?? false}
                      onCheckedChange={() => toggleSubject(subject)}
                    />
                    {subject}
                  </Label>
                ))}
              </div>
              <div className="mt-3 flex flex-col gap-2">
                <Label htmlFor="new-subject">Adicionar nova matéria</Label>
                <div className="flex gap-2">
                  <Input
                    id="new-subject"
                    placeholder="Nome da matéria"
                    value={newSubject}
                    onChange={e => setNewSubject(e.target.value)}
                  />
                  <Button type="button" onClick={addNewSubject}>
                    Adicionar
                  </Button>
                </div>
                {detailsForm && detailsForm.subjects_can_teach.length === 0 && (
                  <p className="text-xs text-muted-foreground">Selecione ou adicione ao menos uma matéria.</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Disponibilidade</h3>
              <Textarea
                value={detailsForm?.availability || ''}
                onChange={e => handleDetailsInputChange('availability', e.target.value)}
                placeholder="Descreva a disponibilidade"
              />
            </div>

            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                Motivação
              </h3>
              <Textarea
                value={detailsForm?.motivation || ''}
                onChange={e => handleDetailsInputChange('motivation', e.target.value)}
                placeholder="Descreva a motivação"
              />
            </div>

              <div className="flex flex-wrap gap-2">
                {selectedTeacher.status === 'pending' && (
                  <>
                    <Button
                      className="flex-1"
                      variant="success"
                      onClick={() => {
                        handleStatusChange(selectedTeacher.id, 'approved');
                        closeTeacherDetails();
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aprovar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        handleStatusChange(selectedTeacher.id, 'rejected');
                        closeTeacherDetails();
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Rejeitar
                    </Button>
                  </>
                )}
                {selectedTeacher.status === 'rejected' && (
                  <Button
                    className="flex-1"
                    variant="success"
                    onClick={() => {
                      handleStatusChange(selectedTeacher.id, 'approved');
                      closeTeacherDetails();
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprovar Ministrante
                  </Button>
                )}
                <div className="flex-1 min-w-[200px] flex gap-2 justify-between">
                  <Button 
                    variant="destructive" 
                    onClick={() => confirmDeleteTeacher(selectedTeacher)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={closeTeacherDetails}>
                      Cancelar
                    </Button>
                    <Button onClick={saveDetailsEdit} disabled={savingDetails}>
                      {savingDetails ? 'Salvando...' : 'Salvar alterações'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o ministrante <strong>{teacherToDelete?.full_name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTeacher} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeachersManager;