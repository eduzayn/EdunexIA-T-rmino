import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth-page";
import CoursesPage from "@/pages/courses-page";
import CourseDetailsPage from "@/pages/course-details-page";
import CourseCreatePage from "@/pages/course-create-page";
import CourseEditPage from "@/pages/course-edit-page";
import ModuleCreatePage from "@/pages/module-create-page";
import ModuleEditPage from "@/pages/module-edit-page";
import { SubjectsPage } from "@/pages/subjects-page";
import { SubjectCreatePage } from "@/pages/subject-create-page";
import { SubjectEditPage } from "@/pages/subject-edit-page";
import { SubjectDetailsPage } from "@/pages/subject-details-page";
import { ClassesPage } from "@/pages/classes-page";
import { ClassCreatePage } from "@/pages/class-create-page";
import { ClassEditPage } from "@/pages/class-edit-page";
import { ClassDetailsPage } from "@/pages/class-details-page";
import { StudentsPage } from "@/pages/students-page";
import { StudentCreatePage } from "@/pages/student-create-page";
import { StudentEditPage } from "@/pages/student-edit-page";
import { StudentDetailsPage } from "@/pages/student-details-page";
import TeachersPage from "@/pages/teachers-page";
import TeacherDetailsPage from "@/pages/teacher-details-page";
import TeacherCreatePage from "@/pages/teacher-create-page";
import TeacherEditPage from "@/pages/teacher-edit-page";
import AssessmentDetailsPage from "@/pages/assessment-details-page";
import AssessmentNewPage from "@/pages/assessment-new-page";
import StudentDashboard from "@/pages/student-dashboard";
import AssessmentEditPage from "@/pages/assessment-edit-page";
import { AssessmentsPage } from "@/pages/assessments-page";
import { ProtectedRoute } from "./lib/protected-route";
import { PortalProvider, usePortal } from "./hooks/use-portal";
import { AuthProvider } from "./hooks/use-auth";
import StudentCoursesPage from "@/pages/student-courses-page";
import StudentCourseDetailsPage from "@/pages/student-course-details-page";
import StudentDocumentsPage from "@/pages/student-documents-page";
import AdminStudentDocumentsPage from "@/pages/admin-student-documents-page";
import PartnerDashboard from "@/pages/partner-dashboard";
import PartnerStudentDocumentsPage from "@/pages/partner-student-documents-page";
import PartnerCertificationRequestsPage from "@/pages/partner-certification-requests-page";
import AdminPartnerCertificationsPage from "@/pages/admin-partner-certifications-page";
import CertificateTemplatePage from "@/pages/certificate-template-page";
import AdminPartnerViewPage from "@/pages/admin-partner-view-page";
import AdminTeacherViewPage from "@/pages/admin-teacher-view-page";
import PartnerRegisterStudentPage from "@/pages/partner-register-student-page";
import PartnerPaymentsPage from "@/pages/partner-payments-page";
import AdminPartnerPaymentsPage from "@/pages/admin-partner-payments-page";
import TeacherDashboard from "@/pages/teacher-dashboard";
import TeacherPortalButton from "@/components/admin/teacher-portal-button";

import HubDashboard from "@/pages/hub-dashboard";
import AdminHubViewPage from "@/pages/admin-hub-view-page";
import SimplifiedEnrollmentPage from "@/pages/admin/simplified-enrollment-page";

