import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { GraduationCap, User, LogIn, LogOut } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import LoginModal from './LoginModal';

const Header = () => {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const { isAuthenticated, admin, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-hero">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gradient-hero">Aulão Solidário</h1>
            <p className="text-xs text-muted-foreground">Educação que transforma</p>
          </div>
        </div>

        {!isAuthenticated && (
          <nav className="hidden md:flex items-center gap-6">
            <a href="#auloes" className="text-sm font-medium hover:text-primary transition-smooth">
              Próximos Aulões
            </a>
            <a href="#doacoes" className="text-sm font-medium hover:text-primary transition-smooth">
              Transparência
            </a>
            <a href="#ministrar" className="text-sm font-medium hover:text-secondary transition-smooth">
              Seja Ministrante
            </a>
          </nav>
        )}

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                Olá, {admin?.full_name}
              </span>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          ) : (
            <>
              {/*
              <Button variant="ghost" size="sm" className="hidden md:inline-flex">
                <User className="h-4 w-4" />
                Cadastro
              </Button>
              */}
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => setLoginModalOpen(true)}
              >
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            </>
          )}
        </div>
      </div>

      <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
    </header>
  );
};

export default Header;
