import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, ExternalLink, FileText } from 'lucide-react';

interface DocumentPreviewProps {
  url: string;
  title?: string;
  fileType?: string;
}

export function DocumentPreview({ url, title, fileType }: DocumentPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Função para limpar a URL e obter apenas a parte básica
  const cleanUrl = (url: string): string => {
    // Remove parâmetros de consulta
    return url.split('?')[0];
  };

  // Função para verificar se o URL é do Google Drive
  const isGoogleDriveUrl = (url: string): boolean => {
    return url.includes('drive.google.com') || url.includes('docs.google.com');
  };

  // Função para extrair o ID do documento do Google Drive
  const getGoogleDriveId = (url: string): string | null => {
    // Para URLs de visualização direta
    const regExpDirect = /\/d\/([a-zA-Z0-9_-]+)/;
    let match = url.match(regExpDirect);
    
    if (match) {
      return match[1];
    }
    
    // Para URLs de compartilhamento
    const regExpShare = /id=([a-zA-Z0-9_-]+)/;
    match = url.match(regExpShare);
    
    return match ? match[1] : null;
  };

  // Função para gerar a URL de incorporação apropriada
  const getDocumentEmbedUrl = (): string => {
    if (isGoogleDriveUrl(url)) {
      const driveId = getGoogleDriveId(url);
      if (driveId) {
        if (url.includes('spreadsheets')) {
          return `https://docs.google.com/spreadsheets/d/${driveId}/preview`;
        } else if (url.includes('document')) {
          return `https://docs.google.com/document/d/${driveId}/preview`;
        } else if (url.includes('presentation')) {
          return `https://docs.google.com/presentation/d/${driveId}/preview`;
        } else {
          return `https://drive.google.com/file/d/${driveId}/preview`;
        }
      }
    }
    
    // Para PDF diretos ou outros arquivos, tentamos usar a URL diretamente
    if (url.toLowerCase().endsWith('.pdf')) {
      return cleanUrl(url);
    }
    
    // URL original se não conseguirmos processar
    return url;
  };

  const embedUrl = getDocumentEmbedUrl();
  
  if (!embedUrl) {
    return (
      <div className="p-4 bg-muted text-muted-foreground rounded-md">
        Não foi possível gerar uma prévia para este documento. Verifique se a URL está correta.
      </div>
    );
  }

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Ação para abrir o documento em uma nova aba
  const openInNewTab = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Fallback para quando o documento não pode ser incorporado
  const DocumentFallback = () => (
    <div className="flex flex-col items-center justify-center h-full bg-gray-100 p-6 text-center">
      <div className="mb-4">
        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-medium mb-2">{title || "Documento"}</h3>
        <p className="text-sm text-gray-500 mb-6">
          Este documento não pode ser visualizado diretamente na plataforma.
        </p>
      </div>
      <Button onClick={openInNewTab} className="bg-blue-600 hover:bg-blue-700">
        <ExternalLink className="h-4 w-4 mr-2" />
        Abrir documento
      </Button>
    </div>
  );

  return (
    <div className="relative">
      <Card className={`overflow-hidden ${isExpanded ? 'fixed inset-0 z-50 m-4' : 'w-full'}`}>
        <div className="relative">
          <div className="absolute top-2 right-2 z-10 flex gap-2">
            {/* Botão para abrir em nova aba */}
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-background/80 backdrop-blur-sm"
              onClick={openInNewTab}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            
            {/* Botão para expandir/contrair */}
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-background/80 backdrop-blur-sm"
              onClick={toggleExpand}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className={`aspect-video w-full overflow-hidden ${isExpanded ? 'h-[calc(100vh-4rem)]' : ''}`}>
            {isGoogleDriveUrl(url) || url.toLowerCase().endsWith('.pdf') ? (
              <iframe
                src={embedUrl}
                title={title || "Prévia do documento"}
                className="w-full h-full"
                allowFullScreen
                frameBorder="0"
                loading="lazy"
              />
            ) : (
              <DocumentFallback />
            )}
          </div>
        </div>
      </Card>
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={toggleExpand}
        />
      )}
    </div>
  );
}