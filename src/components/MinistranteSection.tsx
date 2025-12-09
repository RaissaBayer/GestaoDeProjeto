import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, Heart, Star, ArrowRight, CheckCircle } from "lucide-react";

interface MinistranteSectionProps {
  onOpenTeacherApplication: () => void;
}

type Subject = {
  id: string;
  name: string;
  description: string | null;
};

const MinistranteSection = ({ onOpenTeacherApplication }: MinistranteSectionProps) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSubjects = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from("subjects")
          .select("id,name,description,is_scheduled")
          .eq("is_seeking_teachers", true)
          .eq("is_scheduled", false);

        if (fetchError) {
          throw fetchError;
        }

        if (!isMounted) return;

        const pendingSubjects = (data ?? []).map((subject) => ({
          id: subject.id,
          name: subject.name,
          description: subject.description,
        }));

        setSubjects(pendingSubjects);
      } catch (err) {
        if (!isMounted) return;
        console.error(err);
        setError("Não foi possível carregar as matérias no momento. Tente novamente mais tarde.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchSubjects();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section id="ministrar" className="py-20 gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center bg-secondary/10 text-secondary px-4 py-2 rounded-full mb-6">
            <Star className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Destaque Especial</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Vem ser <span className="text-gradient-secondary">MINISTRANTE</span><br />
            no Aulão Solidário!
          </h2>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Já passou na matéria? Compartilhe seu conhecimento e faça a diferença na vida de outros estudantes
            enquanto contribui para uma causa social importante.
          </p>

          <div className="mt-10 max-w-4xl mx-auto">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-4">
              Matérias aguardando ministrantes
            </p>
          
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-24 rounded-xl bg-muted/40 animate-pulse"
                    aria-hidden="true"
                  />
                ))}
              </div>
            ) : error ? (
              <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
                {error}
              </p>
            ) : subjects.length === 0 ? (
              <p className="text-sm text-muted-foreground bg-muted/20 border border-muted/40 rounded-lg px-4 py-3">
                Todas as matérias disponíveis já têm ministrantes confirmados. Cadastre-se para ser avisado das próximas
                oportunidades!
              </p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {subjects.map((subject) => (
                  <Card
                    key={subject.id}
                    className="
                      relative h-full text-left 
                      border-2 border-transparent 
                      bg-gradient-to-br from-green-500/10 via-green-400/5 to-transparent 
                      shadow-lg
                      rounded-2xl 
                      overflow-hidden
                      
                      scale-105 shadow-green-400/30
                      border-green-400
                    "
                  >
                    {/* Glow interno suave */}
                    <div className="absolute inset-0 bg-gradient-to-br from-green-300/5 via-green-500/10 to-transparent blur-2xl opacity-50 pointer-events-none"></div>
          
                    <CardHeader className="pb-2 relative z-10">
                      <CardTitle className="text-base font-semibold text-green-600 drop-shadow-sm">
                        {subject.name}
                      </CardTitle>
                    </CardHeader>
          
                    <CardContent className="pt-0 text-sm text-muted-foreground relative z-10">
                      {subject.description ? subject.description : "Em busca de ministrante voluntário."}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Benefits */}
          <div className="space-y-6">
            <Card className="shadow-success border-success/20">
              <CardHeader>
                <CardTitle className="flex items-center text-success">
                  <Heart className="h-5 w-5 mr-3" />
                  Impacto Social
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Cada aulão que você ministrar resultará em doações para instituições de caridade, 
                  multiplicando o impacto positivo do seu conhecimento.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle className="flex items-center text-primary">
                  <GraduationCap className="h-5 w-5 mr-3" />
                  Desenvolvimento Pessoal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Desenvolva habilidades de comunicação, liderança e ensino que serão valiosas 
                  em sua carreira profissional.
                </p>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Requisitos:</h3>
              <div className="space-y-2">
                {[
                  "Ter sido aprovado na matéria que deseja ensinar",
                  "Disponibilidade de 3-4 horas para o aulão",
                  "Vontade de fazer a diferença",
                  "Preparar material didático (te ajudamos!)"
                ].map((requisito, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-success mr-3" />
                    <span className="text-sm text-muted-foreground">{requisito}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Card */}
          <Card className="gradient-card shadow-strong p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gradient-secondary mb-3">
                Pronto para começar?
              </h3>
              <p className="text-muted-foreground mb-6">
                Preencha nosso formulário e entraremos em contato para alinhar os detalhes do seu aulão.
              </p>
            </div>

            <Button 
              variant="hero" 
              size="xl" 
              className="w-full mb-4 group"
              onClick={onOpenTeacherApplication}
            >
              Quero Ser Ministrante
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-smooth" />
            </Button>

            <p className="text-xs text-muted-foreground">
              Processo simples • Suporte completo • Impacto garantido
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default MinistranteSection;
