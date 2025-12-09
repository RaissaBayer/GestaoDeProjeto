import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { hash } from '@/lib/bcryptjs';

interface Administrator {
  id: string;
  username: string;
  full_name: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  admin: Administrator | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState<Administrator | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const rehydrateAdmin = async () => {
      const storedAdmin = localStorage.getItem('admin');

      if (!storedAdmin) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const adminData: Administrator = JSON.parse(storedAdmin);

        const { error } = await supabase.rpc('set_current_admin', {
          admin_username: adminData.username
        });

        if (error) {
          console.error('Erro ao restaurar sessão do administrador:', error);
          localStorage.removeItem('admin');
          setAdmin(null);
          setIsAuthenticated(false);
          return;
        }

        setAdmin(adminData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Erro ao reidratar administrador do localStorage:', error);
        localStorage.removeItem('admin');
        setAdmin(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    rehydrateAdmin();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Buscar administrador no banco de dados
      const { data: administrators, error } = await supabase
        .from('administrators')
        .select('*')
        .eq('username', username)
        .single();

      if (error || !administrators) {
        console.error('Usuário não encontrado:', error);
        return false;
      }

      // Verificar senha usando função do banco
      const { data: isValidPassword, error: passwordError } = await supabase
        .rpc('verify_password', {
          password: password,
          hash: administrators.password_hash
        });

      if (passwordError || !isValidPassword) {
        console.error('Senha inválida:', passwordError);
        return false;
      }

      // Definir usuário atual para RLS
      await supabase.rpc('set_current_admin', { admin_username: username });

      const adminData: Administrator = {
        id: administrators.id,
        username: administrators.username,
        full_name: administrators.full_name,
        email: administrators.email || ''
      };

      setAdmin(adminData);
      setIsAuthenticated(true);
      localStorage.setItem('admin', JSON.stringify(adminData));
      return true;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAdmin(null);
    setIsAuthenticated(false);
    localStorage.removeItem('admin');
  };

  const value: AuthContextType = {
    isAuthenticated,
    admin,
    login,
    logout,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};