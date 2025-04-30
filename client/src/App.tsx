import { Switch, Route } from "wouter";
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
          window.location.href = '/student/dashboard';
          return null;
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
      
      {/* Rotas do Portal do Aluno */}
      <ProtectedRoute path="/student/dashboard" component={StudentDashboard} />
      <ProtectedRoute path="/student/courses" component={CoursesPage} />
      <ProtectedRoute path="/student/courses/:id" component={CourseDetailsPage} />
      
      {/* Rotas do Portal do Professor */}
      <ProtectedRoute path="/teacher/courses" component={CoursesPage} />
      <ProtectedRoute path="/teacher/courses/:id" component={CourseDetailsPage} />
      <ProtectedRoute path="/teacher/courses/:id/edit" component={CourseEditPage} />
      
      {/* Rotas do Portal do Polo */}
      <ProtectedRoute path="/hub/courses" component={CoursesPage} />
      
      {/* Rotas do Portal do Parceiro */}
      <ProtectedRoute path="/partner/courses" component={CoursesPage} />
      
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

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <AppWithProviders />
    </TooltipProvider>
  );
}

export default App;
