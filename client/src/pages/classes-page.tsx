import React from 'react';
import { ClassesList } from '@/components/classes/classes-list';
import { Helmet } from 'react-helmet';

export function ClassesPage() {
  return (
    <>
      <Helmet>
        <title>Turmas | Edunéxia</title>
      </Helmet>
      <div className="container p-4 mx-auto">
        <ClassesList />
      </div>
    </>
  );
}