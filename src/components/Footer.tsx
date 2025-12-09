import { GraduationCap, Heart, Mail, Phone, MapPin, Facebook, Instagram, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-hero">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Aulão Solidário</h3>
                <p className="text-xs text-background/70">Educação que transforma</p>
              </div>
            </div>
            <p className="text-sm text-background/80">
              Conectando estudantes através da educação e solidariedade. 
              Juntos, construímos um futuro melhor.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Heart className="h-4 w-4 text-red-400" />
              <span className="text-background/70">Feito com amor para a comunidade</span>
            </div>
          </div>

          {/* Links Rápidos */}
          <div>
            <h4 className="font-semibold mb-4">Links Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#auloes" className="text-background/80 hover:text-white transition-smooth">Próximos Aulões</a></li>
              <li><a href="#ministrar" className="text-background/80 hover:text-white transition-smooth">Ser Ministrante</a></li>
              <li><a href="#doacoes" className="text-background/80 hover:text-white transition-smooth">Transparência</a></li>
              <li><a href="/sobre" className="text-background/80 hover:text-white transition-smooth">Sobre Nós</a></li>
              <li><a href="/contato" className="text-background/80 hover:text-white transition-smooth">Contato</a></li>
            </ul>
          </div>

          {/* Matérias */}
          <div>
            <h4 className="font-semibold mb-4">Matérias Populares</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-background/80">Cálculo I & II</li>
              <li className="text-background/80">Física I & II</li>
              <li className="text-background/80">Química Geral</li>
              <li className="text-background/80">Álgebra Linear</li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="font-semibold mb-4">Entre em Contato</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4" />
                <span className="text-background/80">aulao.solidario@ufv.br</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="text-background/80">Gabriella Nascimento</span>
                  <span className="text-background/80">(32) 98839-1878</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4" />
                <div className="flex flex-col">
                  <span className="text-background/80">Pamela Morais</span>
                  <span className="text-background/80">(31) 98261-6987</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4" />
                <span className="text-background/80">Universidade Federal de Viçosa - Campus Viçosa</span>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex gap-3 mt-6">
              <a
                href="https://www.instagram.com/aulaosolidarioufv/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Acessar Instagram do Aulão Solidário UFV"
                className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <Instagram className="h-4 w-4" />
              </a>

              {/*<a href="#" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-smooth">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-smooth">
                <Linkedin className="h-4 w-4" />
              </a>*/}
            </div>
          </div>
        </div>

        <div className="border-t border-background/20 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-background/70">
            <p>&copy; 2025 Aulão Solidário. Todos os direitos reservados.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              {/*
              <a href="/privacidade" className="hover:text-white transition-smooth">Política de Privacidade</a>
              <a href="/termos" className="hover:text-white transition-smooth">Termos de Uso</a>
              */}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
