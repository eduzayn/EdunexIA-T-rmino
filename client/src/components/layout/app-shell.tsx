import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

interface AppShellProps {
  children?: React.ReactNode;
  showBreadcrumbs?: boolean;
}

export function AppShell({ children, showBreadcrumbs = true }: AppShellProps) {
  const { isLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [location] = useLocation();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsSidebarOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-xl font-semibold">Carregando Edunéxia</h2>
          <p className="text-muted-foreground mt-2">Por favor, aguarde um momento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header onToggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isMobileOpen={isSidebarOpen}
          onCloseMobile={closeMobileSidebar}
        />
        
        <main className="flex-1 overflow-auto pb-12 bg-background lg:ml-72 pt-0">
          {showBreadcrumbs && (
            <div className="container py-3 border-b">
              <Breadcrumbs />
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
