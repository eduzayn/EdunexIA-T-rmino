import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { usePortal, PortalType } from "@/hooks/use-portal";
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
  LogOut,
  Users,
  School,
  Building,
  Award
} from "lucide-react";

interface SidebarProps {
  className?: string;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ className, isMobileOpen, onCloseMobile }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { currentPortal, setCurrentPortal, portals } = usePortal();
  const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>({
    academic: true,
  });

  // Ícones para cada tipo de portal
  const portalIcons = {
    admin: <Settings className="h-5 w-5 mr-2" />,
    student: <Users className="h-5 w-5 mr-2" />,
    teacher: <School className="h-5 w-5 mr-2" />,
    hub: <Building className="h-5 w-5 mr-2" />,
    partner: <Award className="h-5 w-5 mr-2" />
  };

  // Quando o portal mudar, ajustar a navegação
  useEffect(() => {
    // Se o usuário estiver em uma rota que não pertence ao portal atual,
    // redirecionar para a dashboard do portal atual
    if (!location.startsWith(currentPortal.baseRoute) && location !== '/') {
      setLocation('/');
    }
  }, [currentPortal, location, setLocation]);

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

  const handlePortalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentPortal(e.target.value as PortalType);
  };

  const sidebarClasses = cn(
    "fixed inset-y-0 left-0 z-50 w-72 flex flex-col h-full border-r border-sidebar-border bg-sidebar-background text-sidebar-foreground",
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
        {/* Logo no Sidebar */}
        <div className="pt-4 pb-2">
          <div className="flex items-center px-6 pt-2 pb-3">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-primary to-purple-600 rounded-md">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              <span className="text-2xl font-bold text-sidebar-foreground">Edunéxia</span>
            </div>
          </div>
        </div>
        
        <div className="px-6 pb-4 pt-2 border-b border-sidebar-border"></div>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* Portal Selector */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Portal
            </label>
            <div className="relative">
              <select 
                className="block w-full pl-10 pr-4 py-2.5 text-base rounded-md border border-sidebar-border bg-sidebar-accent text-sidebar-foreground"
                value={currentPortal.id}
                onChange={handlePortalChange}
              >
                {portals.map(portal => (
                  <option key={portal.id} value={portal.id}>
                    {portal.name}
                  </option>
                ))}
              </select>
              <div className="absolute left-3 top-2.5 pointer-events-none">
                {portalIcons[currentPortal.id]}
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-2">
            <Link 
              href="/" 
              className={cn(
                "flex items-center px-4 py-3 text-base font-medium rounded-md transition-colors",
                isActive("/") 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <LayoutDashboard className="mr-4 h-5 w-5" />
              Dashboard
            </Link>

            {/* Academic Module */}
            <div className="nav-group">
              <button 
                className={cn(
                  "flex items-center justify-between w-full px-4 py-3 text-base font-medium rounded-md transition-colors",
                  "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )} 
                onClick={() => toggleGroup('academic')}
              >
                <div className="flex items-center">
                  <BookOpen className="mr-4 h-5 w-5 text-sidebar-foreground/70" />
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
                <div className="pl-12 space-y-2 mt-2">
                  <Link 
                    href={`${currentPortal.baseRoute}/courses`}
                    className={cn(
                      "flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-colors",
                      isActive(`${currentPortal.baseRoute}/courses`) 
                        ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    Cursos
                  </Link>
                  
                  {/* Mostrar ou esconder itens com base no tipo de portal */}
                  {['admin', 'teacher'].includes(currentPortal.id) && (
                    <>
                      <div className="flex items-center justify-between px-3 py-2.5 text-base font-medium text-sidebar-foreground/40 rounded-md cursor-not-allowed">
                        <span>Disciplinas</span>
                        <span className="text-sm bg-secondary/20 px-2 py-0.5 rounded text-muted-foreground">Em breve</span>
                      </div>
                      
                      <div className="flex items-center justify-between px-3 py-2.5 text-base font-medium text-sidebar-foreground/40 rounded-md cursor-not-allowed">
                        <span>Turmas</span>
                        <span className="text-sm bg-secondary/20 px-2 py-0.5 rounded text-muted-foreground">Em breve</span>
                      </div>
                    </>
                  )}
                  
                  {['admin', 'hub'].includes(currentPortal.id) && (
                    <div className="flex items-center justify-between px-3 py-2.5 text-base font-medium text-sidebar-foreground/40 rounded-md cursor-not-allowed">
                      <span>Alunos</span>
                      <span className="text-sm bg-secondary/20 px-2 py-0.5 rounded text-muted-foreground">Em breve</span>
                    </div>
                  )}
                  
                  {['admin', 'hub'].includes(currentPortal.id) && (
                    <div className="flex items-center justify-between px-3 py-2.5 text-base font-medium text-sidebar-foreground/40 rounded-md cursor-not-allowed">
                      <span>Professores</span>
                      <span className="text-sm bg-secondary/20 px-2 py-0.5 rounded text-muted-foreground">Em breve</span>
                    </div>
                  )}
                  
                  {['admin', 'teacher'].includes(currentPortal.id) && (
                    <div className="flex items-center justify-between px-3 py-2.5 text-base font-medium text-sidebar-foreground/40 rounded-md cursor-not-allowed">
                      <span>Avaliações</span>
                      <span className="text-sm bg-secondary/20 px-2 py-0.5 rounded text-muted-foreground">Em breve</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Commercial Module - Mostrar apenas para admin, hub e partner */}
            {['admin', 'hub', 'partner'].includes(currentPortal.id) && (
              <div className="nav-group">
                <button 
                  className="flex items-center justify-between w-full px-4 py-3 text-base font-medium text-sidebar-foreground rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" 
                  onClick={() => toggleGroup('commercial')}
                >
                  <div className="flex items-center">
                    <Store className="mr-4 h-5 w-5 text-sidebar-foreground/70" />
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
                    {/* Leads - visível para todos os portais comerciais */}
                    <div className="flex items-center justify-between px-2 py-2 text-sm font-medium text-sidebar-foreground/40 rounded-md cursor-not-allowed">
                      <span>Leads</span>
                      <span className="text-xs bg-secondary/20 px-1.5 py-0.5 rounded text-muted-foreground">Em breve</span>
                    </div>
                    
                    {/* Oportunidades - apenas admin e hub */}
                    {['admin', 'hub'].includes(currentPortal.id) && (
                      <div className="flex items-center justify-between px-2 py-2 text-sm font-medium text-sidebar-foreground/40 rounded-md cursor-not-allowed">
                        <span>Oportunidades</span>
                        <span className="text-xs bg-secondary/20 px-1.5 py-0.5 rounded text-muted-foreground">Em breve</span>
                      </div>
                    )}
                    
                    {/* Campanhas - apenas admin */}
                    {currentPortal.id === 'admin' && (
                      <div className="flex items-center justify-between px-2 py-2 text-sm font-medium text-sidebar-foreground/40 rounded-md cursor-not-allowed">
                        <span>Campanhas</span>
                        <span className="text-xs bg-secondary/20 px-1.5 py-0.5 rounded text-muted-foreground">Em breve</span>
                      </div>
                    )}
                    
                    {/* Automações - apenas admin */}
                    {currentPortal.id === 'admin' && (
                      <div className="flex items-center justify-between px-2 py-2 text-sm font-medium text-sidebar-foreground/40 rounded-md cursor-not-allowed">
                        <span>Automações</span>
                        <span className="text-xs bg-secondary/20 px-1.5 py-0.5 rounded text-muted-foreground">Em breve</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Financial Module - Mostrar apenas para admin e partner */}
            {['admin', 'partner'].includes(currentPortal.id) && (
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
                    
                    {currentPortal.id === 'admin' && (
                      <>
                        <div className="flex items-center justify-between px-2 py-2 text-sm font-medium text-sidebar-foreground/40 rounded-md cursor-not-allowed">
                          <span>Faturamento</span>
                          <span className="text-xs bg-secondary/20 px-1.5 py-0.5 rounded text-muted-foreground">Em breve</span>
                        </div>
                        
                        <div className="flex items-center justify-between px-2 py-2 text-sm font-medium text-sidebar-foreground/40 rounded-md cursor-not-allowed">
                          <span>Relatórios</span>
                          <span className="text-xs bg-secondary/20 px-1.5 py-0.5 rounded text-muted-foreground">Em breve</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* AI Module - Disponível para todos os portais */}
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
                  
                  {currentPortal.id === 'admin' && (
                    <div className="flex items-center justify-between px-2 py-2 text-sm font-medium text-sidebar-foreground/40 rounded-md cursor-not-allowed">
                      <span>Configurações</span>
                      <span className="text-xs bg-secondary/20 px-1.5 py-0.5 rounded text-muted-foreground">Em breve</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Productivity Module - Apenas admin e teacher */}
            {['admin', 'teacher'].includes(currentPortal.id) && (
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
                    {/* Módulo produtividade em desenvolvimento */}
                    <div className="flex items-center justify-between px-2 py-2 text-sm font-medium text-sidebar-foreground/40 rounded-md cursor-not-allowed">
                      <span>Análise de tempo</span>
                      <span className="text-xs bg-secondary/20 px-1.5 py-0.5 rounded text-muted-foreground">Em breve</span>
                    </div>
                    
                    <div className="flex items-center justify-between px-2 py-2 text-sm font-medium text-sidebar-foreground/40 rounded-md cursor-not-allowed">
                      <span>Metas</span>
                      <span className="text-xs bg-secondary/20 px-1.5 py-0.5 rounded text-muted-foreground">Em breve</span>
                    </div>
                    
                    <div className="flex items-center justify-between px-2 py-2 text-sm font-medium text-sidebar-foreground/40 rounded-md cursor-not-allowed">
                      <span>Relatórios</span>
                      <span className="text-xs bg-secondary/20 px-1.5 py-0.5 rounded text-muted-foreground">Em breve</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Configurações - Para todos os portais */}
            <div className="flex items-center justify-between px-2 py-2 text-sm font-medium text-sidebar-foreground/40 rounded-md cursor-not-allowed">
              <div className="flex items-center">
                <Settings className="mr-3 h-5 w-5 text-sidebar-foreground/40" />
                <span>Configurações</span>
              </div>
              <span className="text-xs bg-secondary/20 px-1.5 py-0.5 rounded text-muted-foreground">Em breve</span>
            </div>
          </nav>
        </div>

        {/* Tenant Information */}
        <div className="border-t border-sidebar-border p-4 mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {user?.tenantId === 1 ? 'E' : 'T'}
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