import React from 'react';
import { SubjectsList } from '@/components/subjects/subjects-list';
import { Helmet } from 'react-helmet';
import { AppShell } from '@/components/layout/app-shell';

export function SubjectsPage() {
  return (
    <AppShell>
      <Helmet>
        <title>Disciplinas | Edunéxia</title>
      </Helmet>
      <div className="container p-4 mx-auto">
        <SubjectsList />
      </div>
    </AppShell>
  );
}