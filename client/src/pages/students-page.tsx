import React from 'react';
import { StudentsList } from '@/components/students/students-list';
import { Helmet } from 'react-helmet';
import { AppShell } from '@/components/layout/app-shell';

export function StudentsPage() {
  return (
    <AppShell>
      <Helmet>
        <title>Alunos | Edunéxia</title>
      </Helmet>
      <div className="container p-4 mx-auto">
        <StudentsList />
      </div>
    </AppShell>
  );
}