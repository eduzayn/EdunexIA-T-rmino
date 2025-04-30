import React from 'react';
import { StudentsList } from '@/components/students/students-list';
import { Helmet } from 'react-helmet';

export function StudentsPage() {
  return (
    <>
      <Helmet>
        <title>Alunos | Edunéxia</title>
      </Helmet>
      <div className="container p-4 mx-auto">
        <StudentsList />
      </div>
    </>
  );
}