import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { initializeTournament } from "@/lib/api";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Beaker, RefreshCw, Trophy } from "lucide-react";
import { forceStartNewTournament } from "@/lib/api";

export default function TournamentControls() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const startNewTournamentMutation = useMutation({
    mutationFn: initializeTournament,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tournament/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/current-match"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournament-progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournament/bracket"] });
      
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
  
  // Adicionar mutação para forçar o início de um novo torneio (para testes)
  const forceNewTournamentMutation = useMutation({
    mutationFn: forceStartNewTournament,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tournament/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/current-match"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournament-progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournament/bracket"] });
      
      toast({
        title: "Teste: Novo Torneio Forçado",
        description: "Um novo torneio foi forçado para testes, verificando se as vencedoras da primeira rodada foram mantidas.",
        variant: "destructive",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao forçar novo torneio para teste.",
        variant: "destructive",
      });
    },
  });

  const handleNewTournament = () => {
    startNewTournamentMutation.mutate();
  };
  
  const handleForceNewTournament = () => {
    forceNewTournamentMutation.mutate();
  };

  return (
    <motion.div 
      className="flex space-x-4 items-center justify-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
            <Trophy className="mr-2 h-4 w-4" />
            Start New Tournament
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start New Tournament?</AlertDialogTitle>
            <AlertDialogDescription>
              This will initialize a new tournament with 64 contestants. Any ongoing tournament will be marked as completed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleNewTournament}>Start</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Botão para forçar teste do próximo torneio */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-50">
            <Beaker className="mr-2 h-4 w-4" />
            Teste - Próximo Torneio
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Teste: Forçar Próximo Torneio?</AlertDialogTitle>
            <AlertDialogDescription>
              Este botão é apenas para teste. Ele completará automaticamente as partidas da primeira rodada e iniciará um novo torneio para verificar se as vencedoras são mantidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleForceNewTournament} className="bg-red-500 hover:bg-red-600">Testar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
