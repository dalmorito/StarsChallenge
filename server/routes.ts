import { Router } from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { ZodError } from "zod";
import { CONTESTANTS_LIST } from "@shared/schema";
import { fetchContestantImages } from "./image-service";

// Usar configuração específica para Vercel que força o uso do PostgreSQL
import vercelStorage from "./vercel-storage";
const storage = vercelStorage;
const persistentStorage = vercelStorage;

// Input validation schema for selecting a winner
const selectWinnerSchema = z.object({
  matchId: z.number(),
  winnerId: z.number()
});

// Initialize tournament if needed
async function ensureTournamentExists() {
  const currentTournament = await persistentStorage.getCurrentTournament();
  if (!currentTournament) {
    // If no tournament exists, create one
    await persistentStorage.initializeNewTournament();
  }
}

// Main API router
function createApiRouter() {
  const router = Router();

  // Register sub-routers
  router.use("/matches", matchesRouter);
  router.use("/tournament", tournamentRouter);
  router.use("/contestants", contestantsRouter);
  router.use("/stats", statsRouter);

  // Initialize or restart tournament
  router.post("/initialize", async (req, res) => {
    try {
      const newTournament = await persistentStorage.initializeNewTournament();
      res.json({
        success: true,
        message: "Tournament initialized successfully",
        tournament: newTournament
      });
    } catch (error) {
      console.error("Error initializing tournament:", error);
      res.status(500).json({
        success: false,
        message: "Failed to initialize tournament"
      });
    }
  });
  
  // Forçar a inicialização de um novo torneio para teste
  router.post("/force-new-tournament", async (req, res) => {
    try {
      console.log("===== FORÇANDO INÍCIO DE NOVO TORNEIO PARA TESTE =====");
      
      // Obter torneio atual
      const currentTournament = await storage.getCurrentTournament();
      
      if (currentTournament) {
        // Verificar se temos pelo menos algumas partidas da rodada 1 completas
        // para simular os vencedores da primeira rodada
        const firstRoundMatches = await storage.getMatchesByRound(currentTournament.id, 1);
        
        // Verificar se temos partidas incompletas
        const incompleteMatches = firstRoundMatches.filter(m => !m.completed);
        
        if (incompleteMatches.length > 0) {
          // Selecionar vencedores aleatoriamente para simular um torneio completo
          console.log(`Completando ${incompleteMatches.length} partidas incompletas da primeira rodada`);
          
          for (const match of incompleteMatches) {
            // Escolher aleatoriamente entre contestant1 e contestant2
            const winnerId = Math.random() < 0.5 ? match.contestant1Id : match.contestant2Id;
            
            // Marcar o vencedor
            await storage.updateMatch(match.id, {
              winnerId,
              completed: true
            });
            
            console.log(`Selecionado vencedor para partida ${match.id}: ${winnerId}`);
          }
        }
      }
      
      // Iniciar um novo torneio
      const newTournament = await storage.initializeNewTournament();
      
      res.json({
        success: true,
        message: "Novo torneio forçado com sucesso para testes!",
        tournament: newTournament
      });
    } catch (error) {
      console.error("Erro ao forçar novo torneio:", error);
      res.status(500).json({
        success: false,
        message: "Falha ao forçar novo torneio"
      });
    }
  });

  // Get current match
  router.get("/current-match", async (req, res) => {
    try {
      await ensureTournamentExists();
      
      const currentMatchData = await storage.getCurrentMatchData();
      if (!currentMatchData) {
        return res.status(404).json({
          success: false,
          message: "No current match found"
        });
      }
      
      // Ensure we have images for both contestants
      if (currentMatchData.contestant1.imageUrls.length === 0) {
        const images = await fetchContestantImages(
          currentMatchData.contestant1.id,
          currentMatchData.contestant1.name
        );
        // Agora usamos todas as imagens disponíveis
        currentMatchData.contestant1.imageUrls = images;
      }
      
      if (currentMatchData.contestant2.imageUrls.length === 0) {
        const images = await fetchContestantImages(
          currentMatchData.contestant2.id,
          currentMatchData.contestant2.name
        );
        // Agora usamos todas as imagens disponíveis
        currentMatchData.contestant2.imageUrls = images;
      }
      
      res.json({
        success: true,
        data: currentMatchData
      });
    } catch (error) {
      console.error("Error fetching current match:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch current match"
      });
    }
  });

  // Select winner for a match
  router.post("/select-winner", async (req, res) => {
    try {
      const { matchId, winnerId } = selectWinnerSchema.parse(req.body);
      
      // Verificar se a partida existe e ainda não está completada
      const match = await storage.getMatchById(matchId);
      if (!match) {
        return res.status(404).json({
          success: false,
          message: "Match not found"
        });
      }
      
      // Se a partida já estiver completada, não permitir nova seleção
      if (match.completed) {
        return res.status(400).json({
          success: false,
          message: "This match is already completed. Cannot select winner again."
        });
      }
      
      // Verificar se temos informações do torneio atual antes da atualização
      const tournamentBeforeUpdate = await storage.getCurrentTournament();
      if (!tournamentBeforeUpdate) {
        return res.status(400).json({
          success: false,
          message: "No active tournament found"
        });
      }
      const tournamentIdBeforeUpdate = tournamentBeforeUpdate.id;
      
      console.log(`Selecionando vencedora para partida ${matchId}: Concorrente ${winnerId} (Torneio: ${tournamentIdBeforeUpdate}, Rodada: ${match.round}, Partida: ${match.matchNumber})`);
      
      // Marcar vencedor da partida atual
      await storage.selectTournamentWinner(matchId, winnerId);
      
      // Atualizar a partida com o vencedor
      await storage.updateMatch(matchId, {
        winnerId: winnerId,
        completed: true
      });
      
      // Avançar para a próxima partida
      await storage.advanceToNextMatch();
      
      // Verificar se precisamos iniciar um novo torneio ou avançar para a próxima fase
      // Se for a final (round 6, match 2), verificamos se está completa e iniciamos um novo torneio
      let shouldStartNewTournament = false;
      
      if (match.round === 6 && match.matchNumber === 2) {
        console.log("Partida final concluída! O campeão foi determinado, verificando se devemos iniciar um novo torneio...");
        shouldStartNewTournament = true;
      } else if (match.round === 6 && match.matchNumber === 1) {
        console.log("Partida de 3º lugar concluída! Avançando para a final...");
        
        // Forçar a atualização do torneio para garantir que esteja mostrando a final
        const tournament = await storage.getCurrentTournament();
        if (tournament) {
          console.log("Atualizando torneio para mostrar a final após disputa de 3º lugar");
          await storage.updateTournament(tournament.id, {
            currentRound: 6,
            currentMatch: 2  // Configurar explicitamente para a final
          });
        }
      }
      
      // Se estivermos na rodada 5 e todas as partidas estiverem concluídas, criamos a final e o bronze match
      if (match.round === 5) {
        console.log("Partida de semifinal concluída! Verificando se devemos criar partidas finais...");
        const roundMatches = await storage.getMatchesByRound(match.tournamentId, 5);
        const completedMatches = roundMatches.filter(m => m.completed);
        
        if (completedMatches.length === roundMatches.length) {
          console.log("Todas as semifinais estão completas! Criando partidas finais...");
          // Poderíamos implementar aqui a lógica para criar as partidas finais,
          // mas isso já é feito dentro do método selectTournamentWinner
        }
      }
      
      // Se todas as partidas no torneio estiverem concluídas, incluindo a final, iniciar novo torneio
      if (shouldStartNewTournament) {
        console.log("Iniciando novo torneio automaticamente...");
        // Forçar a inicialização de um novo torneio
        await storage.initializeNewTournament();
      }
      
      // Verificar se temos um novo torneio iniciado (após finalizar o anterior)
      const currentTournament = await storage.getCurrentTournament();
      
      // Obter a próxima partida, se houver
      const nextMatch = await storage.getCurrentMatch();
      
      let message = "Winner selected successfully";
      let tournamentChanged = false;
      
      if (currentTournament && currentTournament.id !== tournamentIdBeforeUpdate) {
        message = "Tournament completed. New tournament started automatically.";
        tournamentChanged = true;
        console.log(`Torneio mudou de ${tournamentIdBeforeUpdate} para ${currentTournament.id}`);
      }
      
      // Não precisamos avançar novamente, já fizemos isso acima
      const nextMatchAfterAdvancing = await storage.getCurrentMatch();
      
      res.json({
        success: true,
        message: message,
        nextMatch: nextMatchAfterAdvancing || nextMatch,
        tournamentChanged: tournamentChanged
      });
    } catch (error) {
      console.error("Error selecting winner:", error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Invalid input data",
          errors: error.errors
        });
      }
      
      res.status(500).json({
        success: false,
        message: "Failed to select winner"
      });
    }
  });

  // Advance to the next match
  router.post("/next-match", async (req, res) => {
    try {
      const nextMatch = await storage.advanceToNextMatch();
      
      if (!nextMatch) {
        return res.status(404).json({
          success: false,
          message: "No next match available, tournament may be completed"
        });
      }
      
      res.json({
        success: true,
        message: "Advanced to next match",
        nextMatch: nextMatch
      });
    } catch (error) {
      console.error("Error advancing to next match:", error);
      res.status(500).json({
        success: false,
        message: "Failed to advance to next match"
      });
    }
  });

  // Get tournament progress
  router.get("/tournament-progress", async (req, res) => {
    try {
      await ensureTournamentExists();
      
      const currentTournament = await storage.getCurrentTournament();
      if (!currentTournament) {
        return res.status(404).json({
          success: false,
          message: "No active tournament found"
        });
      }
      
      const progress = await storage.getTournamentProgress(currentTournament.id);
      
      res.json({
        success: true,
        data: progress
      });
    } catch (error) {
      console.error("Error fetching tournament progress:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch tournament progress"
      });
    }
  });

  // Get contestant information
  router.get("/contestants/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid contestant ID"
        });
      }
      
      const contestant = await storage.getContestantById(id);
      if (!contestant) {
        return res.status(404).json({
          success: false,
          message: "Contestant not found"
        });
      }
      
      // Get point history for the contestant
      const pointHistory = await storage.getPointHistoryByContestant(id, 10);
      
      res.json({
        success: true,
        data: {
          contestant,
          pointHistory
        }
      });
    } catch (error) {
      console.error("Error fetching contestant:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch contestant information"
      });
    }
  });
  
  // Get contestant images
  router.get("/contestants/:id/images", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid contestant ID"
        });
      }
      
      const contestant = await storage.getContestantById(id);
      if (!contestant) {
        return res.status(404).json({
          success: false,
          message: "Contestant not found"
        });
      }
      
      // Forçar a busca de novas imagens para usar a nova implementação do Google
      // Ignoramos o cache temporariamente para testar a nova implementação
      let images: string[] = await fetchContestantImages(id, contestant.name);
      
      res.json({
        success: true,
        images: images
      });
    } catch (error) {
      console.error("Error fetching contestant images:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch contestant images"
      });
    }
  });

  return router;
}

