import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Trophy, Medal, Flame, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Contestant } from "@/lib/types";
import { getContestantImages } from "@/lib/api";
import EditContestantDialog from "./EditContestantDialog";

interface ContestantCardProps {
  contestant: Contestant;
  position: "left" | "right";
  matchId: number;
  isWinner: boolean | null;
  onSelectWinner: (contestantId: number) => void;
  disabled: boolean;
}

// Função para converter o nome do país em emoji de bandeira
const getCountryFlag = (country: string): string => {
  // Mapeamento de países para códigos de bandeira
  const countryFlags: Record<string, string> = {
    'Brasil': '🇧🇷',
    'Brazil': '🇧🇷',
    'EUA': '🇺🇸',
    'Estados Unidos': '🇺🇸',
    'USA': '🇺🇸',
    'United States': '🇺🇸',
    'Japão': '🇯🇵',
    'Japan': '🇯🇵',
    'Reino Unido': '🇬🇧',
    'UK': '🇬🇧',
    'United Kingdom': '🇬🇧',
    'França': '🇫🇷',
    'France': '🇫🇷',
    'Alemanha': '🇩🇪',
    'Germany': '🇩🇪',
    'Espanha': '🇪🇸',
    'Spain': '🇪🇸',
    'Itália': '🇮🇹',
    'Italy': '🇮🇹',
    'Canadá': '🇨🇦',
    'Canada': '🇨🇦',
    'Austrália': '🇦🇺',
    'Australia': '🇦🇺',
    'Rússia': '🇷🇺',
    'Russia': '🇷🇺',
    'China': '🇨🇳',
    'Portugal': '🇵🇹',
    'Índia': '🇮🇳',
    'India': '🇮🇳',
    'México': '🇲🇽',
    'Mexico': '🇲🇽',
    'Argentina': '🇦🇷',
    'Holanda': '🇳🇱',
    'Netherlands': '🇳🇱',
    'Suécia': '🇸🇪',
    'Sweden': '🇸🇪',
    'República Tcheca': '🇨🇿',
    'Czech Republic': '🇨🇿',
    'Hungria': '🇭🇺',
    'Hungary': '🇭🇺',
    'Polônia': '🇵🇱',
    'Poland': '🇵🇱',
    'Ucrânia': '🇺🇦',
    'Ukraine': '🇺🇦',
    'Colômbia': '🇨🇴',
    'Colombia': '🇨🇴',
    'Venezuela': '🇻🇪',
    'Peru': '🇵🇪',
    'Chile': '🇨🇱',
    'Romênia': '🇷🇴',
    'Romania': '🇷🇴',
    'Bélgica': '🇧🇪',
    'Belgium': '🇧🇪',
    'Grécia': '🇬🇷',
    'Greece': '🇬🇷',
    'Suíça': '🇨🇭',
    'Switzerland': '🇨🇭',
    'Áustria': '🇦🇹',
    'Austria': '🇦🇹',
    'Irlanda': '🇮🇪',
    'Ireland': '🇮🇪',
    'Dinamarca': '🇩🇰',
    'Denmark': '🇩🇰',
    'Noruega': '🇳🇴',
    'Norway': '🇳🇴',
    'Finlândia': '🇫🇮',
    'Finland': '🇫🇮',
    'Tailândia': '🇹🇭',
    'Thailand': '🇹🇭',
    'Coreia do Sul': '🇰🇷',
    'South Korea': '🇰🇷',
    'Filipinas': '🇵🇭',
    'Philippines': '🇵🇭',
    'Malásia': '🇲🇾',
    'Malaysia': '🇲🇾',
    'Turquia': '🇹🇷',
    'Turkey': '🇹🇷'
  };

  // Retorna o emoji da bandeira se o país estiver no mapeamento, ou a bandeira dos EUA por padrão
  return countryFlags[country] || '🇺🇸';
};

