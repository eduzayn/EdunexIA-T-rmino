import React from 'react';
import { SubjectsList } from '@/components/subjects/subjects-list';
import { Helmet } from 'react-helmet';

export function SubjectsPage() {
  return (
    <>
      <Helmet>
        <title>Disciplinas | Edunéxia</title>
      </Helmet>
      <div className="container p-4 mx-auto">
        <SubjectsList />
      </div>
    </>
  );
}