// Match routes
const matchesRouter = Router();

matchesRouter.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid match ID"
      });
    }
    
    const match = await storage.getMatchById(id);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found"
      });
    }
    
    // Get contestant details
    const contestant1 = await storage.getContestantById(match.contestant1Id);
    const contestant2 = await storage.getContestantById(match.contestant2Id);
    const winner = match.winnerId ? await storage.getContestantById(match.winnerId) : null;
    
    res.json({
      success: true,
      data: {
        match,
        contestant1,
        contestant2,
        winner
      }
    });
  } catch (error) {
    console.error("Error fetching match:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch match information"
    });
  }
});

// Tournament routes
const tournamentRouter = Router();

tournamentRouter.get("/current", async (req, res) => {
  try {
    await ensureTournamentExists();
    
    const tournament = await storage.getCurrentTournament();
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "No active tournament found"
      });
    }
    
    // Get tournament bracket
    const bracket = await storage.getTournamentBracket(tournament.id);
    
    res.json({
      success: true,
      data: {
        tournament,
        bracket
      }
    });
  } catch (error) {
    console.error("Error fetching tournament:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tournament information"
    });
  }
});

tournamentRouter.get("/bracket", async (req, res) => {
  try {
    await ensureTournamentExists();
    
    const tournament = await storage.getCurrentTournament();
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: "No active tournament found"
      });
    }
    
    // Get tournament bracket
    const bracket = await storage.getTournamentBracket(tournament.id);
    
    res.json({
      success: true,
      data: bracket
    });
  } catch (error) {
    console.error("Error fetching tournament bracket:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tournament bracket"
    });
  }
});

