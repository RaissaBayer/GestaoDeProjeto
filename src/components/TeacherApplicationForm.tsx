import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { GraduationCap, X, CheckCircle, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Subject {
  id: string;
  name: string;
  description: string | null;
}

const TEACHER_DOCUMENTS_BUCKET = 'teacher-documents';
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_HISTORY_TYPES = ['application/pdf'];
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_HISTORY_SIZE = 10 * 1024 * 1024; // 10MB

const teacherApplicationSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  university: z.string().min(2, 'Universidade é obrigatória'),
  course: z.string().min(2, 'Curso é obrigatório'),
  availability: z.string().min(10, 'Descreva sua disponibilidade'),
  subjects: z.array(z.string()).min(1, 'Selecione pelo menos uma matéria'),
  motivation: z.string().optional(),
  registration_number: z.string().min(3, 'Matrícula é obrigatória'),
  photo: z
    .custom<File | null>((file) => file === null || file instanceof File, {
      message: 'Arquivo de foto inválido',
    })
    .refine((file) => !file || ALLOWED_PHOTO_TYPES.includes(file.type), {
      message: 'Foto deve ser PNG, JPG ou WEBP',
    })
    .refine((file) => !file || file.size <= MAX_PHOTO_SIZE, {
      message: 'Foto deve ter no máximo 5MB',
    }),
  academic_history: z
    .custom<File | null>((file) => file instanceof File, {
      message: 'Histórico acadêmico é obrigatório',
    })
    .refine(
      (file) => file instanceof File && ALLOWED_HISTORY_TYPES.includes(file.type),
      {
        message: 'Histórico deve estar em PDF',
      }
    )
    .refine(
      (file) => file instanceof File && file.size <= MAX_HISTORY_SIZE,
      {
        message: 'Histórico deve ter no máximo 10MB',
      }
    ),
});

type TeacherApplicationForm = z.infer<typeof teacherApplicationSchema>;

interface TeacherApplicationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TeacherApplicationForm = ({ open, onOpenChange }: TeacherApplicationFormProps) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<TeacherApplicationForm>({
    resolver: zodResolver(teacherApplicationSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      university: '',
      course: '',
      availability: '',
      subjects: [],
      motivation: '',
      registration_number: '',
      photo: null,
      academic_history: null,
    },
  });

  useEffect(() => {
    if (open) {
      loadSubjects();
    }
  }, [open]);

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name, description')
        .eq('is_seeking_teachers', true)
        .order('name');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Erro ao carregar matérias:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as matérias disponíveis.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  const uploadFileToStorage = async (file: File, folder: string) => {
    const filePath = createFilePath(folder, file);
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

  const onSubmit = async (data: TeacherApplicationForm) => {
    setSubmitting(true);
    try {
      // Buscar os nomes das matérias selecionadas
      const selectedSubjectNames = subjects
        .filter(subject => data.subjects.includes(subject.id))
        .map(subject => subject.name);

      const academicHistoryFile = data.academic_history as File;
      const academicHistoryUrl = await uploadFileToStorage(
        academicHistoryFile,
        'academic-histories'
      );

      let photoUrl: string | null = null;
      if (data.photo) {
        photoUrl = await uploadFileToStorage(data.photo, 'photos');
      }

      const { error } = await supabase
        .from('volunteer_teachers')
        .insert({
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
          university: data.university,
          course: data.course,
          availability: data.availability,
          subjects_can_teach: selectedSubjectNames,
          motivation: data.motivation || null,
          approved: false, // Por padrão, não aprovado
          status: 'pending', // Status inicial é pendente
          registration_number: data.registration_number,
          photo_url: photoUrl,
          academic_history_url: academicHistoryUrl,
        });

      if (error) throw error;

      toast({
        title: "Inscrição enviada!",
        description: "Sua candidatura foi enviada com sucesso. Entraremos em contato em breve!",
      });

      form.reset({
        full_name: '',
        email: '',
        phone: '',
        university: '',
        course: '',
        availability: '',
        subjects: [],
        motivation: '',
        registration_number: '',
        photo: null,
        academic_history: null,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao enviar inscrição:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar sua inscrição. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubjectChange = (subjectId: string, checked: boolean) => {
    const currentSubjects = form.getValues('subjects');
    if (checked) {
      form.setValue('subjects', [...currentSubjects, subjectId]);
    } else {
      form.setValue('subjects', currentSubjects.filter(id => id !== subjectId));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Inscrição para Ministrante
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Informações Pessoais */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo *</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="seu@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Celular/WhatsApp *</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 99999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="registration_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Matrícula Universitária *</FormLabel>
                        <FormControl>
                          <Input placeholder="Informe sua matrícula" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Formação Acadêmica */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Formação Acadêmica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="university"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Universidade *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da sua universidade" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="course"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Curso ou Área de Formação *</FormLabel>
                        <FormControl>
                          <Input placeholder="Engenharia, Medicina, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Matérias */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Matérias que pode ensinar *
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Selecione as matérias em que você foi aprovado e gostaria de ensinar
                </p>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Carregando matérias...</p>
                  </div>
                ) : subjects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {subjects.map((subject) => (
                      <div key={subject.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          id={subject.id}
                          checked={form.watch('subjects').includes(subject.id)}
                          onCheckedChange={(checked) => 
                            handleSubjectChange(subject.id, checked as boolean)
                          }
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label
                            htmlFor={subject.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {subject.name}
                          </Label>
                          {subject.description && (
                            <p className="text-xs text-muted-foreground">
                              {subject.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No momento não há matérias procurando ministrantes.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Tente novamente em breve ou entre em contato conosco.
                    </p>
                  </div>
                )}
                <FormMessage>{form.formState.errors.subjects?.message}</FormMessage>
              </CardContent>
            </Card>

            {/* Documentos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Documentos</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Envie os documentos necessários para validar sua candidatura
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="photo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Foto de Perfil (opcional)</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input
                            type="file"
                            accept={ALLOWED_PHOTO_TYPES.join(',')}
                            onChange={(event) => {
                              const file = event.target.files?.[0] ?? null;
                              field.onChange(file);
                            }}
                            onBlur={field.onBlur}
                          />
                          <p className="text-xs text-muted-foreground">
                            Formatos aceitos: PNG, JPG ou WEBP até 5MB.
                          </p>
                          {field.value instanceof File && (
                            <p className="text-xs text-muted-foreground">
                              Arquivo selecionado: {field.value.name}
                            </p>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="academic_history"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Histórico Acadêmico (PDF) *</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input
                            type="file"
                            accept={ALLOWED_HISTORY_TYPES.join(',')}
                            onChange={(event) => {
                              const file = event.target.files?.[0] ?? null;
                              field.onChange(file);
                            }}
                            onBlur={field.onBlur}
                          />
                          <p className="text-xs text-muted-foreground">
                            Envie seu histórico acadêmico em PDF (máximo 10MB).
                          </p>
                          {field.value instanceof File && (
                            <p className="text-xs text-muted-foreground">
                              Arquivo selecionado: {field.value.name}
                            </p>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Disponibilidade e Motivação */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Adicionais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="availability"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disponibilidade de Horário *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Informe seus horários disponíveis para ministrar aulões (manhã, tarde, noite, finais de semana, etc.)"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="motivation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações Adicionais</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Conte-nos um pouco sobre sua motivação para ser ministrante ou qualquer informação adicional que considere relevante..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Botões */}
            <div className="flex gap-3">
              <Button 
                type="submit" 
                disabled={submitting || subjects.length === 0} 
                className="flex-1"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Enviar Inscrição
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TeacherApplicationForm;