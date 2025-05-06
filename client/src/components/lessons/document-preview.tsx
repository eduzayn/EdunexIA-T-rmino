import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, ExternalLink } from 'lucide-react';

interface DocumentPreviewProps {
  url: string;
  title?: string;
  fileType?: string;
}

export function DocumentPreview({ url, title, fileType }: DocumentPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Função para extrair o ID do arquivo do Google Drive da URL
  const getDriveFileId = (url: string): string | null => {
    const driveRegExp = /(?:https?:\/\/)?(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|docs\.google\.com\/(?:document|presentation|spreadsheets)\/d\/)([a-zA-Z0-9_-]+)/;
    const match = url.match(driveRegExp);
    return match ? match[1] : null;
  };

  // Função para gerar a URL de preview com base no tipo e fonte do documento
  const getDocumentEmbedUrl = (): string => {
    // Verificar se é um link do Google Drive
    if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
      const fileId = getDriveFileId(url);
      if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }

    // Se for um PDF direto
    if (url.toLowerCase().endsWith('.pdf')) {
      return url;
    }

    // Para outros tipos, retorna o URL original
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

  // Abre o documento em uma nova aba
  const openInNewTab = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="relative">
      <Card className={`overflow-hidden ${isExpanded ? 'fixed inset-0 z-50 m-4' : 'w-full'}`}>
        <div className="relative">
          <div className="absolute top-2 right-2 z-10 flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-background/80 backdrop-blur-sm"
              onClick={openInNewTab}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-background/80 backdrop-blur-sm"
              onClick={toggleExpand}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className={`aspect-[4/3] w-full overflow-hidden ${isExpanded ? 'h-[calc(100vh-4rem)]' : ''}`}>
            <iframe
              src={embedUrl}
              title={title || "Prévia do documento"}
              className="w-full h-full"
              frameBorder="0"
              loading="lazy"
              referrerPolicy="no-referrer"
              allowFullScreen
            />
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