tournamentRouter.get("/history", async (req, res) => {
  try {
    const tournaments = await storage.getAllTournaments();
    
    // Enrich tournament data with winners
    const enrichedTournaments = await Promise.all(
      tournaments.map(async (tournament) => {
        let champion = null;
        let runnerUp = null;
        let thirdPlace = null;
        
        if (tournament.champion) {
          champion = await storage.getContestantById(tournament.champion);
        }
        
        if (tournament.runnerUp) {
          runnerUp = await storage.getContestantById(tournament.runnerUp);
        }
        
        if (tournament.thirdPlace) {
          thirdPlace = await storage.getContestantById(tournament.thirdPlace);
        }
        
        return {
          ...tournament,
          champion,
          runnerUp,
          thirdPlace
        };
      })
    );
    
    res.json({
      success: true,
      data: enrichedTournaments
    });
  } catch (error) {
    console.error("Error fetching tournament history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tournament history"
    });
  }
});

// Contestants routes
const contestantsRouter = Router();

contestantsRouter.get("/", async (req, res) => {
  try {
    const contestants = await storage.getAllContestants();
    
    res.json({
      success: true,
      data: contestants
    });
  } catch (error) {
    console.error("Error fetching contestants:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contestants"
    });
  }
});

contestantsRouter.get("/active", async (req, res) => {
  try {
    const contestants = await storage.getActiveContestants();
    
    res.json({
      success: true,
      data: contestants
    });
  } catch (error) {
    console.error("Error fetching active contestants:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch active contestants"
    });
  }
});

