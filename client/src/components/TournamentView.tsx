import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import CurrentMatch from "./CurrentMatch";
import TournamentBracket from "./TournamentBracket";
import ChampionCelebration from "./ChampionCelebration";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { getTournamentProgress, getCurrentTournament, getCurrentMatch, initializeTournament, getContestant } from "@/lib/api";
import { useState, useEffect } from "react";
import { Trophy, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function TournamentView() {
  const [showCelebration, setShowCelebration] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Get current tournament progress
  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ["/api/tournament-progress"],
    queryFn: getTournamentProgress,
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Get current tournament
  const { data: tournamentData } = useQuery({
    queryKey: ["/api/tournament/current"],
    queryFn: getCurrentTournament,
    refetchInterval: 5000,
  });

  // Get current match
  const { data: matchData } = useQuery({
    queryKey: ["/api/current-match"],
    queryFn: getCurrentMatch,
    refetchInterval: 5000,
  });

  // Mutation to start a new tournament
  const startNewTournamentMutation = useMutation({
    mutationFn: initializeTournament,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tournament/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/current-match"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournament-progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournament/bracket"] });
      
      setShowCelebration(false);
      
      toast({
        title: "New Tournament Started",
        description: "A new tournament has been initialized with 64 participants.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start a new tournament. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleNewTournament = () => {
    startNewTournamentMutation.mutate();
  };
  
  // Progress data with defaults
  const progress = progressData?.data || {
    totalMatches: 63,
    completedMatches: 0,
    currentRound: 1,
    currentMatch: 1,
    roundName: "Round of 64",
    percentComplete: 0,
  };

  // Get champion, runner-up and third place data
  const tournament = tournamentData?.data?.tournament;
  const currentMatch = matchData?.data;
  
  // Get contestant data
  const getContestantById = (id: number) => {
    const contestants = [
      ...(currentMatch?.contestant1 ? [currentMatch.contestant1] : []),
      ...(currentMatch?.contestant2 ? [currentMatch.contestant2] : []),
    ];
    
    return contestants.find(c => c.id === id) || {
      id: id,
      name: `Contestant ${id}`,
      points: 0,
      tournamentPoints: 0,
      matches: 0,
      wins: 0,
      losses: 0,
      goldMedals: 0,
      silverMedals: 0,
      bronzeMedals: 0,
      active: false,
      imageUrls: [] as string[],
      rank: 0
    };
  };
  
  // Get champion, runner-up and third place if tournament is completed
  // Fetch full contestant data if the tournament is completed
  const championQuery = useQuery({
    queryKey: ["/api/contestants", tournament?.champion],
    queryFn: () => getContestant(tournament?.champion || 0),
    enabled: !!tournament?.completed && !!tournament?.champion,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
  });
  
  const runnerUpQuery = useQuery({
    queryKey: ["/api/contestants", tournament?.runnerUp],
    queryFn: () => getContestant(tournament?.runnerUp || 0),
    enabled: !!tournament?.completed && !!tournament?.runnerUp,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
  });
  
  const thirdPlaceQuery = useQuery({
    queryKey: ["/api/contestants", tournament?.thirdPlace],
    queryFn: () => getContestant(tournament?.thirdPlace || 0),
    enabled: !!tournament?.completed && !!tournament?.thirdPlace,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
  });
  
  // Use the fetched data or fallback to the basic data
  const champion = championQuery.isSuccess && championQuery.data?.success
    ? championQuery.data.data.contestant
    : (tournament?.champion ? getContestantById(tournament.champion) : null);
    
  const runnerUp = runnerUpQuery.isSuccess && runnerUpQuery.data?.success
    ? runnerUpQuery.data.data.contestant
    : (tournament?.runnerUp ? getContestantById(tournament.runnerUp) : null);
    
  const thirdPlace = thirdPlaceQuery.isSuccess && thirdPlaceQuery.data?.success
    ? thirdPlaceQuery.data.data.contestant
    : (tournament?.thirdPlace ? getContestantById(tournament.thirdPlace) : null);
  
  // Effect para mostrar a celebração quando o torneio estiver completo e os dados dos vencedores estiverem disponíveis
  useEffect(() => {
    if (tournament?.completed && tournament?.champion && champion && runnerUp) {
      // Dê um tempo para os dados serem carregados
      const timer = setTimeout(() => {
        setShowCelebration(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowCelebration(false);
    }
  }, [tournament, champion, runnerUp]);

  return (
    <div id="tournamentView">
      {/* Champion Celebration if tournament is completed */}
      {showCelebration && champion && runnerUp && (
        <ChampionCelebration 
          champion={champion}
          runnerUp={runnerUp}
          thirdPlace={thirdPlace}
          onNewTournament={handleNewTournament}
        />
      )}
      
      {/* O botão "Iniciar Novo Campeonato" só é mostrado na tela principal quando não estamos mostrando a celebração do campeão */}
      {tournament?.completed && !showCelebration && (
        <motion.div 
          className="w-full mb-6 flex justify-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-8 py-6 font-medium text-lg shadow-lg"
            onClick={handleNewTournament}
            disabled={startNewTournamentMutation.isPending}
          >
            {startNewTournamentMutation.isPending ? (
              <>
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                Inicializando...
              </>
            ) : (
              <>
                <Trophy className="mr-2 h-5 w-5" />
                Iniciar Novo Campeonato
              </>
            )}
          </Button>
        </motion.div>
      )}

      {/* Current Match Section */}
      <CurrentMatch />

      {/* Tournament Progress */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-medium mb-4">Tournament Progress</h2>
        {progressLoading ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-6 w-64" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="text-md text-textSecondary">
                {progress.roundName} - Match {progress.currentMatch}
              </div>
              <div className="flex items-center">
                <span className="text-md font-medium mr-2">
                  {progress.completedMatches}
                </span>
                <span className="text-md text-textSecondary mr-2">of</span>
                <span className="text-md font-medium">
                  {progress.totalMatches}
                </span>
                <span className="text-md text-textSecondary ml-2">
                  matches completed
                </span>
              </div>
            </div>
            <Progress value={progress.percentComplete} className="h-2" />
          </>
        )}
      </div>

      {/* Tournament Bracket */}
      <TournamentBracket />
    </div>
  );
}
