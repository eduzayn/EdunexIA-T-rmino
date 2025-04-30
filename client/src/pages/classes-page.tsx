import React from 'react';
import { ClassesList } from '@/components/classes/classes-list';
import { Helmet } from 'react-helmet';
import { AppShell } from '@/components/layout/app-shell';

export function ClassesPage() {
  return (
    <AppShell>
      <Helmet>
        <title>Turmas | Edunéxia</title>
      </Helmet>
      <div className="container p-4 mx-auto">
        <ClassesList />
      </div>
    </AppShell>
  );
}