import { useState } from 'react';
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import AuloesSection from "@/components/AuloesSection";
import MinistranteSection from "@/components/MinistranteSection";
import TransparenciaSection from "@/components/TransparenciaSection";
import Footer from "@/components/Footer";
import AdminPanel from "@/components/AdminPanel";
import TeacherApplicationForm from "@/components/TeacherApplicationForm";
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { isAuthenticated, loading } = useAuth();
  const [teacherApplicationOpen, setTeacherApplicationOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <AdminPanel />;
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection onOpenTeacherApplication={() => setTeacherApplicationOpen(true)} />
        <AuloesSection />
        <MinistranteSection onOpenTeacherApplication={() => setTeacherApplicationOpen(true)} />
        <TransparenciaSection />
      </main>
      <Footer />
      
      {/* Modal de Inscrição para Ministrante */}
      <TeacherApplicationForm 
        open={teacherApplicationOpen}
        onOpenChange={setTeacherApplicationOpen}
      />
    </div>
  );
};

export default Index;