contestantsRouter.get("/ranking", async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    
    const contestants = await storage.getTopContestantsByPoints(limit);
    
    res.json({
      success: true,
      data: contestants
    });
  } catch (error) {
    console.error("Error fetching contestant ranking:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch contestant ranking"
    });
  }
});

contestantsRouter.get("/tournament-ranking", async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    
    const contestants = await storage.getTopContestantsByTournamentPoints(limit);
    
    res.json({
      success: true,
      data: contestants
    });
  } catch (error) {
    console.error("Error fetching tournament ranking:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tournament ranking"
    });
  }
});

// Rota para obter imagens de uma atriz específica
contestantsRouter.get("/:id/images", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "ID de atriz inválido"
      });
    }
    
    const contestant = await storage.getContestantById(id);
    if (!contestant) {
      return res.status(404).json({
        success: false,
        message: "Atriz não encontrada"
      });
    }
    
    // Verificar a fonte da solicitação (gallery ou tournament)
    const source = req.query.source === 'gallery' ? 'gallery' : 'tournament';
    
    // Buscar imagens conforme a fonte solicitada
    let images = await fetchContestantImages(id, contestant.name, source);
    
    // Não limitamos mais a uma única imagem, retornamos todas as imagens (até 3) disponíveis
    
    res.json({
      success: true,
      data: { images }
    });
  } catch (error) {
    console.error("Error fetching contestant images:", error);
    res.status(500).json({
      success: false,
      message: "Falha ao buscar imagens da atriz"
    });
  }
});

