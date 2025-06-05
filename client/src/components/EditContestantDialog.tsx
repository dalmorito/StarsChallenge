import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Contestant } from "@/lib/types";
import { Edit } from "lucide-react";

interface EditContestantDialogProps {
  contestant: Contestant;
}

export default function EditContestantDialog({ contestant }: EditContestantDialogProps) {
  const [open, setOpen] = useState(false);
  const [contestantNationality, setContestantNationality] = useState(contestant.nationality || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Atualiza o estado se o concorrente mudar
    setContestantNationality(contestant.nationality || "");
  }, [contestant]);

  const updateContestantMutation = useMutation({
    mutationFn: (data: { id: number, nationality: string }) => {
      return apiRequest("PATCH", `/api/contestants/${data.id}`, { nationality: data.nationality });
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Nacionalidade atualizada com sucesso.",
        variant: "default",
      });
      setOpen(false);
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/contestants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contestants/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contestants/ranking"] });
      queryClient.invalidateQueries({ queryKey: ["/api/current-match"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournament/bracket"] });
    },
    onError: (error: any) => {
      const errorMessage = error.data?.message || "Ocorreu um erro ao atualizar a atriz";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    updateContestantMutation.mutate({
      id: contestant.id,
      nationality: contestantNationality
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar {contestant.name}</DialogTitle>
          <DialogDescription>
            Atualize os dados da atriz.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nationality" className="text-right">
                País
              </Label>
              <Input
                id="nationality"
                value={contestantNationality}
                onChange={(e) => setContestantNationality(e.target.value)}
                className="col-span-3"
                placeholder="Ex: Brasil, EUA, Japão"
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}