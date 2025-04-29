import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  BookOpen,
  Home,
  LayoutDashboard,
  Store,
  DollarSign,
  Bot,
  LineChart,
  Settings,
  ChevronDown,
  LogOut
} from "lucide-react";

interface SidebarProps {
  className?: string;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ className, isMobileOpen, onCloseMobile }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>({
    academic: true,
  });

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const isActive = (path: string) => {
    return location === path;
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const sidebarClasses = cn(
    "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar pt-16 flex flex-col h-full border-r border-sidebar-border bg-sidebar-background text-sidebar-foreground",
    "transform transition-transform duration-300 ease-in-out lg:translate-x-0",
    isMobileOpen ? "translate-x-0" : "-translate-x-full",
    className
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={onCloseMobile}
        />
      )}
      
      <aside className={sidebarClasses}>
        <div className="p-4 flex-1 overflow-y-auto">
          {/* Portal Selector */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-muted-foreground mb-2">
              Portal
            </label>
            <select className="block w-full px-3 py-2 text-sm rounded-md border border-sidebar-border bg-sidebar-accent text-sidebar-foreground">
              <option>Portal Administrativo</option>
              <option>Portal do Aluno</option>
              <option>Portal do Professor</option>
              <option>Portal do Polo</option>
              <option>Portal do Parceiro</option>
            </select>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1">
            <Link 
              href="/" 
              className={cn(
                "flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                isActive("/") 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <LayoutDashboard className="mr-3 h-5 w-5" />
              Dashboard
            </Link>

            {/* Academic Module */}
            <div className="nav-group">
              <button 
                className={cn(
                  "flex items-center justify-between w-full px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )} 
                onClick={() => toggleGroup('academic')}
              >
                <div className="flex items-center">
                  <BookOpen className="mr-3 h-5 w-5 text-sidebar-foreground/70" />
                  Acadêmico
                </div>
                <ChevronDown 
                  className={cn(
                    "h-5 w-5 text-sidebar-foreground/70 transition-transform",
                    openGroups.academic ? "transform rotate-180" : ""
                  )} 
                />
              </button>

              {openGroups.academic && (
                <div className="pl-9 space-y-1 mt-1">
                  <Link 
                    href="/courses"
                    className={cn(
                      "flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive("/courses") 
                        ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    Cursos
                  </Link>
                  
                  {/* Páginas em desenvolvimento - desabilitadas mas visíveis */}
                  <div className="flex items-center justify-between px-2 py-2 text-sm font-medium text-sidebar-foreground/40 rounded-md cursor-not-allowed">
                    <span>Disciplinas</span>
                    <span className="text-xs bg-secondary/20 px-1.5 py-0.5 rounded text-muted-foreground">Em breve</span>
                  </div>
                  
                  <div className="flex items-center justify-between px-2 py-2 text-sm font-medium text-sidebar-foreground/40 rounded-md cursor-not-allowed">
                    <span>Turmas</span>
                    <span className="text-xs bg-secondary/20 px-1.5 py-0.5 rounded text-muted-foreground">Em breve</span>
                  </div>
                  
                  <div className="flex items-center justify-between px-2 py-2 text-sm font-medium text-sidebar-foreground/40 rounded-md cursor-not-allowed">
                    <span>Alunos</span>
                    <span className="text-xs bg-secondary/20 px-1.5 py-0.5 rounded text-muted-foreground">Em breve</span>
                  </div>
                  
                  <div className="flex items-center justify-between px-2 py-2 text-sm font-medium text-sidebar-foreground/40 rounded-md cursor-not-allowed">
                    <span>Professores</span>
                    <span className="text-xs bg-secondary/20 px-1.5 py-0.5 rounded text-muted-foreground">Em breve</span>
                  </div>
                  
                  <div className="flex items-center justify-between px-2 py-2 text-sm font-medium text-sidebar-foreground/40 rounded-md cursor-not-allowed">
                    <span>Avaliações</span>
                    <span className="text-xs bg-secondary/20 px-1.5 py-0.5 rounded text-muted-foreground">Em breve</span>
                  </div>
                </div>
              )}
            </div>

            {/* Commercial Module */}
            <div className="nav-group">
              <button 
                className="flex items-center justify-between w-full px-2 py-2 text-sm font-medium text-sidebar-foreground rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" 
                onClick={() => toggleGroup('commercial')}
              >
                <div className="flex items-center">
                  <Store className="mr-3 h-5 w-5 text-sidebar-foreground/70" />
                  Comercial
                </div>
                <ChevronDown 
                  className={cn(
                    "h-5 w-5 text-sidebar-foreground/70 transition-transform",
                    openGroups.commercial ? "transform rotate-180" : ""
                  )} 
                />
              </button>

              {openGroups.commercial && (
                <div className="pl-9 space-y-1 mt-1">
                  {/* Todas as seções comerciais estão em desenvolvimento ainda */}
                  <div className="flex items-center justify-between px-2 py-2 text-sm font-medium text-sidebar-foreground/40 rounded-md cursor-not-allowed">
                    <span>Leads</span>
                    <span className="text-xs bg-secondary/20 px-1.5 py-0.5 rounded text-muted-foreground">Em breve</span>
                  </div>
                  
                  <div className="flex items-center justify-between px-2 py-2 text-sm font-medium text-sidebar-foreground/40 rounded-md cursor-not-allowed">
                    <span>Oportunidades</span>
                    <span className="text-xs bg-secondary/20 px-1.5 py-0.5 rounded text-muted-foreground">Em breve</span>
                  </div>
                  
                  <div className="flex items-center justify-between px-2 py-2 text-sm font-medium text-sidebar-foreground/40 rounded-md cursor-not-allowed">
                    <span>Campanhas</span>
                    <span className="text-xs bg-secondary/20 px-1.5 py-0.5 rounded text-muted-foreground">Em breve</span>
                  </div>
                  
                  <div className="flex items-center justify-between px-2 py-2 text-sm font-medium text-sidebar-foreground/40 rounded-md cursor-not-allowed">
                    <span>Automações</span>
                    <span className="text-xs bg-secondary/20 px-1.5 py-0.5 rounded text-muted-foreground">Em breve</span>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Module */}
            <div className="nav-group">
              <button 
                className="flex items-center justify-between w-full px-2 py-2 text-sm font-medium text-sidebar-foreground rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" 
                onClick={() => toggleGroup('financial')}
              >
                <div className="flex items-center">
                  <DollarSign className="mr-3 h-5 w-5 text-sidebar-foreground/70" />
                  Financeiro
                </div>
                <ChevronDown 
                  className={cn(
                    "h-5 w-5 text-sidebar-foreground/70 transition-transform",
                    openGroups.financial ? "transform rotate-180" : ""
                  )} 
                />
              </button>

              {openGroups.financial && (
                <div className="pl-9 space-y-1 mt-1">
                  {/* Módulo financeiro em desenvolvimento */}
                  <div className="flex items-center justify-between px-2 py-2 text-sm font-medium text-sidebar-foreground/40 rounded-md cursor-not-allowed">
                    <span>Pagamentos</span>
                    <span className="text-xs bg-secondary/20 px-1.5 py-0.5 rounded text-muted-foreground">Em breve</span>
                  </div>
                  
                  <div className="flex items-center justify-between px-2 py-2 text-sm font-medium text-sidebar-foreground/40 rounded-md cursor-not-allowed">
                    <span>Assinaturas</span>
                    <span className="text-xs bg-secondary/20 px-1.5 py-0.5 rounded text-muted-foreground">Em breve</span>
                  </div>
                  
                  <div className="flex items-center justify-between px-2 py-2 text-sm font-medium text-sidebar-foreground/40 rounded-md cursor-not-allowed">
                    <span>Faturamento</span>
                    <span className="text-xs bg-secondary/20 px-1.5 py-0.5 rounded text-muted-foreground">Em breve</span>
                  </div>
                  
                  <div className="flex items-center justify-between px-2 py-2 text-sm font-medium text-sidebar-foreground/40 rounded-md cursor-not-allowed">
                    <span>Relatórios</span>
                    <span className="text-xs bg-secondary/20 px-1.5 py-0.5 rounded text-muted-foreground">Em breve</span>
                  </div>
                </div>
              )}
            </div>

            {/* AI Module */}
            <div className="nav-group">
              <button 
                className="flex items-center justify-between w-full px-2 py-2 text-sm font-medium text-sidebar-foreground rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" 
                onClick={() => toggleGroup('ai')}
              >
                <div className="flex items-center">
                  <Bot className="mr-3 h-5 w-5 text-sidebar-foreground/70" />
                  Inteligência Artificial
                </div>
                <ChevronDown 
                  className={cn(
                    "h-5 w-5 text-sidebar-foreground/70 transition-transform",
                    openGroups.ai ? "transform rotate-180" : ""
                  )} 
                />
              </button>

              {openGroups.ai && (
                <div className="pl-9 space-y-1 mt-1">
                  {/* Módulo IA em desenvolvimento */}
                  <div className="flex items-center justify-between px-2 py-2 text-sm font-medium text-sidebar-foreground/40 rounded-md cursor-not-allowed">
                    <span>Assistente IA</span>
                    <span className="text-xs bg-secondary/20 px-1.5 py-0.5 rounded text-muted-foreground">Em breve</span>
                  </div>
                  
                  <div className="flex items-center justify-between px-2 py-2 text-sm font-medium text-sidebar-foreground/40 rounded-md cursor-not-allowed">
                    <span>Base de conhecimento</span>
                    <span className="text-xs bg-secondary/20 px-1.5 py-0.5 rounded text-muted-foreground">Em breve</span>
                  </div>
                  
                  <div className="flex items-center justify-between px-2 py-2 text-sm font-medium text-sidebar-foreground/40 rounded-md cursor-not-allowed">
                    <span>Configurações</span>
                    <span className="text-xs bg-secondary/20 px-1.5 py-0.5 rounded text-muted-foreground">Em breve</span>
                  </div>
                </div>
              )}
            </div>

            {/* Productivity Module */}
            <div className="nav-group">
              <button 
                className="flex items-center justify-between w-full px-2 py-2 text-sm font-medium text-sidebar-foreground rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" 
                onClick={() => toggleGroup('productivity')}
              >
                <div className="flex items-center">
                  <LineChart className="mr-3 h-5 w-5 text-sidebar-foreground/70" />
                  Produtividade
                </div>
                <ChevronDown 
                  className={cn(
                    "h-5 w-5 text-sidebar-foreground/70 transition-transform",
                    openGroups.productivity ? "transform rotate-180" : ""
                  )} 
                />
              </button>

              {openGroups.productivity && (
                <div className="pl-9 space-y-1 mt-1">
                  <Link 
                    href="/time-analysis"
                    className="flex items-center px-2 py-2 text-sm font-medium text-sidebar-foreground/80 rounded-md hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  >
                    Análise de tempo
                  </Link>
                  <Link 
                    href="/goals"
                    className="flex items-center px-2 py-2 text-sm font-medium text-sidebar-foreground/80 rounded-md hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  >
                    Metas
                  </Link>
                  <Link 
                    href="/productivity-reports"
                    className="flex items-center px-2 py-2 text-sm font-medium text-sidebar-foreground/80 rounded-md hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  >
                    Relatórios
                  </Link>
                </div>
              )}
            </div>

            <Link 
              href="/settings"
              className="flex items-center px-2 py-2 text-sm font-medium text-sidebar-foreground rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group"
            >
              <Settings className="mr-3 h-5 w-5 text-sidebar-foreground/70 group-hover:text-sidebar-foreground" />
              Configurações
            </Link>
          </nav>
        </div>

        {/* Tenant Information */}
        <div className="border-t border-sidebar-border p-4 mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-md bg-secondary-100 flex items-center justify-center">
                <span className="text-secondary-800 font-bold">
                  {user?.tenantId === 1 ? 'ED' : 'TS'}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-sidebar-foreground">
                  {user?.tenantId === 1 ? 'Edunéxia Demo' : 'Tenant Secundário'}
                </p>
                <p className="text-xs text-sidebar-foreground/60">Plano Empresarial</p>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="p-2 rounded-md text-sidebar-foreground/60 hover:text-destructive hover:bg-sidebar-accent"
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