// Rota para obter uma atriz específica por ID
contestantsRouter.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "ID de atriz inválido"
      });
    }
    
    const contestant = await storage.getContestantById(id);
    if (!contestant) {
      return res.status(404).json({
        success: false,
        message: "Atriz não encontrada"
      });
    }
    
    res.json({
      success: true,
      data: contestant
    });
  } catch (error) {
    console.error("Error fetching contestant:", error);
    res.status(500).json({
      success: false,
      message: "Falha ao buscar atriz"
    });
  }
});

// Rota para atualizar uma atriz existente
contestantsRouter.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "ID de atriz inválido"
      });
    }
    
    const contestant = await storage.getContestantById(id);
    if (!contestant) {
      return res.status(404).json({
        success: false,
        message: "Atriz não encontrada"
      });
    }
    
    // Atualmente apenas permitimos atualizar a nacionalidade
    const { nationality } = req.body;
    
    // Atualizar a concorrente
    const updatedContestant = await storage.updateContestant(id, {
      nationality: nationality !== undefined ? nationality.trim() : contestant.nationality
    });
    
    res.json({
      success: true,
      message: "Atriz atualizada com sucesso",
      data: updatedContestant
    });
  } catch (error) {
    console.error("Error updating contestant:", error);
    res.status(500).json({
      success: false,
      message: "Falha ao atualizar atriz"
    });
  }
});

// Rota para adicionar uma nova atriz
contestantsRouter.post("/", async (req, res) => {
  try {
    // Validação básica
    const { name, nationality } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Nome da atriz é obrigatório"
      });
    }
    
    // Verificar se o nome já existe
    const allContestants = await storage.getAllContestants();
    const nameExists = allContestants.some(c => 
      c.name.toLowerCase() === name.trim().toLowerCase()
    );
    
    if (nameExists) {
      return res.status(400).json({
        success: false,
        message: "Esta atriz já está cadastrada"
      });
    }
    
    // Criar nova concorrente com valores padrão
    const newContestant = await storage.createContestant({
      name: name.trim(),
      nationality: nationality ? nationality.trim() : "",
      points: 1000,
      tournamentPoints: 0,
      matches: 0,
      wins: 0,
      losses: 0,
      goldMedals: 0,
      silverMedals: 0,
      bronzeMedals: 0,
      active: true
    });
    
    res.status(201).json({
      success: true,
      message: "Atriz adicionada com sucesso",
      data: newContestant
    });
  } catch (error) {
    console.error("Error creating contestant:", error);
    res.status(500).json({
      success: false,
      message: "Falha ao adicionar a atriz"
    });
  }
});

// Stats routes
const statsRouter = Router();

statsRouter.get("/general", async (req, res) => {
  try {
    const contestants = await storage.getAllContestants();
    
    // Sort by wins and then points
    const sortedContestants = contestants.sort((a, b) => {
      if (a.wins !== b.wins) {
        return b.wins - a.wins;
      }
      return b.points - a.points;
    });
    
    res.json({
      success: true,
      data: sortedContestants
    });
  } catch (error) {
    console.error("Error fetching general stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch general stats"
    });
  }
});

// Rota para definir nacionalidade dos EUA para todas as concorrentes
statsRouter.get("/set-usa-nationality", async (req, res) => {
  try {
    const allContestants = await storage.getAllContestants();
    let updated = 0;
    
    for (const contestant of allContestants) {
      await storage.updateContestant(contestant.id, {
        nationality: "🇺🇸 EUA"
      });
      updated++;
    }
    
    res.json({
      success: true,
      data: {
        message: `Nacionalidade atualizada para ${updated} concorrentes`,
        updated
      }
    });
  } catch (error) {
    console.error("Erro ao atualizar nacionalidades:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao atualizar nacionalidades"
    });
  }
});

