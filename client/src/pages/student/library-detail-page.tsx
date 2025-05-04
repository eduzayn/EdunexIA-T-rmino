import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layout/app-shell";
import { useToast } from "@/hooks/use-toast";
import { BookOpenIcon, ArrowLeftIcon, ExternalLinkIcon, FileIcon, VideoIcon, LinkIcon, FileDownIcon, CalendarIcon, InfoIcon } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

export default function StudentLibraryDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();

  // Buscar detalhes do material específico
  const { data: material, isLoading, isError } = useQuery({
    queryKey: [`/api/student/library/${id}`],
  });

  // Função para renderizar o ícone adequado com base no tipo de material
  const renderMaterialIcon = (type) => {
    switch (type) {
      case 'book':
        return <BookOpenIcon className="h-8 w-8 text-indigo-500" />;
      case 'video':
        return <VideoIcon className="h-8 w-8 text-red-500" />;
      case 'document':
        return <FileIcon className="h-8 w-8 text-blue-500" />;
      case 'link':
        return <LinkIcon className="h-8 w-8 text-green-500" />;
      default:
        return <FileIcon className="h-8 w-8 text-gray-500" />;
    }
  };

  // Função para abrir o material
  const openMaterial = () => {
    if (!material) return;

    if (material.materialType === 'link' && material.externalUrl) {
      window.open(material.externalUrl, '_blank');
    } else if (material.fileUrl) {
      window.open(material.fileUrl, '_blank');
    } else {
      toast({
        title: "Material indisponível",
        description: "Não foi possível acessar este material.",
        variant: "destructive"
      });
    }
  };

  return (
    <AppShell>
      <Helmet>
        <title>{material ? `${material.title} | Biblioteca` : 'Carregando material...'} | Edunéxia</title>
      </Helmet>

      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link href="/student/library">
              <ArrowLeftIcon className="h-4 w-4 mr-1" /> Voltar para Biblioteca
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
            <Skeleton className="h-64 w-full rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <InfoIcon className="h-16 w-16 text-destructive mb-4" />
              <h2 className="text-xl font-semibold text-center mb-2">Erro ao carregar material</h2>
              <p className="text-muted-foreground text-center mb-6">
                Não foi possível carregar os detalhes deste material. Por favor, tente novamente mais tarde.
              </p>
              <Button variant="outline" asChild>
                <Link href="/student/library">
                  <ArrowLeftIcon className="h-4 w-4 mr-2" /> Voltar para Biblioteca
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Informações do Material */}
              <div className="flex-1">
                <div className="flex items-start gap-4 mb-6">
                  <Avatar className="h-16 w-16 rounded-md bg-primary/10">
                    {renderMaterialIcon(material.materialType)}
                  </Avatar>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">{material.title}</h1>
                    <div className="flex items-center text-muted-foreground mt-1">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      <span className="text-sm">
                        Adicionado em {new Date(material.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Imagem do Material (se houver) */}
                {material.imageUrl && (
                  <div className="mb-6">
                    <img 
                      src={material.imageUrl} 
                      alt={material.title} 
                      className="w-full h-auto max-h-80 object-cover rounded-md"
                    />
                  </div>
                )}

                {/* Descrição */}
                <Card className="mb-6">
                  <CardHeader className="pb-2">
                    <h2 className="text-xl font-semibold">Descrição</h2>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-line">{material.description}</p>
                  </CardContent>
                </Card>

                {/* Tags */}
                {material.tags && (
                  <div className="mb-6">
                    <h3 className="text-md font-medium mb-2">Tags</h3>
                    <div>
                      {material.tags.split(',').map((tag, i) => (
                        <Badge key={i} variant="outline" className="mr-2 mb-2">
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card para Acessar o Material */}
              <div className="lg:w-1/3">
                <Card>
                  <CardHeader className="pb-2">
                    <h2 className="text-xl font-semibold">Acesso ao Material</h2>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 mb-4">
                      {renderMaterialIcon(material.materialType)}
                      <div>
                        <p className="font-medium">
                          {material.materialType === 'book' && 'Livro'}
                          {material.materialType === 'document' && 'Documento'}
                          {material.materialType === 'video' && 'Vídeo'}
                          {material.materialType === 'link' && 'Link Externo'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {material.fileSize && `Tamanho: ${(material.fileSize / (1024 * 1024)).toFixed(2)} MB`}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {(material.fileUrl || material.externalUrl) ? (
                        <>
                          <Button className="w-full" onClick={openMaterial}>
                            {material.materialType === 'link' ? (
                              <>
                                <ExternalLinkIcon className="h-4 w-4 mr-2" /> Acessar Link
                              </>
                            ) : (
                              <>
                                <FileDownIcon className="h-4 w-4 mr-2" /> Baixar Material
                              </>
                            )}
                          </Button>

                          {material.externalUrl && (
                            <p className="text-xs text-muted-foreground text-center mt-2">
                              Este link abre um recurso externo à plataforma
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-center text-muted-foreground py-2">
                          Este material não possui arquivo para download ou link para acesso.
                        </p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-center pt-0">
                    <Button variant="ghost" asChild>
                      <Link href="/student/library">
                        <ArrowLeftIcon className="h-4 w-4 mr-2" /> Voltar para Biblioteca
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}