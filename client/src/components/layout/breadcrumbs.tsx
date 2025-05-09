import { useLocation, Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items = [], className = "" }: BreadcrumbsProps) {
  const [location] = useLocation();
  
  // Gerar breadcrumbs automaticamente baseado na URL atual
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items.length > 0) return items;
    
    const paths = location.split('/').filter(Boolean);
    let currentPath = '';
    const defaultCrumbs: BreadcrumbItem[] = [];
    
    // Mapeamento de rotas para labels mais amigáveis
    const routeLabels: Record<string, string> = {
      // Rotas gerais
      'courses': 'Cursos',
      'new': 'Novo',
      'edit': 'Editar',
      'subjects': 'Disciplinas',
      'students': 'Alunos',
      'teachers': 'Professores',
      'classes': 'Turmas',
      'assessments': 'Avaliações',
      'leads': 'Leads',
      'settings': 'Configurações',
      
      // Portal do Admin
      'admin': 'Administrativo',
      'student-documents': 'Documentos de Alunos',
      'partner-view': 'Visualização do Parceiro',
      'teacher-view': 'Visualização do Professor',
      'hub-view': 'Visualização do Polo',
      'simplified-enrollment': 'Matrícula Simplificada',
      'contracts': 'Contratos',
      'sms-test': 'Teste de SMS',
      'partner-certifications': 'Certificações de Parceiros',
      'partner-payments': 'Pagamentos de Parceiros',

      // Portal do Aluno
      'student': 'Aluno',
      'dashboard': 'Dashboard',
      'documents': 'Documentos',
      
      // Portal do Professor
      'teacher': 'Professor',
      
      // Portal do Parceiro
      'partner': 'Parceiro',
      'register-student': 'Cadastrar Aluno',
      'certification-requests': 'Solicitações de Certificação',
      'payments': 'Pagamentos',
      
      // Portal do Polo
      'hub': 'Polo',

      // Certificados
      'certificates': 'Certificados',
    };
    
    // Sempre começa com o dashboard
    if (location !== '/') {
      defaultCrumbs.push({ 
        label: 'Dashboard', 
        href: '/' 
      });
    }
    
    // Adiciona cada segmento do caminho
    paths.forEach((path, i) => {
      // Pula o ID em caminhos como /courses/123/edit
      if (!isNaN(Number(path)) && i < paths.length - 1) {
        currentPath += `/${path}`;
        return;
      }
      
      currentPath += `/${path}`;
      const label = routeLabels[path] || path.charAt(0).toUpperCase() + path.slice(1);
      
      defaultCrumbs.push({
        label: label,
        href: currentPath
      });
    });
    
    return defaultCrumbs;
  };
  
  const breadcrumbs = generateBreadcrumbs();
  
  // Não renderiza nada se não houver breadcrumbs
  if (breadcrumbs.length <= 1 && location === '/') return null;
  
  return (
    <nav className={`flex items-center space-x-1 text-sm py-2 ${className}`} aria-label="Breadcrumbs">
      {location === '/' ? (
        <span className="flex items-center text-muted-foreground">
          <span className="w-4 inline-flex items-center justify-center">
            <Home className="h-4 w-4" />
          </span>
          <span className="ml-2">Dashboard</span>
        </span>
      ) : (
        breadcrumbs.map((crumb, i) => {
          const isLast = i === breadcrumbs.length - 1;
          
          return (
            <div key={crumb.href} className="flex items-center">
              {i > 0 && <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />}
              
              {isLast ? (
                <span className="font-medium">{crumb.label}</span>
              ) : (
                <Link 
                  href={crumb.href}
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center"
                >
                  {i === 0 ? (
                    <>
                      <span className="w-4 inline-flex items-center justify-center">
                        <Home className="h-4 w-4" />
                      </span>
                      <span className="ml-2">{crumb.label}</span>
                    </>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                </Link>
              )}
            </div>
          );
        })
      )}
    </nav>
  );
}