import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CourseForm } from "@/components/courses/course-form";

export default function CourseCreatePage() {
  return (
    <AppShell>
      <Helmet>
        <title>Criar Novo Curso | Edunéxia</title>
      </Helmet>
      
      <div className="container py-4 space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/courses">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Criar Novo Curso</h1>
        </div>
        
        {/* Formulário */}
        <CourseForm />
      </div>
    </AppShell>
  );
}