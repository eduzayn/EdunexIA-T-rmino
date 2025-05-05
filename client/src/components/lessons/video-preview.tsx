import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2 } from 'lucide-react';

interface VideoPreviewProps {
  url: string;
  provider: string;
  title?: string;
  autoPlay?: boolean;
}

export function VideoPreview({ url, provider, title, autoPlay = false }: VideoPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Função para extrair o ID do vídeo do YouTube da URL
  const getYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Função para extrair o ID do vídeo do Vimeo da URL
  const getVimeoId = (url: string): string | null => {
    const regExp = /vimeo\.com\/(?:video\/|channels\/\w+\/|groups\/[^\/]+\/videos\/|album\/\d+\/video\/|)(\d+)(?:$|\/|\?)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  // Função para gerar o ID apropriado com base no provedor
  const getVideoEmbedUrl = (): string => {
    switch (provider) {
      case 'youtube':
        const youtubeId = getYouTubeId(url);
        return youtubeId 
          ? `https://www.youtube.com/embed/${youtubeId}?autoplay=${autoPlay ? 1 : 0}&rel=0` 
          : '';
      case 'vimeo':
        const vimeoId = getVimeoId(url);
        return vimeoId 
          ? `https://player.vimeo.com/video/${vimeoId}?autoplay=${autoPlay ? 1 : 0}` 
          : '';
      case 'google_drive':
        // Para Google Drive, tentar extrair o ID do arquivo
        const driveId = url.match(/[-\w]{25,}/);
        return driveId 
          ? `https://drive.google.com/file/d/${driveId[0]}/preview` 
          : '';
      default:
        // Se não conseguir determinar o provedor, tentar incorporar diretamente
        return url;
    }
  };

  const embedUrl = getVideoEmbedUrl();
  if (!embedUrl) {
    return (
      <div className="p-4 bg-muted text-muted-foreground rounded-md">
        Não foi possível gerar uma prévia para este vídeo. Verifique se a URL está correta.
      </div>
    );
  }

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="relative">
      <Card className={`overflow-hidden ${isExpanded ? 'fixed inset-0 z-50 m-4' : 'w-full'}`}>
        <div className="relative">
          <Button 
            variant="outline" 
            size="sm" 
            className="absolute top-2 right-2 z-10 bg-background/80 backdrop-blur-sm"
            onClick={toggleExpand}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          
          <div className={`aspect-video w-full overflow-hidden ${isExpanded ? 'h-[calc(100vh-4rem)]' : ''}`}>
            <iframe
              src={embedUrl}
              title={title || "Prévia do vídeo"}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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