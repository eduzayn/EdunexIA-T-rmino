import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { usePortal } from '@/hooks/use-portal';

/**
 * Componente que permite ao administrador alternar entre a visualização
 * do Portal do Parceiro e o Portal Administrativo usando o botão flutuante
 */
export const PartnerPortalButton: React.FC = () => {
  const [isPartnerView, setIsPartnerView] = useState(true);
  const [location, navigate] = useLocation();
  const { setCurrentPortal } = usePortal();
  
  // Mapeamento de rotas entre os portais
  const routeMap: Record<string, { admin: string, partner: string }> = {
    // Dashboards
    "/admin/partner-view": { 
      admin: "/admin/dashboard", 
      partner: "/partner/dashboard" 
    },
    // Certificações
    "/admin/partner-certifications": { 
      admin: "/admin/partner-certifications", 
      partner: "/partner/certification-requests" 
    },
    // Documentos
    "/admin/student-documents": { 
      admin: "/admin/student-documents", 
      partner: "/partner/student-documents" 
    }
  };
  
  // Identificar a rota atual e seu equivalente no outro portal
  const currentRouteMap = Object.entries(routeMap).find(([adminRoute, _]) => 
    location.startsWith(adminRoute)
  );
  
  const toggleView = () => {
    // Alternar o estado
    const newIsPartnerView = !isPartnerView;
    setIsPartnerView(newIsPartnerView);
    
    // Se a mudança for para visualização de admin, voltar para o dashboard admin
    if (!newIsPartnerView) {
      navigate('/admin/dashboard');
    } else {
      // Se a mudança for para visualização de parceiro, navegar para a visualização de parceiro
      const partnerRoute = currentRouteMap?.[1].partner || '/partner/dashboard';
      // Não mudamos o portal atual, apenas navegamos para a rota correspondente
      navigate('/admin/partner-view');
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button 
        onClick={toggleView}
        className="rounded-full h-12 w-12 shadow-lg flex items-center justify-center bg-primary hover:bg-primary/90"
        title={isPartnerView ? "Voltar à visualização de administrador" : "Alternar para visualização de parceiro"}
      >
        {isPartnerView ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </Button>
    </div>
  );
};