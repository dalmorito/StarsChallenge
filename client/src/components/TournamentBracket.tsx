import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getTournamentBracket } from "@/lib/api";
import type { BracketMatch } from "@shared/schema";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Trophy, Heart, Star, ChevronRight, Award, ZoomIn, ZoomOut, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Função para exibir a bandeira do país baseado no código do país
function getCountryFlag(nationality: string): string {
  const countryFlags: Record<string, string> = {
    'Brasil': '🇧🇷',
    'EUA': '🇺🇸',
    'Japão': '🇯🇵',
    'Espanha': '🇪🇸',
    'França': '🇫🇷',
    'Tailândia': '🇹🇭',
    'Canadá': '🇨🇦',
    'Índia': '🇮🇳',
    'China': '🇨🇳',
    'Reino Unido': '🇬🇧',
    'Alemanha': '🇩🇪',
    'Rússia': '🇷🇺',
    'Coreia do Sul': '🇰🇷',
    'Vietnã': '🇻🇳',
    'Venezuela': '🇻🇪',
    'México': '🇲🇽',
    'Portugal': '🇵🇹',
    'Argentina': '🇦🇷',
    'Filipinas': '🇵🇭',
    'Itália': '🇮🇹',
    'Austrália': '🇦🇺',
    'Colômbia': '🇨🇴',
    'Ucrânia': '🇺🇦',
    'Peru': '🇵🇪',
    'Turquia': '🇹🇷',
    'Nova Zelândia': '🇳🇿',
    'Chile': '🇨🇱',
    'Uruguai': '🇺🇾',
    'Paraguai': '🇵🇾'
  };
  
  return countryFlags[nationality] || '🇺🇸';
}

// Layout constants for bracket visualization
const MATCH_WIDTH = 220; // Mantendo a largura ajustada
const MATCH_HEIGHT = 54; // Aumentando a altura para melhor visibilidade
const HORIZONTAL_GAP = 120; // Aumentando o espaçamento horizontal
const VERTICAL_GAP = 30; // Aumentando o espaçamento vertical

interface BracketMatchProps {
  match: BracketMatch;
  x: number;
  y: number;
  isCurrentMatch: boolean;
}

