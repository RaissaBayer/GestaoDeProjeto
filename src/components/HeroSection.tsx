import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Users, BookOpen, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-aulao-solidario.jpg";
import { supabase } from "@/integrations/supabase/client";

interface HeroSectionProps {
  onOpenTeacherApplication: () => void;
}

const HeroSection = ({ onOpenTeacherApplication }: HeroSectionProps) => {
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalFoodKg: 0,
  });

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    const currentYear = new Date().getFullYear();
    
    // Buscar estatísticas da plataforma
    const { data: platformStats } = await supabase
      .from("platform_statistics")
      .select("*")
      .eq("year", currentYear)
      .maybeSingle();

    // Buscar total de alimentos doados
    const { data: donations } = await supabase
      .from("donations_institutions")
      .select("food_weight_kg");

    const totalFood = donations?.reduce((sum, d) => sum + (d.food_weight_kg || 0), 0) || 0;

    setStats({
      totalClasses: platformStats?.total_classes || 0,
      totalStudents: platformStats?.total_students || 0,
      totalFoodKg: totalFood,
    });
  };

  const scrollToAuloes = () => {
    const auloesSection = document.getElementById('auloes');
    if (auloesSection) {
      auloesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Estudantes colaborando" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 gradient-hero opacity-90"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
              <Heart className="h-5 w-5 text-red-300" />
              <span className="text-sm font-medium">Educação + Solidariedade</span>
              <Users className="h-5 w-5 text-blue-300" />
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Aulão <span className="text-yellow-300">Solidário</span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto leading-relaxed">
            Estudantes ensinam estudantes por um mundo melhor. Participe dos nossos  
            <span className="font-semibold text-yellow-300"> AULÕES </span>
            e contribua com uma doação que será destinada a instituições de caridade.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button variant="secondary" size="xl" className="group" onClick={scrollToAuloes}>
              <BookOpen className="h-5 w-5" />
              Ver Próximos Aulões
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-smooth" />
            </Button>
            <Button variant="accent" size="xl" className="group" onClick={onOpenTeacherApplication}>
              <Users className="h-5 w-5" />
              Quero Ser Ministrante
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-smooth" />
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-3xl font-bold text-yellow-300 mb-2">{stats.totalStudents}+</div>
              <div className="text-sm text-white/80">Alunos Impactados</div>
            </div>
            {/*
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-3xl font-bold text-green-300 mb-2">{stats.totalFoodKg}kg</div>
              <div className="text-sm text-white/80">Alimentos Doados</div>
            </div>
            */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-3xl font-bold text-blue-300 mb-2">{stats.totalClasses}</div>
              <div className="text-sm text-white/80">Aulões Realizados</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
