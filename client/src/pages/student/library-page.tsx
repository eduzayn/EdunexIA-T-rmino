import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRightIcon, BookOpenIcon, FileIcon, LinkIcon, VideoIcon, SearchIcon } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

export default function StudentLibraryPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Buscar materiais da biblioteca
  const { data: materials, isLoading, isError } = useQuery({
    queryKey: ['/api/student/library'],
  });

  // Filtrar materiais com base no termo de pesquisa e no tipo de material
  const filteredMaterials = materials?.filter((material) => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         material.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = activeTab === "all" || material.materialType === activeTab;
    return matchesSearch && matchesType;
  });

  // Função para renderizar o ícone adequado com base no tipo de material
  const renderMaterialIcon = (type) => {
    switch (type) {
      case 'book':
        return <BookOpenIcon className="h-5 w-5 text-indigo-500" />;
      case 'video':
        return <VideoIcon className="h-5 w-5 text-red-500" />;
      case 'document':
        return <FileIcon className="h-5 w-5 text-blue-500" />;
      case 'link':
        return <LinkIcon className="h-5 w-5 text-green-500" />;
      default:
        return <FileIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <AppShell>
      <Helmet>
        <title>Biblioteca | Edunéxia</title>
      </Helmet>

      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Biblioteca</h1>
          <div className="relative w-96">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Pesquisar materiais..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="book">Livros</TabsTrigger>
            <TabsTrigger value="document">Documentos</TabsTrigger>
            <TabsTrigger value="video">Vídeos</TabsTrigger>
            <TabsTrigger value="link">Links</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array(6).fill(0).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader className="p-0">
                      <Skeleton className="h-48 w-full rounded-none" />
                    </CardHeader>
                    <CardContent className="p-6 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                    </CardContent>
                    <CardFooter className="flex justify-between items-center p-6 pt-0">
                      <Skeleton className="h-8 w-24" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : isError ? (
              <div className="bg-destructive/10 p-4 rounded-md text-center">
                <p className="text-destructive font-semibold">Erro ao carregar materiais da biblioteca.</p>
                <p className="text-sm text-destructive/80">Por favor, tente novamente mais tarde.</p>
              </div>
            ) : filteredMaterials?.length === 0 ? (
              <div className="bg-muted p-8 rounded-md text-center">
                <BookOpenIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum material encontrado</h3>
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? "Sua pesquisa não retornou resultados. Tente outros termos." 
                    : "Não há materiais disponíveis nesta categoria no momento."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMaterials?.map((material) => (
                  <Link key={material.id} href={`/student/library/${material.id}`}>
                    <Card className="overflow-hidden cursor-pointer transition-all hover:shadow-md">
                      {material.imageUrl ? (
                        <CardHeader className="p-0">
                          <img 
                            src={material.imageUrl} 
                            alt={material.title} 
                            className="h-48 w-full object-cover"
                          />
                        </CardHeader>
                      ) : (
                        <CardHeader className="h-48 bg-gradient-to-r from-primary/10 to-primary/5 flex items-center justify-center">
                          <Avatar className="h-24 w-24 bg-background border rounded-md">
                            {renderMaterialIcon(material.materialType)}
                          </Avatar>
                        </CardHeader>
                      )}
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <CardTitle className="text-xl">{material.title}</CardTitle>
                          {renderMaterialIcon(material.materialType)}
                        </div>
                        <p className="text-muted-foreground line-clamp-2">{material.description}</p>
                        <div className="mt-4">
                          {material.tags?.split(',').map((tag, i) => (
                            <Badge key={i} variant="outline" className="mr-2 mb-2">
                              {tag.trim()}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between items-center p-6 pt-0">
                        <div className="text-sm text-muted-foreground">
                          {new Date(material.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                        <Button variant="ghost" size="sm" className="flex items-center gap-1">
                          Ver Material <ChevronRightIcon className="h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}