statsRouter.get("/top-performers-history", async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 8;
    
    // Get top performers by points
    const topPerformers = await storage.getTopContestantsByPoints(limit);
    
    // Get their point history
    const contestantIds = topPerformers.map(c => c.id);
    const pointHistory = await storage.getTopContestantsPointHistory(contestantIds);
    
    res.json({
      success: true,
      data: {
        topPerformers,
        pointHistory
      }
    });
  } catch (error) {
    console.error("Error fetching top performers history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch top performers history"
    });
  }
});

// Esta função será exportada e usada no index.ts
export function setupImageProxy(app: Express) {
  // Proxy de imagens para contornar CORS
  app.get("/proxy-image", async (req: Request, res: Response) => {
    try {
      const imageUrl = req.query.url as string;
      const square = req.query.square === 'true'; // Opção para forçar imagem quadrada
      
      if (!imageUrl) {
        return res.status(400).json({ 
          success: false,
          message: "URL de imagem não fornecida"
        });
      }
      
      console.log(`Proxy de imagem: ${imageUrl}${square ? ' (formato quadrado)' : ''}`);
      
      // Adiciona timeout para evitar esperas longas
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      try {
        const response = await fetch(imageUrl, { 
          signal: controller.signal,
          headers: {
            // Adicionando user-agent para evitar bloqueios
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) {
          return res.status(response.status).send("Falha ao buscar imagem");
        }
        
        // Verifica se o conteúdo é realmente uma imagem
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.startsWith('image/')) {
          return res.status(400).send("O conteúdo não é uma imagem válida");
        }
        
        // Define o tipo de conteúdo e configura o cache
        res.setHeader("Content-Type", contentType);
        res.setHeader("Cache-Control", "public, max-age=604800"); // Cache por 7 dias
        
        // Transmite a imagem
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
      } catch (fetchError) {
        clearTimeout(timeout);
        if (fetchError.name === 'AbortError') {
          return res.status(504).send("Tempo limite excedido ao buscar a imagem");
        }
        throw fetchError;
      }
    } catch (error) {
      console.error("Erro no proxy de imagem:", error);
      // Retorna um erro 404 (sem fallback) para que o front-end trate adequadamente
      res.status(404).send("Imagem não encontrada");
    }
  });
}

// Rota de health check para o Render e serviços de monitoring
function setupHealthCheck(app: Express) {
  app.get("/health", async (_req: Request, res: Response) => {
    try {
      // Verificar conexão com banco de dados se não estivermos usando armazenamento em memória
      const { db, sql, shouldUseMemoryStorage } = await import('./db');
      
      if (!shouldUseMemoryStorage && process.env.DATABASE_URL) {
        try {
          // Tenta executar uma consulta simples
          const result = await sql`SELECT NOW() as now`;
          return res.status(200).json({
            status: "ok",
            timestamp: new Date().toISOString(),
            database: "connected",
            database_time: result[0].now
          });
        } catch (err) {
          console.error("Erro na verificação de saúde do banco de dados:", err);
          return res.status(500).json({
            status: "error",
            timestamp: new Date().toISOString(),
            database: "disconnected",
            error: String(err)
          });
        }
      } else {
        // Usando armazenamento em memória
        return res.status(200).json({
          status: "ok",
          timestamp: new Date().toISOString(),
          database: "memory",
          note: "Usando armazenamento em memória (os dados serão perdidos ao reiniciar o servidor)"
        });
      }
    } catch (err) {
      console.error("Erro no health check:", err);
      return res.status(500).json({
        status: "error",
        timestamp: new Date().toISOString(),
        error: String(err)
      });
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configurar rota de health check
  setupHealthCheck(app);
  const httpServer = createServer(app);
  
  // API routes
  app.use("/api", createApiRouter());
  
  // Initialize the first tournament if none exists
  await ensureTournamentExists();

  return httpServer;
}