export function ContestantCard({
  contestant,
  position,
  matchId,
  isWinner,
  onSelectWinner,
  disabled
}: ContestantCardProps) {
  const [images, setImages] = useState<string[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    async function fetchImages() {
      setLoadingImages(true);
      try {
        const data = await getContestantImages(contestant.id);
        setImages(data.images);
      } catch (error) {
        console.error("Erro ao buscar imagens para", contestant.name, error);
      } finally {
        setLoadingImages(false);
      }
    }

    fetchImages();
  }, [contestant.id]);

  // Determina badge para medalhas
  const renderMedalBadge = () => {
    if (contestant.goldMedals > 0) {
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
          <Medal className="h-3.5 w-3.5 text-yellow-500 mr-1" />
          {contestant.goldMedals}
        </Badge>
      );
    } else if (contestant.silverMedals > 0) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
          <Medal className="h-3.5 w-3.5 text-gray-400 mr-1" />
          {contestant.silverMedals}
        </Badge>
      );
    } else if (contestant.bronzeMedals > 0) {
      return (
        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
          <Medal className="h-3.5 w-3.5 text-amber-600 mr-1" />
          {contestant.bronzeMedals}
        </Badge>
      );
    }
    return null;
  };

  // Adiciona efeito visual para o card do vencedor
  const cardVariants = {
    winner: {
      boxShadow: "0 0 20px rgba(34, 197, 94, 0.5)",
      borderColor: "#22c55e",
      scale: 1.02,
      transition: { duration: 0.3 }
    },
    normal: {
      boxShadow: "0 0 0px rgba(0, 0, 0, 0.1)",
      borderColor: "#e5e7eb",
      scale: 1,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div 
      className="w-full max-w-md"
      variants={cardVariants}
      animate={isWinner === true ? "winner" : "normal"}
    >
      <Card className={`h-full overflow-hidden flex flex-col border-2 ${
        isWinner === true ? "border-green-500" : "border-gray-200"
      }`}>
        <div className="flex flex-col">
          <div className="px-4 py-3 bg-white border-b">
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-xl font-bold">
                {contestant.name} {contestant.nationality && <span className="ml-2">{getCountryFlag(contestant.nationality)}</span>}
              </h2>
              <div className="flex items-center space-x-2">
                {renderMedalBadge()}
                <EditContestantDialog contestant={contestant} />
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">
                Ranking: <span className="font-semibold text-gray-700">{contestant.currentPoints}</span>
              </span>
              <span className="text-gray-500">
                Tournament Pts: <span className="font-semibold text-gray-700">{contestant.tournamentPoints}</span>
              </span>
            </div>
          </div>
          
          <div className="w-full flex justify-center items-center">
            {loadingImages || isLoading ? (
              <div className="w-[400px] h-[400px] bg-gray-200 animate-pulse"></div>
            ) : images.length > 0 ? (
              <div className="w-[400px] h-[400px] relative overflow-hidden">
                {/* Imagem principal */}
                <img 
                  src={images[currentImageIndex].includes('?') 
                    ? `${images[currentImageIndex]}&square=true` 
                    : `${images[currentImageIndex]}?square=true`}
                  alt={contestant.name}
                  className="w-full h-full object-cover"
                  style={{
                    objectFit: 'cover',
                    objectPosition: 'center'
                  }}
                  onError={(e) => {
                    console.log(`Erro ao carregar imagem: ${images[currentImageIndex]}`);
                    const encodedName = encodeURIComponent(contestant.name.replace(/\s/g, '+'));
                    const fallbackUrl = `https://placehold.co/400x400/e6e6e6/636363?text=${encodedName}`;
                    (e.target as HTMLImageElement).src = fallbackUrl;
                    (e.target as HTMLImageElement).classList.add('fallback-image');
                  }}
                />
                
                {/* Controles de navegação */}
                {images.length > 1 && (
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center p-2 bg-black bg-opacity-50">
                    <button 
                      onClick={() => setCurrentImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))}
                      className="p-1 bg-white bg-opacity-30 rounded-full hover:bg-opacity-50"
                    >
                      <ChevronLeft className="h-5 w-5 text-white" />
                    </button>
                    
                    <div className="flex gap-1">
                      {images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full ${
                            index === currentImageIndex 
                              ? 'bg-white' 
                              : 'bg-gray-400 hover:bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    
                    <button 
                      onClick={() => setCurrentImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))}
                      className="p-1 bg-white bg-opacity-30 rounded-full hover:bg-opacity-50"
                    >
                      <ChevronRight className="h-5 w-5 text-white" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-[400px] h-[400px] bg-gray-100 flex items-center justify-center text-gray-400">
                Sem imagem disponível
              </div>
            )}
          </div>
          
          {/* Botão único que abre o Google para ver mais fotos */}
          <Button 
            variant="default" 
            className="w-full bg-blue-600 hover:bg-blue-700 rounded-none"
            onClick={() => {
              window.open(`https://www.google.com/search?q=${encodeURIComponent(contestant.name + " porn")}&tbm=isch`, '_blank');
            }}
          >
            Ver mais fotos
          </Button>
        </div>
        
        <div className="p-4 mt-auto border-t bg-white">
          <div className="flex justify-between items-center mb-3">
            <Badge variant="outline" className="gap-1">
              <Flame className="h-3.5 w-3.5 text-green-500" />
              {contestant.wins} Wins
            </Badge>
            
            <span className="text-sm text-gray-500">
              {Math.round((contestant.wins / (contestant.wins + contestant.losses || 1)) * 100)}% Win Rate
            </span>
            
            <Badge variant="outline" className="gap-1">
              <Flame className="h-3.5 w-3.5 text-red-500" />
              {contestant.losses} Losses
            </Badge>
          </div>
          
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              onClick={() => onSelectWinner(contestant.id)}
              disabled={disabled}
              className={`w-full py-5 font-bold ${
                isWinner === true 
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-600/20' 
                  : position === "left"
                    ? 'bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20'
                    : 'bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20'
              }`}
            >
              {isWinner === true ? (
                <>
                  <Trophy className="h-4 w-4 mr-2" />
                  Winner Selected!
                </>
              ) : (
                <>
                  <Star className="h-4 w-4 mr-2" />
                  Vote for {contestant.name}
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}