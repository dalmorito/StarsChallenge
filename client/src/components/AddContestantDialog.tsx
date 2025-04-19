import { useState } from "react";
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

export default function AddContestantDialog() {
  const [open, setOpen] = useState(false);
  const [contestantName, setContestantName] = useState("");
  const [contestantNationality, setContestantNationality] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addContestantMutation = useMutation({
    mutationFn: (data: { name: string, nationality: string }) => {
      return apiRequest("POST", "/api/contestants", data);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Nova atriz adicionada com sucesso.",
        variant: "default",
      });
      setContestantName("");
      setContestantNationality("");
      setOpen(false);
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/contestants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contestants/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contestants/ranking"] });
    },
    onError: (error: any) => {
      const errorMessage = error.data?.message || "Ocorreu um erro ao adicionar a atriz";
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
    
    if (!contestantName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe o nome da atriz",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    addContestantMutation.mutate({
      name: contestantName,
      nationality: contestantNationality
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full md:w-auto">
          Adicionar Nova Atriz
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Atriz</DialogTitle>
          <DialogDescription>
            Informe o nome da atriz para adicionar ao sistema.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input
                id="name"
                value={contestantName}
                onChange={(e) => setContestantName(e.target.value)}
                className="col-span-3"
                placeholder="Nome da atriz"
                autoComplete="off"
              />
            </div>
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
              disabled={isSubmitting || !contestantName.trim()}
              className="w-full"
            >
              {isSubmitting ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}