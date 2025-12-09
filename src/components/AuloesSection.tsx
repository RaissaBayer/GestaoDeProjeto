import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Clock, MapPin, User, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDateToLocale, formatTimeToHoursMinutes } from "@/lib/utils";
import ClassRegistrationForm from "./ClassRegistrationForm";

interface ScheduledClass {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  max_participants: number;
  topics: string[] | null;
  subjects: {
    name: string;
  };
  volunteer_teachers: {
    full_name: string;
    photo_url: string | null;
    university: string | null;
    course: string | null;
  } | null;
  registrations_count: number;
}

const AuloesSection = () => {
  const [classes, setClasses] = useState<ScheduledClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<ScheduledClass | null>(null);
  const [registrationFormOpen, setRegistrationFormOpen] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_classes')
        .select(`
          id,
          title,
          date,
          start_time,
          end_time,
          location,
          max_participants,
          topics,
          subjects (name),
          volunteer_teachers (full_name, photo_url, university, course),
          class_registrations (id)
        `)
        .eq('status', 'agendado')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;

      // Processar dados para incluir contagem de inscrições
      const processedClasses = (data || []).map(classItem => ({
        ...classItem,
        registrations_count: classItem.class_registrations?.length || 0
      }));

      setClasses(processedClasses);
    } catch (error) {
      console.error('Erro ao carregar aulões:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRegistration = (classData: ScheduledClass) => {
    setSelectedClass(classData);
    setRegistrationFormOpen(true);
  };
  return (
    <section id="auloes" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gradient-hero mb-4">
            Próximos Aulões
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Confira os aulões agendados e garante sua vaga!
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="gradient-card animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-10 bg-muted rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              Nenhum aulão agendado no momento.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Volte em breve para conferir novos aulões!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {classes.map((aulao) => (
              <Card key={aulao.id} className="gradient-card shadow-medium hover:shadow-strong transition-spring overflow-hidden group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl font-bold text-primary group-hover:text-primary-light transition-smooth">
                      {aulao.subjects.name}
                    </CardTitle>
                    <div className="flex items-center text-xs text-success bg-success/10 px-2 py-1 rounded-full">
                      <Users className="h-3 w-3 mr-1" />
                      {aulao.registrations_count}/{aulao.max_participants}
                    </div>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <User className="h-4 w-4 mr-2" />
                    {aulao.volunteer_teachers ? (
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <span className="text-sm cursor-pointer hover:text-primary transition-colors underline decoration-dotted">
                            {aulao.volunteer_teachers.full_name}
                          </span>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                          <div className="flex gap-4">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={aulao.volunteer_teachers.photo_url || undefined} />
                              <AvatarFallback>
                                {aulao.volunteer_teachers.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                              <h4 className="text-sm font-semibold">{aulao.volunteer_teachers.full_name}</h4>
                              {aulao.volunteer_teachers.course && (
                                <p className="text-sm text-muted-foreground">
                                  <span className="font-medium">Curso:</span> {aulao.volunteer_teachers.course}
                                </p>
                              )}
                              {aulao.volunteer_teachers.university && (
                                <p className="text-sm text-muted-foreground">
                                  {aulao.volunteer_teachers.university}
                                </p>
                              )}
                            </div>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    ) : (
                      <span className="text-sm">Professor a definir</span>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                    {formatDateToLocale(aulao.date)}
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2 text-secondary" />
                    {formatTimeToHoursMinutes(aulao.start_time)} - {formatTimeToHoursMinutes(aulao.end_time)}
                  </div>
                  
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2 text-accent" />
                    {aulao.location}
                  </div>

                  {aulao.topics && aulao.topics.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground mb-2">Tópicos abordados:</p>
                      <div className="flex flex-wrap gap-1">
                        {aulao.topics.map((topico, index) => (
                          <span 
                            key={index} 
                            className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                          >
                            {topico}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {aulao.registrations_count >= aulao.max_participants ? (
                    <div className="w-full mt-4">
                      <p className="text-center text-sm text-muted-foreground font-medium">
                        Número máximo de inscritos atingido
                      </p>
                    </div>
                  ) : (
                    <Button 
                      className="w-full mt-4" 
                      onClick={() => handleOpenRegistration(aulao)}
                    >
                      Garantir Vaga
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
{/*
        <div className="text-center">
          <Button variant="outline" size="lg">
            Ver Todos os Aulões
          </Button>
        </div>
*/}
      </div>

      {/* Modal de Inscrição */}
      <ClassRegistrationForm
        open={registrationFormOpen}
        onOpenChange={setRegistrationFormOpen}
        classData={selectedClass ? {
          id: selectedClass.id,
          title: selectedClass.subjects.name,
          date: selectedClass.date,
          start_time: selectedClass.start_time,
          end_time: selectedClass.end_time,
          location: selectedClass.location,
        } : undefined}
      />
    </section>
  );
};

export default AuloesSection;