function BracketMatchItem({ match, x, y, isCurrentMatch }: BracketMatchProps) {
  return (
    <motion.div
      className={`absolute rounded-md bg-white shadow-sm overflow-hidden ${
        isCurrentMatch 
          ? "border-2 border-primary" 
          : match.completed 
            ? "border border-gray-200" 
            : "border border-dashed border-gray-300"
      }`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${MATCH_WIDTH}px`,
        height: `${MATCH_HEIGHT + 8}px`,
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
    >
      {isCurrentMatch ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="h-full bg-gradient-to-r from-primary to-primary/80 text-white px-3 flex items-center">
                <Star className="h-4 w-4 mr-2 text-yellow-200" />
                <div className="flex-1 truncate font-medium">Current Match</div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>This is the current active match in progress</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : match.contestant1 && match.contestant2 ? (
        <div className="h-full flex flex-col">
          {/* Contestant 1 */}
          <div 
            className={`flex items-center px-3 py-1 ${
              match.completed && match.winner?.id === match.contestant1.id
                ? "bg-green-50"
                : match.completed
                ? ""
                : ""
            }`}
          >
            <div
              className={`flex-1 truncate text-base font-medium ${
                match.completed && match.winner?.id === match.contestant1.id
                  ? "font-bold text-green-700"
                  : match.completed
                  ? "text-gray-500"
                  : "text-gray-700"
              }`}
            >
              {match.contestant1.name}{" "}
              {match.contestant1.nationality && (
                <span className="ml-1">{getCountryFlag(match.contestant1.nationality)}</span>
              )}
            </div>
            
            {match.completed && (
              <Badge 
                variant={match.winner?.id === match.contestant1.id ? "default" : "outline"}
                className={`text-xs h-5 ${match.winner?.id === match.contestant1.id ? "bg-green-600" : "text-gray-400"}`}
              >
                {match.winner?.id === match.contestant1.id ? (
                  <Trophy className="h-3 w-3 mr-1 text-yellow-200" />
                ) : null}
                {match.winner?.id === match.contestant1.id ? "Win" : "Loss"}
              </Badge>
            )}
          </div>
          
          {/* Divider */}
          <div className="h-px bg-gray-200"></div>
          
          {/* Contestant 2 */}
          <div 
            className={`flex items-center px-3 py-1 ${
              match.completed && match.winner?.id === match.contestant2.id
                ? "bg-green-50"
                : match.completed
                ? ""
                : ""
            }`}
          >
            <div
              className={`flex-1 truncate text-base font-medium ${
                match.completed && match.winner?.id === match.contestant2.id
                  ? "font-bold text-green-700"
                  : match.completed
                  ? "text-gray-500"
                  : "text-gray-700"
              }`}
            >
              {match.contestant2.name}{" "}
              {match.contestant2.nationality && (
                <span className="ml-1">{getCountryFlag(match.contestant2.nationality)}</span>
              )}
            </div>
            
            {match.completed && (
              <Badge 
                variant={match.winner?.id === match.contestant2.id ? "default" : "outline"}
                className={`text-xs h-5 ${match.winner?.id === match.contestant2.id ? "bg-green-600" : "text-gray-400"}`}
              >
                {match.winner?.id === match.contestant2.id ? (
                  <Trophy className="h-3 w-3 mr-1 text-yellow-200" />
                ) : null}
                {match.winner?.id === match.contestant2.id ? "Win" : "Loss"}
              </Badge>
            )}
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center px-3">
          {match.round === 6 && match.matchNumber === 2 ? (
            <div className="flex items-center">
              <Award className="h-4 w-4 mr-2 text-amber-500" />
              <span className="text-amber-700 font-medium">Bronze Match</span>
            </div>
          ) : match.round === 6 && match.matchNumber === 1 ? (
            <div className="flex items-center">
              <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
              <span className="text-primary font-bold">Final</span>
            </div>
          ) : (
            <span className="text-gray-500 text-sm">
              <ChevronRight className="h-4 w-4 mr-1 inline-block" />
              Round {match.round}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function TournamentBracket() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/tournament/bracket"],
    queryFn: getTournamentBracket
  });

  const { data: currentMatchData } = useQuery({
    queryKey: ["/api/current-match"],
    queryFn: () => import("@/lib/api").then((api) => api.getCurrentMatch()),
  });

  const bracketRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [manualZoom, setManualZoom] = useState(100);

  useEffect(() => {
    const updateScale = () => {
      if (bracketRef.current) {
        const containerWidth = bracketRef.current.clientWidth;
        // Reduzindo o tamanho desejado para melhor ajuste
        const desiredWidth = 1200;
        // Aumentando a escala mínima para 0.7 para melhor visibilidade
        const newScale = Math.min(1, containerWidth / desiredWidth);
        setScale(Math.max(0.7, newScale) * (manualZoom / 100));
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [manualZoom]);
  
  const handleZoomIn = () => {
    setManualZoom(prev => Math.min(prev + 10, 150));
  };
  
  const handleZoomOut = () => {
    setManualZoom(prev => Math.max(prev - 10, 50));
  };
  
  const handleResetZoom = () => {
    setManualZoom(100);
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-medium mb-4">Tournament Bracket</h2>
        <p className="text-error">
          Error loading tournament bracket. Please try refreshing the page.
        </p>
      </div>
    );
  }

  const bracket = data?.data;
  const currentMatchId = currentMatchData?.data?.matchId;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 overflow-x-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Pornstars Tournament Bracket
          </h2>
          <p className="text-sm text-muted-foreground flex items-center">
            <ChevronRight className="w-3.5 h-3.5 mr-1" />
            View the full tournament structure and match progression
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-input">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-r-none border-r" 
              onClick={handleZoomOut}
              disabled={manualZoom <= 50}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <div className="px-2 text-xs font-medium">{manualZoom}%</div>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 rounded-l-none border-l" 
              onClick={handleZoomIn}
              disabled={manualZoom >= 150}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8"
            onClick={handleResetZoom}
            disabled={manualZoom === 100}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          {!isLoading && bracket && (
            <Badge variant="outline" className="font-medium ml-2">
              <Trophy className="w-3.5 h-3.5 mr-1 text-yellow-500" /> 
              {bracket.rounds.length} Rounds | {bracket.rounds.reduce((acc: number, round: any) => acc + round.matches.length, 0)} Matches
            </Badge>
          )}
        </div>
      </div>
      
      {isLoading ? (
        <Skeleton className="min-w-[800px] h-[700px]" />
      ) : (
        <div 
          className="min-w-[800px] h-[700px] relative p-4 overflow-auto border border-gray-200 rounded-md bg-[#fcfcfc]"
          ref={bracketRef}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            backgroundImage: 'radial-gradient(circle, #f0f0f0 1px, transparent 1px), radial-gradient(circle, #f0f0f0 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 10px 10px'
          }}
        >
          {bracket?.rounds.map((round: any, roundIndex: number) => {
            const roundX = roundIndex * (MATCH_WIDTH + HORIZONTAL_GAP);
            
            // Get the matches for this round
            return round.matches.map((match: any, matchIndex: number) => {
              // Calculate vertical position based on round and match number
              let matchesInRound = Math.pow(2, 6 - match.round);
              let baseSpacing = 800 / (matchesInRound + 1);
              let y = matchIndex * baseSpacing * 1.2;
              
              // Special handling for final rounds
              if (match.round === 6) {
                // Final match centered
                if (match.matchNumber === 1) { 
                  y = 270; // Posição centralizada para a final
                } else {
                  // Bronze match below
                  y = 420; // Posição mais abaixo para o bronze match
                }
              }
              
              // Ajuste para as semifinais
              if (match.round === 5) {
                // Ajusta o espaçamento manual para melhor visualização
                if (match.matchNumber === 1) {
                  y = 180;
                } else {
                  y = 360;
                }
              }

              // Determine if this is the current match
              const isCurrentMatch = match.id === currentMatchId;
              
              return (
                <BracketMatchItem
                  key={`${match.round}-${match.matchNumber}`}
                  match={match}
                  x={roundX}
                  y={y}
                  isCurrentMatch={isCurrentMatch}
                />
              );
            });
          })}
          
          {/* Draw connector lines here - simplified for now */}
          {/* This would be more complex with SVG path lines */}
        </div>
      )}
    </div>
  );
}
