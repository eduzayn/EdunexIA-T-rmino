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
  Award,
  FileText,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  Library,
  MessageSquare,
  UserCog
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
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>({
    academic: false,
    secretary: false,
    partnerships: false,
    ai: false, // Adicionado para o menu de IA
    financial: false,
    commercial: false,
    productivity: false
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
    const newPortalId = e.target.value as PortalType;
    const newPortal = portals.find(p => p.id === newPortalId);
    
    if (newPortal) {
      setCurrentPortal(newPortalId);
      
      // Redirecionar para o dashboard do novo portal
      if (newPortalId === 'partner') {
        // Redirecionar para o dashboard do parceiro
        setLocation('/partner/dashboard');
      } else if (newPortalId === 'student') {
        // Redirecionar para o dashboard do aluno
        setLocation('/student/dashboard');
      } else if (newPortalId === 'admin') {
        // Redirecionar para o dashboard administrativo
        setLocation('/admin/dashboard');
      } else if (newPortalId === 'teacher') {
        // Redirecionar para o dashboard do professor
        setLocation('/teacher/dashboard');
      } else if (newPortalId === 'hub') {
        // Redirecionar para o dashboard do polo
        setLocation('/hub/dashboard');
      }
    }
  };

  const sidebarClasses = cn(
    "fixed inset-y-0 left-0 z-50 flex flex-col h-full border-r border-sidebar-border bg-sidebar-background text-sidebar-foreground",
    "transform transition-all duration-300 ease-in-out lg:translate-x-0",
    collapsed ? "w-16" : "w-72",
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
        <div className="pt-3 pb-1">
          <div className="flex items-center px-6 pb-2 justify-between">
            <div className={cn("flex items-center", collapsed ? "justify-center w-full" : "")}>
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-primary to-purple-600 rounded-md">
                <span className="text-white font-bold text-xl">E</span>
              </div>
              {!collapsed && (
                <div className="flex flex-col ml-3">
                  <span className="text-xs text-sidebar-foreground/60 tracking-wider font-medium mb-0.5">NEXTGEN</span>
                  <span className="text-2xl font-bold text-sidebar-foreground leading-none">Edunéx<span className="text-primary font-black">IA</span></span>
                </div>
              )}
            </div>
            
            {/* Botão de toggle do sidebar */}
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                "flex items-center justify-center rounded-full p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors",
                collapsed ? "absolute -right-4 top-6 bg-sidebar-background shadow border border-sidebar-border" : ""
              )}
            >
              {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className={cn("pt-1 pb-4 flex-1 overflow-y-auto", collapsed ? "px-2" : "px-6")}>
          {/* Portal Selector */}
          {!collapsed && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-muted-foreground mb-1">
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
          )}
          
          {/* Portal Selector para sidebar colapsado */}
          {collapsed && (
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center justify-center p-2 rounded-full bg-sidebar-accent">
                {portalIcons[currentPortal.id]}
              </div>
            </div>
          )}

          {/* Navigation Menu */}
          <nav className="space-y-2">
            {/* Link para o Dashboard administrativo - não mostrar para estudantes */}
            {currentPortal.id !== 'student' && (
              <Link 
                href="/" 
                className={cn(
                  "flex items-center text-base font-medium rounded-md transition-colors",
                  collapsed ? "justify-center py-3 px-2" : "px-4 py-3",
                  isActive("/") 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                title="Dashboard"
              >
                <LayoutDashboard className={cn("h-5 w-5", collapsed ? "" : "mr-4")} />
                {!collapsed && "Dashboard"}
              </Link>
            )}
            
            {/* Links específicos para o portal do aluno */}
            {currentPortal.id === 'student' && (
              <>
                <Link 
                  href="/student/dashboard" 
                  className={cn(
                    "flex items-center text-base font-medium rounded-md transition-colors",
                    collapsed ? "justify-center py-3 px-2" : "px-4 py-3",
                    isActive("/student/dashboard") 
                      ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  title="Meu Dashboard"
                >
                  <LayoutDashboard className={cn("h-5 w-5", collapsed ? "" : "mr-4")} />
                  {!collapsed && "Meu Dashboard"}
                </Link>

                <Link 
                  href="/student/messages" 
                  className={cn(
                    "flex items-center text-base font-medium rounded-md transition-colors",
                    collapsed ? "justify-center py-3 px-2" : "px-4 py-3",
                    isActive("/student/messages") 
                      ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  title="Mensagens"
                >
                  <MessageSquare className={cn("h-5 w-5", collapsed ? "" : "mr-4")} />
                  {!collapsed && "Mensagens"}
                </Link>

                <Link 
                  href="/student/settings" 
                  className={cn(
                    "flex items-center text-base font-medium rounded-md transition-colors",
                    collapsed ? "justify-center py-3 px-2" : "px-4 py-3",
                    isActive("/student/settings") 
                      ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  title="Configurações"
                >
                  <UserCog className={cn("h-5 w-5", collapsed ? "" : "mr-4")} />
                  {!collapsed && "Configurações"}
                </Link>
              </>
            )}

            {/* Academic Module */}
            <div className="nav-group">
              <button 
                className={cn(
                  "flex items-center font-medium rounded-md transition-colors",
                  collapsed ? "justify-center py-3 px-2 w-full" : "justify-between w-full px-4 py-3",
                  "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )} 
                onClick={() => toggleGroup('academic')}
                title="Acadêmico"
              >
                {collapsed ? (
                  <BookOpen className="h-5 w-5 text-sidebar-foreground/70" />
                ) : (
                  <>
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
                  </>
                )}
              </button>

              {openGroups.academic && (
                <div className="pl-12 space-y-2 mt-2">
                  {currentPortal.id !== 'partner' && (
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
                  )}
                  
                  {/* Itens específicos para o Portal do Aluno */}
                  {currentPortal.id === 'student' && (
                    <>
                      {/* Links diretos para submenu do módulo acadêmico */}
                      <Link 
                        href={`${currentPortal.baseRoute}/documents`}
                        className={cn(
                          "flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-colors",
                          isActive(`${currentPortal.baseRoute}/documents`) 
                            ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      >
                        Documentos
                      </Link>
                      
                      <Link 
                        href={`${currentPortal.baseRoute}/contracts`}
                        className={cn(
                          "flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-colors",
                          isActive(`${currentPortal.baseRoute}/contracts`) 
                            ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      >
                        Contratos
                      </Link>

                      <Link 
                        href={`${currentPortal.baseRoute}/library`}
                        className={cn(
                          "flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-colors",
                          isActive(`${currentPortal.baseRoute}/library`) || location.startsWith(`${currentPortal.baseRoute}/library/`)
                            ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      >
                        Biblioteca
                      </Link>
                    </>
                  )}
                  
                  {/* Mostrar ou esconder itens com base no tipo de portal */}
                  {/* Itens para o Portal do Parceiro */}
                  {currentPortal.id === 'partner' && (
                    <>
                      <Link 
                        href={`${currentPortal.baseRoute}/register-student`}
                        className={cn(
                          "flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-colors",
                          isActive(`${currentPortal.baseRoute}/register-student`) 
                            ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      >
                        Cadastrar Aluno
                      </Link>
                    
                      <Link 
                        href={`${currentPortal.baseRoute}/student-documents`}
                        className={cn(
                          "flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-colors",
                          isActive(`${currentPortal.baseRoute}/student-documents`) 
                            ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      >
                        Documentação
                      </Link>
                      
                      <Link 
                        href={`${currentPortal.baseRoute}/certification-requests`}
                        className={cn(
                          "flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-colors",
                          isActive(`${currentPortal.baseRoute}/certification-requests`) 
                            ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      >
                        Certificações
                      </Link>
                      
                      <Link 
                        href={`${currentPortal.baseRoute}/payments`}
                        className={cn(
                          "flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-colors",
                          isActive(`${currentPortal.baseRoute}/payments`) 
                            ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      >
                        Pagamentos
                      </Link>
                    </>
                  )}
                  
                  {/* Certificações para administradores - Link movido para a seção Secretaria */}
                  
                  {/* Disciplinas e turmas para professores e administradores */}
                  {['admin', 'teacher'].includes(currentPortal.id) && (
                    <>
                      <Link 
                        href={`${currentPortal.baseRoute}/subjects`}
                        className={cn(
                          "flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-colors",
                          isActive(`${currentPortal.baseRoute}/subjects`) 
                            ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      >
                        Disciplinas
                      </Link>
                      
                      <Link 
                        href={`${currentPortal.baseRoute}/classes`}
                        className={cn(
                          "flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-colors",
                          isActive(`${currentPortal.baseRoute}/classes`) 
                            ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      >
                        Turmas
                      </Link>
                    </>
                  )}
                  
                  {['admin', 'hub'].includes(currentPortal.id) && (
                    <>
                      <Link 
                        href={`${currentPortal.baseRoute}/students`}
                        className={cn(
                          "flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-colors",
                          isActive(`${currentPortal.baseRoute}/students`) 
                            ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      >
                        Alunos
                      </Link>
                      
                      {/* Link de documentação movido para a seção Secretaria */}
                    </>
                  )}
                  
                  {['admin', 'hub'].includes(currentPortal.id) && (
                    <Link 
                      href={`${currentPortal.baseRoute}/teachers`}
                      className={cn(
                        "flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-colors",
                        isActive(`${currentPortal.baseRoute}/teachers`) 
                          ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      Professores
                    </Link>
                  )}
                  
                  {['admin', 'teacher'].includes(currentPortal.id) && (
                    <Link 
                      href={`${currentPortal.baseRoute}/assessments`}
                      className={cn(
                        "flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-colors",
                        isActive(`${currentPortal.baseRoute}/assessments`) 
                          ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      Avaliações
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Secretary Module - Apenas para admin */}
            {currentPortal.id === 'admin' && (
              <div className="nav-group">
                <button 
                  className={cn(
                    "flex items-center font-medium rounded-md transition-colors",
                    collapsed ? "justify-center py-3 px-2 w-full" : "justify-between w-full px-4 py-3",
                    "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )} 
                  onClick={() => toggleGroup('secretary')}
                  title="Secretaria"
                >
                  {collapsed ? (
                    <FileText className="h-5 w-5 text-sidebar-foreground/70" />
                  ) : (
                    <>
                      <div className="flex items-center">
                        <FileText className="mr-4 h-5 w-5 text-sidebar-foreground/70" />
                        Secretaria
                      </div>
                      <ChevronDown 
                        className={cn(
                          "h-5 w-5 text-sidebar-foreground/70 transition-transform",
                          openGroups.secretary ? "transform rotate-180" : ""
                        )} 
                      />
                    </>
                  )}
                </button>

                {openGroups.secretary && (
                  <div className="pl-12 space-y-2 mt-2">
                    {/* Itens da secretaria em desenvolvimento */}
                    <Link
                      href={`${currentPortal.baseRoute}/simplified-enrollment`}
                      className={cn(
                        "flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                        isActive(`${currentPortal.baseRoute}/simplified-enrollment`) 
                          ? "bg-sidebar-accent/50 text-sidebar-foreground" 
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground"
                      )}
                    >
                      Matrícula
                    </Link>
                    
                    <Link
                      href={`${currentPortal.baseRoute}/secretary/academic-transcript`}
                      className={cn(
                        "flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                        isActive(`${currentPortal.baseRoute}/secretary/academic-transcript`) 
                          ? "bg-sidebar-accent/50 text-sidebar-foreground" 
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground"
                      )}
                    >
                      Histórico Escolar
                    </Link>
                    
                    <Link 
                      href={`${currentPortal.baseRoute}/student-documents`}
                      className={cn(
                        "flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-colors",
                        isActive(`${currentPortal.baseRoute}/student-documents`) 
                          ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      Documentação
                    </Link>
                    
                    <Link 
                      href={`${currentPortal.baseRoute}/contracts`}
                      className={cn(
                        "flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-colors",
                        isActive(`${currentPortal.baseRoute}/contracts`) 
                          ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      Contratos
                    </Link>
                  </div>
                )}
              </div>
            )}
            
            {/* Inteligência Artificial - Para todos exceto hub */}
            {!['hub'].includes(currentPortal.id) && (
              <div className="nav-group">
                <button 
                  className={cn(
                    "flex items-center font-medium rounded-md transition-colors",
                    collapsed ? "justify-center py-3 px-2 w-full" : "justify-between w-full px-4 py-3",
                    "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )} 
                  onClick={() => toggleGroup('ai')}
                  title="Inteligência Artificial"
                >
                  {collapsed ? (
                    <Bot className="h-5 w-5 text-sidebar-foreground/70" />
                  ) : (
                    <>
                      <div className="flex items-center">
                        <Bot className="mr-4 h-5 w-5 text-sidebar-foreground/70" />
                        Inteligência Artificial
                      </div>
                      <ChevronDown 
                        className={cn(
                          "h-5 w-5 text-sidebar-foreground/70 transition-transform",
                          openGroups.ai ? "transform rotate-180" : ""
                        )} 
                      />
                    </>
                  )}
                </button>
                
                {openGroups.ai && (
                  <div className="pl-12 space-y-2 mt-2">
                    {/* Links para a Prof. Ana IA */}
                    <Link 
                      href={`${currentPortal.baseRoute}/ai/dashboard`}
                      className={cn(
                        "flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-colors",
                        isActive(`${currentPortal.baseRoute}/ai/dashboard`) 
                          ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      Dashboard IA
                    </Link>
                    
                    <Link 
                      href={`${currentPortal.baseRoute}/ai/chat`}
                      className={cn(
                        "flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-colors",
                        isActive(`${currentPortal.baseRoute}/ai/chat`) 
                          ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      Prof. Ana Chat
                    </Link>
                    
                    <Link 
                      href={`${currentPortal.baseRoute}/ai/content-generator`}
                      className={cn(
                        "flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-colors",
                        isActive(`${currentPortal.baseRoute}/ai/content-generator`) 
                          ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      Gerador de Conteúdo
                    </Link>
                    
                    <Link 
                      href={`${currentPortal.baseRoute}/ai/text-analyzer`}
                      className={cn(
                        "flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-colors",
                        isActive(`${currentPortal.baseRoute}/ai/text-analyzer`) 
                          ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      Analisador de Textos
                    </Link>
                    
                    <Link 
                      href={`${currentPortal.baseRoute}/ai/image-analyzer`}
                      className={cn(
                        "flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-colors",
                        isActive(`${currentPortal.baseRoute}/ai/image-analyzer`) 
                          ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      Analisador de Imagens
                    </Link>
                  </div>
                )}
              </div>
            )}
            
            {/* ADM Parcerias - Apenas para admin */}
            {currentPortal.id === 'admin' && (
              <div className="nav-group">
                <button 
                  className={cn(
                    "flex items-center justify-between w-full px-4 py-3 text-base font-medium rounded-md transition-colors",
                    "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )} 
                  onClick={() => toggleGroup('partnerships')}
                >
                  <div className="flex items-center">
                    <Award className="mr-4 h-5 w-5 text-sidebar-foreground/70" />
                    ADM Parcerias
                  </div>
                  <ChevronDown 
                    className={cn(
                      "h-5 w-5 text-sidebar-foreground/70 transition-transform",
                      openGroups.partnerships ? "transform rotate-180" : ""
                    )} 
                  />
                </button>

                {openGroups.partnerships && (
                  <div className="pl-12 space-y-2 mt-2">
                    <Link 
                      href={`/admin/partner-certifications`}
                      className={cn(
                        "flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-colors",
                        isActive(`/admin/partner-certifications`) 
                          ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      Certificações de Parceiros
                    </Link>
                    
                    <Link 
                      href={`/admin/partner-payments`}
                      className={cn(
                        "flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-colors",
                        isActive(`/admin/partner-payments`) 
                          ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      Pagamentos de Certificações
                    </Link>
                    
                    <Link 
                      href={`${currentPortal.baseRoute}/teacher-view`}
                      className={cn(
                        "flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-colors",
                        isActive(`${currentPortal.baseRoute}/teacher-view`) 
                          ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      Portal do Professor
                    </Link>
                    
                    <Link 
                      href={`${currentPortal.baseRoute}/hub-view`}
                      className={cn(
                        "flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-colors",
                        isActive(`${currentPortal.baseRoute}/hub-view`) 
                          ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      Portal do Polo
                    </Link>
                    
                    <Link 
                      href={`${currentPortal.baseRoute}/partner-view`}
                      className={cn(
                        "flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-colors",
                        isActive(`${currentPortal.baseRoute}/partner-view`) 
                          ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      Portal do Parceiro
                    </Link>
                  </div>
                )}
              </div>
            )}
            
            {/* Commercial Module - Mostrar apenas para admin e hub */}
            {['admin', 'hub'].includes(currentPortal.id) && (
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
                    {['admin', 'hub'].includes(currentPortal.id) && (
                      <Link 
                        href={`${currentPortal.baseRoute}/leads`}
                        className={cn(
                          "flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-colors",
                          isActive(`${currentPortal.baseRoute}/leads`) 
                            ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      >
                        Leads
                      </Link>
                    )}
                    
                    {/* Oportunidades - apenas admin e hub */}
                    {['admin', 'hub'].includes(currentPortal.id) && (
                      <Link 
                        href={`${currentPortal.baseRoute}/opportunities`}
                        className={cn(
                          "flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-colors",
                          isActive(`${currentPortal.baseRoute}/opportunities`) 
                            ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      >
                        Oportunidades
                      </Link>
                    )}
                    
                    {/* Campanhas - apenas admin */}
                    {currentPortal.id === 'admin' && (
                      <Link 
                        href={`${currentPortal.baseRoute}/campaigns`}
                        className={cn(
                          "flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-colors",
                          isActive(`${currentPortal.baseRoute}/campaigns`) 
                            ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      >
                        Campanhas
                      </Link>
                    )}
                    
                    {/* Matrícula Simplificada - admin e hub */}
                    {['admin', 'hub'].includes(currentPortal.id) && (
                      <Link 
                        href={`${currentPortal.baseRoute}/simplified-enrollment`}
                        className={cn(
                          "flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-colors",
                          isActive(`${currentPortal.baseRoute}/simplified-enrollment`) 
                            ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      >
                        Matrícula Simplificada
                      </Link>
                    )}
                    
                    {/* Automações - apenas admin */}
                    {currentPortal.id === 'admin' && (
                      <Link 
                        href={`${currentPortal.baseRoute}/automations`}
                        className={cn(
                          "flex items-center px-3 py-2.5 text-base font-medium rounded-md transition-colors",
                          isActive(`${currentPortal.baseRoute}/automations`) 
                            ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        )}
                      >
                        Automações
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Financial Module - Mostrar apenas para admin */}
            {['admin'].includes(currentPortal.id) && (
              <div className="nav-group">
                <button 
                  className="flex items-center justify-between w-full px-4 py-3 text-base font-medium text-sidebar-foreground rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" 
                  onClick={() => toggleGroup('financial')}
                >
                  <div className="flex items-center">
                    <DollarSign className="mr-4 h-5 w-5 text-sidebar-foreground/70" />
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
                    <Link 
                      to="/admin/payments" 
                      className={cn(
                        "flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                        location === "/admin/payments"
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-item-hover hover:text-sidebar-foreground"
                      )}
                    >
                      Pagamentos
                    </Link>
                    
                    <Link 
                      to="/admin/subscriptions" 
                      className={cn(
                        "flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                        location === "/admin/subscriptions"
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-item-hover hover:text-sidebar-foreground"
                      )}
                    >
                      Assinaturas
                    </Link>
                    
                    {currentPortal.id === 'admin' && (
                      <>
                        <Link 
                          to="/admin/billing" 
                          className={cn(
                            "flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                            location === "/admin/billing"
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-item-hover hover:text-sidebar-foreground"
                          )}
                        >
                          Faturamento
                        </Link>
                        
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

            {/* Módulo de Produtividade - Em desenvolvimento */}

            {/* Productivity Module - Apenas admin e teacher */}
            {['admin', 'teacher'].includes(currentPortal.id) && (
              <div className="nav-group">
                <button 
                  className="flex items-center justify-between w-full px-4 py-3 text-base font-medium text-sidebar-foreground rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" 
                  onClick={() => toggleGroup('productivity')}
                >
                  <div className="flex items-center">
                    <LineChart className="mr-4 h-5 w-5 text-sidebar-foreground/70" />
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
                    {/* Links para o módulo de produtividade */}
                    <Link 
                      href={`${currentPortal.baseRoute}/productivity/time-analysis`}
                      className={cn(
                        "flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                        isActive(`${currentPortal.baseRoute}/productivity/time-analysis`) 
                          ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      Análise de tempo
                    </Link>
                    
                    <Link 
                      href={`${currentPortal.baseRoute}/productivity/goals`}
                      className={cn(
                        "flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                        isActive(`${currentPortal.baseRoute}/productivity/goals`) 
                          ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      Metas
                    </Link>
                    
                    <Link 
                      href={`${currentPortal.baseRoute}/productivity/reports`}
                      className={cn(
                        "flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                        isActive(`${currentPortal.baseRoute}/productivity/reports`) 
                          ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      Relatórios
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Ferramentas Administrativas - Apenas para admin */}
            {currentPortal.id === 'admin' && (
              <div className="nav-group pt-6">
                <h3 className={cn(
                  "ml-4 text-xs font-semibold text-sidebar-foreground/40",
                  collapsed && "text-center w-full ml-0"
                )}>
                  {collapsed ? "TOOLS" : "FERRAMENTAS"}
                </h3>
                <div className="mt-1 space-y-1 px-3">
                  <Link 
                    href="/admin/sms-test"
                    className={cn(
                      "flex items-center px-4 py-3 text-base font-medium rounded-md transition-colors",
                      isActive("/admin/sms-test") 
                        ? "bg-sidebar-accent/70 text-sidebar-foreground" 
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <FileText className="mr-4 h-5 w-5 text-sidebar-foreground/70" />
                    Teste de SMS
                  </Link>
                </div>
              </div>
            )}
            
            {/* Configurações - Para admin e teacher */}
            {['admin', 'teacher'].includes(currentPortal.id) && (
              <Link
                href={`${currentPortal.baseRoute}/settings`}
                className={cn(
                  "flex items-center px-4 py-3 text-base font-medium rounded-md transition-colors",
                  isActive(`${currentPortal.baseRoute}/settings`)
                    ? "bg-sidebar-accent/70 text-sidebar-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <Settings className="mr-4 h-5 w-5 text-sidebar-foreground/70" />
                Configurações
              </Link>
            )}
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
                  {user?.tenantId === 1 ? 'EdunéxIA Demo' : 'Tenant Secundário'}
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