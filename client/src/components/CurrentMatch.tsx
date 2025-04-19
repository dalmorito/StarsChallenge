import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getCurrentMatch, selectWinner } from "@/lib/api";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Trophy, Heart, Star, Shield, Sparkles, Flag } from "lucide-react";

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
    'Turkey': '🇹🇷',
    'Vietnã': '🇻🇳',
    'Vietnam': '🇻🇳'
  };
  
  // Retorna o emoji da bandeira se o país estiver no mapeamento, ou a bandeira dos EUA por padrão
  return countryFlags[country] || '🇺🇸';
};

export default function CurrentMatch() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/current-match"],
    queryFn: getCurrentMatch,
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const matchData = data?.data;

  const selectWinnerMutation = useMutation({
    mutationFn: ({ matchId, winnerId }: { matchId: number; winnerId: number }) =>
      selectWinner(matchId, winnerId),
    onSuccess: (data) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/current-match"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournament-progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournament/bracket"] });

      toast({
        title: "Winner Selected",
        description: "The winner has been selected and the tournament has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to select the winner. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSelectWinner = (contestantId: number) => {
    if (matchData) {
      selectWinnerMutation.mutate({
        matchId: matchData.matchId,
        winnerId: contestantId,
      });
    }
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-medium mb-4">Current Match</h2>
        <p className="text-error">
          Error loading current match. Please try refreshing the page.
        </p>
        <Button 
          className="mt-4" 
          variant="outline" 
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/current-match"] })}
        >
          Refresh Data
        </Button>
      </div>
    );
  }

  if (!data?.data || !data?.success) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-medium mb-4">Current Match</h2>
        <p className="text-center py-8">
          No active match. The tournament might be completed or not yet started.
        </p>
        <div className="flex justify-center">
          <Button 
            className="mt-4" 
            variant="outline" 
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["/api/current-match"] });
              queryClient.invalidateQueries({ queryKey: ["/api/tournament/current"] });
              queryClient.invalidateQueries({ queryKey: ["/api/tournament/bracket"] });
              queryClient.invalidateQueries({ queryKey: ["/api/tournament-progress"] });
            }}
          >
            Refresh Tournament Data
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold mb-1 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Current Match
          </h2>
          {matchData && (
            <Badge variant="outline" className="font-medium">
              <Trophy className="w-3.5 h-3.5 mr-1 text-yellow-500" /> {matchData.roundName}
            </Badge>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          <Badge variant="secondary" className="ml-2">
            <Star className="w-3.5 h-3.5 mr-1" /> Round {matchData?.round || '-'}
          </Badge>
          <Badge variant="secondary" className="ml-2">
            <Shield className="w-3.5 h-3.5 mr-1" /> Match {matchData?.matchNumber || '-'}
          </Badge>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <Skeleton className="flex-1 h-[400px]" />
          <div className="flex items-center justify-center">
            <Skeleton className="w-16 h-16 rounded-full" />
          </div>
          <Skeleton className="flex-1 h-[400px]" />
        </div>
      ) : (
        <div className="flex flex-col md:flex-row justify-between gap-6">
          {/* Left Contestant */}
          <motion.div 
            className="flex-1 rounded-lg overflow-hidden shadow-md"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="p-5 bg-gradient-to-r from-primary to-primary/80 text-white">
              <h3 className="text-xl font-bold flex items-center">
                <Heart className="w-5 h-5 mr-2 text-red-200" />
                {matchData?.contestant1.name}
                {matchData?.contestant1.nationality && (
                  <span className="ml-2 text-lg">{getCountryFlag(matchData.contestant1.nationality)}</span>
                )}
              </h3>
              <div className="flex justify-between mt-1">
                <Badge variant="secondary" className="bg-white/20 hover:bg-white/30">
                  <Star className="w-3.5 h-3.5 mr-1 text-yellow-200" />
                  Rank #{matchData?.contestant1.rank || "?"}
                </Badge>
                <Badge variant="secondary" className="bg-white/20 hover:bg-white/30">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-blue-200" />
                  {matchData?.contestant1.points} pts
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 p-4 bg-white">
              {matchData?.contestant1.imageUrls.slice(0, 3).map((url: string, index: number) => (
                <motion.div
                  key={`${matchData.contestant1.id}-${index}`}
                  whileHover={{ scale: 1.05 }}
                  className="overflow-hidden rounded-md shadow-sm"
                  style={{ minHeight: "130px", backgroundColor: "#f0f0f0" }}
                >
                  <img
                    src={`/proxy-image?url=${encodeURIComponent(url)}`}
                    alt={`${matchData?.contestant1.name} image ${index + 1}`}
                    className="w-full h-full aspect-[2/3] object-cover"
                    loading="eager"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      console.log(`Erro ao carregar imagem: ${url}`);
                      // Não usa fallback, apenas esconde a imagem com erro
                      target.style.display = 'none';
                      target.onerror = null; // Impede loop infinito
                    }}
                  />
                </motion.div>
              ))}
            </div>
            <a 
              href={`https://www.bing.com/images/search?q=${encodeURIComponent(matchData?.contestant1.name + " porn")}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full text-center px-3 py-2 mx-4 mb-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Ver mais fotos
            </a>
            <div className="p-4 border-t bg-white">
              <Button
                className="w-full py-3 font-semibold"
                variant="default"
                onClick={() => handleSelectWinner(matchData?.contestant1.id || 0)}
                disabled={selectWinnerMutation.isPending}
              >
                {selectWinnerMutation.isPending ? "Selecting..." : "Select Winner"}
              </Button>
            </div>
          </motion.div>

          {/* VS Indicator */}
          <motion.div 
            className="flex items-center justify-center"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="bg-gradient-to-br from-red-500 to-orange-500 rounded-full w-20 h-20 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
              VS
            </div>
          </motion.div>

          {/* Right Contestant */}
          <motion.div 
            className="flex-1 rounded-lg overflow-hidden shadow-md"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="p-5 bg-gradient-to-r from-primary/80 to-primary text-white">
              <h3 className="text-xl font-bold flex items-center">
                <Heart className="w-5 h-5 mr-2 text-red-200" />
                {matchData?.contestant2.name}
                {matchData?.contestant2.nationality && (
                  <span className="ml-2 text-lg">{getCountryFlag(matchData.contestant2.nationality)}</span>
                )}
              </h3>
              <div className="flex justify-between mt-1">
                <Badge variant="secondary" className="bg-white/20 hover:bg-white/30">
                  <Star className="w-3.5 h-3.5 mr-1 text-yellow-200" />
                  Rank #{matchData?.contestant2.rank || "?"}
                </Badge>
                <Badge variant="secondary" className="bg-white/20 hover:bg-white/30">
                  <Sparkles className="w-3.5 h-3.5 mr-1 text-blue-200" />
                  {matchData?.contestant2.points} pts
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 p-4 bg-white">
              {matchData?.contestant2.imageUrls.slice(0, 3).map((url: string, index: number) => (
                <motion.div
                  key={`${matchData.contestant2.id}-${index}`}
                  whileHover={{ scale: 1.05 }}
                  className="overflow-hidden rounded-md shadow-sm"
                  style={{ minHeight: "130px", backgroundColor: "#f0f0f0" }}
                >
                  <img
                    src={`/proxy-image?url=${encodeURIComponent(url)}`}
                    alt={`${matchData?.contestant2.name} image ${index + 1}`}
                    className="w-full h-full aspect-[2/3] object-cover"
                    loading="eager"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      console.log(`Erro ao carregar imagem: ${url}`);
                      // Não usa fallback, apenas esconde a imagem com erro
                      target.style.display = 'none';
                      target.onerror = null; // Impede loop infinito
                    }}
                  />
                </motion.div>
              ))}
            </div>
            <a 
              href={`https://www.bing.com/images/search?q=${encodeURIComponent(matchData?.contestant2.name + " porn")}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full text-center px-3 py-2 mx-4 mb-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Ver mais fotos
            </a>
            <div className="p-4 border-t bg-white">
              <Button
                className="w-full py-3 font-semibold"
                variant="default"
                onClick={() => handleSelectWinner(matchData?.contestant2.id || 0)}
                disabled={selectWinnerMutation.isPending}
              >
                {selectWinnerMutation.isPending ? "Selecting..." : "Select Winner"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}