function Router() {
  const { currentPortal } = usePortal();
  const baseRoute = currentPortal.baseRoute;
  
  return (
    <Switch>
      {/* Rota principal - Dashboard administrativo (exceto para estudantes) */}
      <ProtectedRoute path="/" component={(props) => {
        const { currentPortal } = usePortal();
        
        // Se for um estudante, redirecionar para o dashboard do aluno
        if (currentPortal.id === 'student') {
          return <StudentDashboard {...props} />;
        }
        
        // Se não for estudante, mostrar o dashboard administrativo
        return <Dashboard {...props} />;
      }} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Rotas do Portal Administrativo */}
      <ProtectedRoute path="/admin/courses" component={CoursesPage} />
      <ProtectedRoute path="/admin/courses/new" component={CourseCreatePage} />
      <ProtectedRoute path="/admin/courses/:id/edit" component={CourseEditPage} />
      <ProtectedRoute path="/admin/courses/:id/modules/new" component={ModuleCreatePage} />
      <ProtectedRoute path="/admin/courses/:courseId/modules/:moduleId/edit" component={ModuleEditPage} />
      <ProtectedRoute path="/admin/courses/:id" component={CourseDetailsPage} />
      
      {/* Rotas de Disciplinas */}
      <ProtectedRoute path="/admin/subjects" component={SubjectsPage} />
      <ProtectedRoute path="/admin/subjects/new" component={SubjectCreatePage} />
      <ProtectedRoute path="/admin/subjects/:id/edit" component={SubjectEditPage} />
      <ProtectedRoute path="/admin/subjects/:id" component={SubjectDetailsPage} />
      
      {/* Rotas de Turmas */}
      <ProtectedRoute path="/admin/classes" component={ClassesPage} />
      <ProtectedRoute path="/admin/classes/new" component={ClassCreatePage} />
      <ProtectedRoute path="/admin/classes/:id/edit" component={ClassEditPage} />
      <ProtectedRoute path="/admin/classes/:id" component={ClassDetailsPage} />
      
      {/* Rotas de Avaliações */}
      <ProtectedRoute path="/admin/assessments" component={AssessmentsPage} />
      <ProtectedRoute path="/admin/assessments/new" component={AssessmentNewPage} />
      <ProtectedRoute path="/admin/classes/:classId/assessments/new" component={AssessmentNewPage} />
      <ProtectedRoute path="/admin/assessments/:id/edit" component={AssessmentEditPage} />
      <ProtectedRoute path="/admin/assessments/:id" component={AssessmentDetailsPage} />
      
      {/* Rotas de Alunos */}
      <ProtectedRoute path="/admin/students" component={StudentsPage} />
      <ProtectedRoute path="/admin/students/new" component={StudentCreatePage} />
      <ProtectedRoute path="/admin/students/:id/edit" component={StudentEditPage} />
      <ProtectedRoute path="/admin/students/:id" component={StudentDetailsPage} />
      
      {/* Rotas de Professores */}
      <ProtectedRoute path="/admin/teachers" component={TeachersPage} />
      <ProtectedRoute path="/admin/teachers/new" component={TeacherCreatePage} />
      <ProtectedRoute path="/admin/teachers/:id/edit" component={TeacherEditPage} />
      <ProtectedRoute path="/admin/teachers/:id" component={TeacherDetailsPage} />
      
      {/* Rotas de Documentos */}
      <ProtectedRoute path="/admin/student-documents" component={AdminStudentDocumentsPage} />
      <ProtectedRoute path="/admin/partner-view" component={AdminPartnerViewPage} />
      <ProtectedRoute path="/admin/teacher-view" component={AdminTeacherViewPage} />
      <ProtectedRoute path="/admin/hub-view" component={AdminHubViewPage} />
      <ProtectedRoute path="/admin/simplified-enrollment" component={SimplifiedEnrollmentPage} />
      
      {/* Rotas do Portal do Aluno */}
      <ProtectedRoute path="/student/dashboard" component={StudentDashboard} />
      <ProtectedRoute path="/student/courses" component={StudentCoursesPage} />
      <ProtectedRoute path="/student/courses/:id" component={StudentCourseDetailsPage} />
      <ProtectedRoute path="/student/documents" component={StudentDocumentsPage} />
      
      {/* Rotas do Portal do Professor */}
      <ProtectedRoute path="/teacher/dashboard" component={TeacherDashboard} />
      <ProtectedRoute path="/teacher/courses" component={CoursesPage} />
      <ProtectedRoute path="/teacher/courses/:id" component={CourseDetailsPage} />
      <ProtectedRoute path="/teacher/courses/:id/edit" component={CourseEditPage} />
      <ProtectedRoute path="/teacher/subjects" component={SubjectsPage} />
      <ProtectedRoute path="/teacher/subjects/:id" component={SubjectDetailsPage} />
      <ProtectedRoute path="/teacher/subjects/:id/edit" component={SubjectEditPage} />
      <ProtectedRoute path="/teacher/classes" component={ClassesPage} />
      <ProtectedRoute path="/teacher/classes/:id" component={ClassDetailsPage} />
      <ProtectedRoute path="/teacher/assessments" component={AssessmentsPage} />
      <ProtectedRoute path="/teacher/assessments/new" component={AssessmentNewPage} />
      <ProtectedRoute path="/teacher/assessments/:id" component={AssessmentDetailsPage} />
      
      {/* Rotas do Portal do Polo */}
      <ProtectedRoute path="/hub/dashboard" component={HubDashboard} />
      <ProtectedRoute path="/hub/courses" component={CoursesPage} />
      <ProtectedRoute path="/hub/students" component={StudentsPage} />
      <ProtectedRoute path="/hub/teachers" component={TeachersPage} />
      <ProtectedRoute path="/hub/simplified-enrollment" component={SimplifiedEnrollmentPage} />
      
      {/* Rotas do Portal do Parceiro */}
      <ProtectedRoute path="/partner/dashboard" component={PartnerDashboard} />
      <ProtectedRoute path="/partner/register-student" component={PartnerRegisterStudentPage} />
      <ProtectedRoute path="/partner/student-documents" component={PartnerStudentDocumentsPage} />
      <ProtectedRoute path="/partner/certification-requests" component={PartnerCertificationRequestsPage} />
      <ProtectedRoute path="/partner/payments" component={PartnerPaymentsPage} />
      <ProtectedRoute path="/admin/partner-certifications" component={AdminPartnerCertificationsPage} />
      <ProtectedRoute path="/admin/partner-payments" component={AdminPartnerPaymentsPage} />
      
      {/* Rotas de Certificados */}
      <ProtectedRoute path="/certificates/:studentId/:courseId" component={CertificateTemplatePage} />
      
      {/* Rota para página não encontrada */}
      <Route path="/:rest*">
        {() => <NotFound />}
      </Route>
    </Switch>
  );
}

function AppWithProviders() {
  return (
    <AuthProvider>
      <PortalProvider>
        <Router />
      </PortalProvider>
    </AuthProvider>
  );
}

// Componente com botões de alternância para visualização dos portais
function PortalViewButtons() {
  const [currentLocation] = useLocation();
  
  return (
    <>
      {/* Adicionar botão de visualização do Portal do Professor nas rotas administrativas*/}
      {currentLocation.startsWith('/admin/') && 
       !currentLocation.startsWith('/admin/partner-view') && 
       !currentLocation.startsWith('/admin/teacher-view') && 
       !currentLocation.startsWith('/admin/hub-view') && (
        <TeacherPortalButton />
      )}
    </>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <AppWithProviders />
      <PortalViewButtons />
    </TooltipProvider>
  );
}

export default App;
