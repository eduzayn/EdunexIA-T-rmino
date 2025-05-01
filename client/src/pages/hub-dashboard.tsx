import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import HubDashboardContent from '@/components/hub/hub-dashboard-content';

/**
 * Página principal do Portal do Polo
 */
const HubDashboard: React.FC = () => {
  return (
    <AppShell>
      <div className="container py-6">
        <HubDashboardContent />
      </div>
    </AppShell>
  );
};

export default HubDashboard;