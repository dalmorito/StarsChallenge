import { 
  Contestant, InsertContestant, 
  Tournament, InsertTournament,
  Match, InsertMatch,
  PointHistory, InsertPointHistory,
  ImageCache, InsertImageCache,
  CONTESTANTS_LIST, TOURNAMENT_POINTS, 
  TournamentBracket, BracketMatch,
  CurrentMatchData, TournamentProgress,
  CurrentMatchContestant
} from "@shared/schema";
import { users, type User, type InsertUser } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods (from template)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Contestant methods
  getAllContestants(): Promise<Contestant[]>;
  getActiveContestants(): Promise<Contestant[]>;
  getContestantById(id: number): Promise<Contestant | undefined>;
  createContestant(contestant: InsertContestant): Promise<Contestant>;
  updateContestant(id: number, contestant: Partial<Contestant>): Promise<Contestant>;
  getTopContestantsByPoints(limit: number): Promise<Contestant[]>;
  getTopContestantsByTournamentPoints(limit: number): Promise<Contestant[]>;
  
  // Tournament methods
  getCurrentTournament(): Promise<Tournament | undefined>;
  getTournamentById(id: number): Promise<Tournament | undefined>;
  getAllTournaments(): Promise<Tournament[]>;
  createTournament(tournament: InsertTournament): Promise<Tournament>;
  updateTournament(id: number, tournament: Partial<Tournament>): Promise<Tournament>;
  
  // Match methods
  getMatchById(id: number): Promise<Match | undefined>;
  getMatchesByTournament(tournamentId: number): Promise<Match[]>;
  getMatchesByRound(tournamentId: number, round: number): Promise<Match[]>;
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatch(id: number, match: Partial<Match>): Promise<Match>;
  getCurrentMatch(): Promise<Match | undefined>;
  
  // Point history methods
  getPointHistoryByContestant(contestantId: number, limit?: number): Promise<PointHistory[]>;
  createPointHistory(pointHistory: InsertPointHistory): Promise<PointHistory>;
  getTopContestantsPointHistory(contestantIds: number[], limit?: number): Promise<Record<number, PointHistory[]>>;
  
  // Image cache methods
  getImageCache(contestantId: number): Promise<ImageCache | undefined>;
  createImageCache(imageCache: InsertImageCache): Promise<ImageCache>;
  
  // Tournament initialization and management
  initializeNewTournament(): Promise<Tournament>;
  selectTournamentWinner(matchId: number, winnerId: number): Promise<void>;
  advanceToNextMatch(): Promise<Match | undefined>;
  
  // Tournament data retrieval
  getTournamentBracket(tournamentId: number): Promise<TournamentBracket>;
  getCurrentMatchData(): Promise<CurrentMatchData | undefined>;
  getTournamentProgress(tournamentId: number): Promise<TournamentProgress>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private contestants: Map<number, Contestant>;
  private tournaments: Map<number, Tournament>;
  private matches: Map<number, Match>;
  private pointHistory: PointHistory[];
  private imageCache: Map<number, ImageCache>;
  
  private userCurrentId: number;
  private contestantCurrentId: number;
  private tournamentCurrentId: number;
  private matchCurrentId: number;
  private pointHistoryCurrentId: number;
  private imageCacheCurrentId: number;

  constructor() {
    this.users = new Map();
    this.contestants = new Map();
    this.tournaments = new Map();
    this.matches = new Map();
    this.pointHistory = [];
    this.imageCache = new Map();
    
    this.userCurrentId = 1;
    this.contestantCurrentId = 1;
    this.tournamentCurrentId = 1;
    this.matchCurrentId = 1;
    this.pointHistoryCurrentId = 1;
    this.imageCacheCurrentId = 1;
    
    // Initialize contestants from the list
    this.initializeContestants();
  }

  private initializeContestants() {
    // Definir EUA como a nacionalidade de todas as atrizes
    const nationality = '🇺🇸 EUA';
    
    // Create contestants based on the provided list
    CONTESTANTS_LIST.forEach(name => {
      // Atribuir EUA como nacionalidade para todas
      // const nationality = nationalities[Math.floor(Math.random() * nationalities.length)];
      
      const contestant: InsertContestant = {
        name,
        nationality,
        points: 1000, // Everyone starts with 1000 points
        tournamentPoints: 0,
        matches: 0,
        wins: 0,
        losses: 0,
        goldMedals: 0,
        silverMedals: 0,
        bronzeMedals: 0,
        active: false // Initially no one is active in a tournament
      };
      this.createContestant(contestant);
    });
  }

  // User methods (from template)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Contestant methods
  async getAllContestants(): Promise<Contestant[]> {
    return Array.from(this.contestants.values());
  }

  /**
   * Obtém todas as atrizes que estão marcadas como ativas E têm pontos > 0
   * Isso garante que atrizes com zero pontos não participem de novas partidas
   */
  async getActiveContestants(): Promise<Contestant[]> {
    return Array.from(this.contestants.values()).filter(
      contestant => contestant.active && contestant.points > 0
    );
  }

  async getContestantById(id: number): Promise<Contestant | undefined> {
    return this.contestants.get(id);
  }

  async createContestant(insertContestant: InsertContestant): Promise<Contestant> {
    const id = this.contestantCurrentId++;
    
    // Ensure all required fields are provided with default values if needed
    const contestant: Contestant = {
      id,
      name: insertContestant.name,
      nationality: insertContestant.nationality || null,
      points: insertContestant.points || 1000,
      tournamentPoints: insertContestant.tournamentPoints || 0,
      matches: insertContestant.matches || 0,
      wins: insertContestant.wins || 0,
      losses: insertContestant.losses || 0,
      goldMedals: insertContestant.goldMedals || 0,
      silverMedals: insertContestant.silverMedals || 0,
      bronzeMedals: insertContestant.bronzeMedals || 0,
      active: insertContestant.active !== undefined ? insertContestant.active : true
    };
    
    this.contestants.set(id, contestant);
    return contestant;
  }

  async updateContestant(id: number, contestantUpdate: Partial<Contestant>): Promise<Contestant> {
    const contestant = this.contestants.get(id);
    if (!contestant) {
      throw new Error(`Contestant with id ${id} not found`);
    }
    
    const updatedContestant = { ...contestant, ...contestantUpdate };
    this.contestants.set(id, updatedContestant);
    return updatedContestant;
  }

  async getTopContestantsByPoints(limit: number): Promise<Contestant[]> {
    return Array.from(this.contestants.values())
      .sort((a, b) => b.points - a.points)
      .slice(0, limit);
  }

  async getTopContestantsByTournamentPoints(limit: number): Promise<Contestant[]> {
    return Array.from(this.contestants.values())
      .sort((a, b) => b.tournamentPoints - a.tournamentPoints)
      .slice(0, limit);
  }

  // Tournament methods
  async getCurrentTournament(): Promise<Tournament | undefined> {
    // Get the most recent tournament that's not completed
    return Array.from(this.tournaments.values())
      .filter(tournament => !tournament.completed)
      .sort((a, b) => b.id - a.id)[0];
  }

  async getTournamentById(id: number): Promise<Tournament | undefined> {
    return this.tournaments.get(id);
  }

  async getAllTournaments(): Promise<Tournament[]> {
    return Array.from(this.tournaments.values())
      .sort((a, b) => b.id - a.id); // Sort by id descending (newest first)
  }

  async createTournament(insertTournament: InsertTournament): Promise<Tournament> {
    const id = this.tournamentCurrentId++;
    
    // Ensure all required fields have default values
    const tournament: Tournament = {
      id,
      matches: insertTournament.matches || 0,
      startDate: insertTournament.startDate || new Date(),
      endDate: insertTournament.endDate || null,
      completed: insertTournament.completed !== undefined ? insertTournament.completed : false,
      currentRound: insertTournament.currentRound || 1,
      currentMatch: insertTournament.currentMatch || 1,
      champion: insertTournament.champion || null,
      runnerUp: insertTournament.runnerUp || null,
      thirdPlace: insertTournament.thirdPlace || null
    };
    
    this.tournaments.set(id, tournament);
    return tournament;
  }

  async updateTournament(id: number, tournamentUpdate: Partial<Tournament>): Promise<Tournament> {
    const tournament = this.tournaments.get(id);
    if (!tournament) {
      throw new Error(`Tournament with id ${id} not found`);
    }
    
    const updatedTournament = { ...tournament, ...tournamentUpdate };
    this.tournaments.set(id, updatedTournament);
    return updatedTournament;
  }

  // Match methods
  async getMatchById(id: number): Promise<Match | undefined> {
    return this.matches.get(id);
  }

  async getMatchesByTournament(tournamentId: number): Promise<Match[]> {
    return Array.from(this.matches.values())
      .filter(match => match.tournamentId === tournamentId)
      .sort((a, b) => {
        // Sort by round first, then by match number
        if (a.round !== b.round) {
          return a.round - b.round;
        }
        return a.matchNumber - b.matchNumber;
      });
  }

  async getMatchesByRound(tournamentId: number, round: number): Promise<Match[]> {
    return Array.from(this.matches.values())
      .filter(match => match.tournamentId === tournamentId && match.round === round)
      .sort((a, b) => a.matchNumber - b.matchNumber);
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const id = this.matchCurrentId++;
    
    // Ensure all required fields have default values
    const match: Match = {
      id,
      tournamentId: insertMatch.tournamentId,
      round: insertMatch.round,
      matchNumber: insertMatch.matchNumber,
      contestant1Id: insertMatch.contestant1Id,
      contestant2Id: insertMatch.contestant2Id,
      winnerId: insertMatch.winnerId !== undefined ? insertMatch.winnerId : null,
      completed: insertMatch.completed !== undefined ? insertMatch.completed : false
    };
    
    this.matches.set(id, match);
    return match;
  }

  async updateMatch(id: number, matchUpdate: Partial<Match>): Promise<Match> {
    const match = this.matches.get(id);
    if (!match) {
      throw new Error(`Match with id ${id} not found`);
    }
    
    const updatedMatch = { ...match, ...matchUpdate };
    this.matches.set(id, updatedMatch);
    return updatedMatch;
  }

  async getCurrentMatch(): Promise<Match | undefined> {
    const tournament = await this.getCurrentTournament();
    if (!tournament) return undefined;
    
    // Verificamos se estamos na rodada final (rodada 6)
    if (tournament.currentRound === 6) {
      // Caso especial: Se estamos na rodada 6 mas a partida atual está completada
      // (como após o bronze match), precisamos verificar se é a disputa do bronze ou final
      if (tournament.currentMatch === 1) {
        // Bronze match (disputa de 3º lugar)
        const bronzeMatch = Array.from(this.matches.values()).find(
          match => match.tournamentId === tournament.id && 
                  match.round === 6 && 
                  match.matchNumber === 1
        );
        
        if (bronzeMatch && bronzeMatch.completed) {
          // Se o bronze match está completo, então devemos mostrar a final
          console.log("Bronze match está completo, buscando a final...");
          const finalMatch = Array.from(this.matches.values()).find(
            match => match.tournamentId === tournament.id && 
                    match.round === 6 && 
                    match.matchNumber === 2
          );
          
          console.log("Final encontrada:", finalMatch);
          return finalMatch;
        }
        
        // Se o bronze match não está completo, retorná-lo
        return bronzeMatch;
      } else if (tournament.currentMatch === 2) {
        // Final - retornar independentemente do status de completude
        const finalMatch = Array.from(this.matches.values()).find(
          match => match.tournamentId === tournament.id && 
                  match.round === 6 && 
                  match.matchNumber === 2
        );
        
        return finalMatch;
      }
    }
    
    // Caso padrão para todas as outras rodadas
    // Primeiro procuramos pela partida não completada (caso normal)
    const currentMatch = Array.from(this.matches.values()).find(
      match => match.tournamentId === tournament.id && 
               match.round === tournament.currentRound && 
               match.matchNumber === tournament.currentMatch &&
               !match.completed
    );
    
    if (currentMatch) return currentMatch;
    
    // Se não encontrarmos uma partida não completada, procuramos pela partida atual
    // independentemente do status de completude
    return Array.from(this.matches.values()).find(
      match => match.tournamentId === tournament.id && 
               match.round === tournament.currentRound && 
               match.matchNumber === tournament.currentMatch
    );
  }

  // Point history methods
  async getPointHistoryByContestant(contestantId: number, limit?: number): Promise<PointHistory[]> {
    const history = this.pointHistory
      .filter(entry => entry.contestantId === contestantId)
      .sort((a, b) => {
        // Sort by createdAt descending (newest first)
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
    
    return limit ? history.slice(0, limit) : history;
  }

  async createPointHistory(insertPointHistory: InsertPointHistory): Promise<PointHistory> {
    const id = this.pointHistoryCurrentId++;
    
    // Ensure all required fields have default values
    const pointHistory: PointHistory = {
      id,
      contestantId: insertPointHistory.contestantId,
      tournamentId: insertPointHistory.tournamentId,
      matchId: insertPointHistory.matchId || null,
      pointsBefore: insertPointHistory.pointsBefore,
      pointsChange: insertPointHistory.pointsChange,
      pointsAfter: insertPointHistory.pointsAfter,
      reason: insertPointHistory.reason || null,
      createdAt: insertPointHistory.createdAt || new Date()
    };
    
    this.pointHistory.push(pointHistory);
    return pointHistory;
  }

  async getTopContestantsPointHistory(contestantIds: number[], limit?: number): Promise<Record<number, PointHistory[]>> {
    const result: Record<number, PointHistory[]> = {};
    
    for (const contestantId of contestantIds) {
      result[contestantId] = await this.getPointHistoryByContestant(contestantId, limit);
    }
    
    return result;
  }

  // Image cache methods
  async getImageCache(contestantId: number): Promise<ImageCache | undefined> {
    // Agora usamos o cache para melhorar a velocidade
    return this.imageCache.get(contestantId);
  }

  async createImageCache(insertImageCache: InsertImageCache): Promise<ImageCache> {
    const id = this.imageCacheCurrentId++;
    
    // Ensure all required fields have default values
    const imageCache: ImageCache = {
      id,
      contestantId: insertImageCache.contestantId,
      imageUrls: insertImageCache.imageUrls,
      createdAt: insertImageCache.createdAt || new Date()
    };
    
    this.imageCache.set(insertImageCache.contestantId, imageCache);
    return imageCache;
  }

  // Tournament initialization and management
  /**
   * Inicializa um novo torneio, selecionando participantes conforme as regras:
   * 1. Atrizes com pontos = 0 não participam de novos torneios (ficam inativas)
   * 2. Atrizes com pontos > 0 podem participar normalmente
   * 3. Atrizes eliminadas na primeira rodada têm menor prioridade para o próximo torneio
   * 
   * Mesmo excluídas dos novos torneios, atrizes com 0 pontos permanecem nas estatísticas.
   */
  async initializeNewTournament(): Promise<Tournament> {
    console.log("==================================================");
    console.log("INICIANDO NOVO TORNEIO - VERSÃO CORRIGIDA");
    console.log("==================================================");
    
    // First, check if there's an active tournament
    const currentTournament = await this.getCurrentTournament();
    console.log("Torneio atual:", currentTournament ? `ID ${currentTournament.id}` : "Nenhum");
    
    if (currentTournament) {
      // Mark the current tournament as completed
      await this.updateTournament(currentTournament.id, { 
        completed: true,
        endDate: new Date()
      });
      console.log(`Torneio ${currentTournament.id} marcado como completo`);
    }
    
    // Get all contestants
    const allContestants = await this.getAllContestants();
    
    // Get IDs of contestants who were active in the last tournament (if any)
    let previousActiveIds: number[] = [];
    if (currentTournament) {
      const activeContestants = allContestants.filter(c => c.active);
      previousActiveIds = activeContestants.map(c => c.id);
      
      // Reset active flag for all contestants
      for (const contestant of activeContestants) {
        await this.updateContestant(contestant.id, { active: false });
      }
    }
    
    // Lista de IDs de competidoras para o novo torneio
    const newActiveIds: number[] = [];
    
    // ESTRATÉGIA PARA O NOVO TORNEIO:
    // 1. Todas as atrizes que venceram na primeira rodada (32) são classificadas automaticamente para o próximo torneio
    // 2. As atrizes que perderam na primeira rodada (32) são excluídas do próximo torneio
    // 3. As 32 vagas restantes são preenchidas com novas atrizes que não participaram do torneio anterior

    if (currentTournament) {
      console.log('APLICANDO REGRAS DE CONTINUIDADE DO TORNEIO');
      
      // Obter partidas da primeira rodada do torneio anterior
      const firstRoundMatches = await this.getMatchesByRound(currentTournament.id, 1);
      
      // Listas de vencedoras e perdedoras da primeira rodada
      const firstRoundWinnerIds: number[] = [];
      const firstRoundLoserIds: number[] = [];
      
      // Separar vencedores e perdedores da primeira rodada
      for (const match of firstRoundMatches) {
        if (match.completed && match.winnerId) {
          // Adicionar vencedor
          firstRoundWinnerIds.push(match.winnerId);
          
          // Adicionar perdedor
          const loserId = match.contestant1Id === match.winnerId 
            ? match.contestant2Id 
            : match.contestant1Id;
          
          firstRoundLoserIds.push(loserId);
        }
      }
      
      console.log(`Torneio anterior: ${firstRoundWinnerIds.length} vencedoras e ${firstRoundLoserIds.length} perdedoras da primeira rodada`);
      
      // PARTE 1: Adicionar todas as vencedoras da primeira rodada que ainda têm pontos > 0
      const winnersWithPoints: number[] = [];
      
      for (const winnerId of firstRoundWinnerIds) {
        const contestant = this.contestants.get(winnerId);
        if (contestant && contestant.points > 0) {
          winnersWithPoints.push(winnerId);
        }
      }
      
      // Adicionar as vencedoras com pontos ao novo torneio
      console.log(`CONTINUIDADE: Mantendo ${winnersWithPoints.length} vencedoras da primeira rodada que ainda têm pontos > 0`);
      newActiveIds.push(...winnersWithPoints);
      
      // PARTE 2: Calcular quantas participantes ainda precisamos para completar 64
      const remainingSlots = 64 - newActiveIds.length;
      console.log(`CONTINUIDADE: Precisamos adicionar ${remainingSlots} novas participantes`);
      
      // PARTE 3: Obter todas as competidoras que NÃO participaram do torneio anterior
      const allPreviousParticipantIds = [...firstRoundWinnerIds, ...firstRoundLoserIds];
      
      // Encontrar competidoras que não participaram do torneio anterior e têm pontos > 0
      const newEligibleContestants = allContestants.filter(c => {
        return !allPreviousParticipantIds.includes(c.id) && c.points > 0;
      });
      
      console.log(`CONTINUIDADE: Encontradas ${newEligibleContestants.length} competidoras elegíveis que não participaram do torneio anterior`);
      
      // Se não tivermos competidoras novas suficientes, precisaremos reutilizar algumas perdedoras
      if (newEligibleContestants.length < remainingSlots) {
        console.log(`CONTINUIDADE: Não há competidoras novas suficientes, reutilizaremos algumas perdedoras`);
        
        // Adicionar todas as novas elegíveis
        newActiveIds.push(...newEligibleContestants.map(c => c.id));
        
        // Calcular quantas perdedoras precisamos reutilizar
        const slotsAfterNewContestants = 64 - newActiveIds.length;
        
        // Obter perdedoras com pontos > 0
        const losersWithPoints = firstRoundLoserIds
          .map(id => this.contestants.get(id))
          .filter(c => c && c.points > 0) as Contestant[];
        
        // Selecionar aleatoriamente entre as perdedoras
        const randomLosers = this.getRandomElements(losersWithPoints, slotsAfterNewContestants);
        console.log(`CONTINUIDADE: Reaproveitando ${randomLosers.length} perdedoras da primeira rodada`);
        
        // Adicionar as perdedoras selecionadas
        newActiveIds.push(...randomLosers.map(c => c.id));
      } else {
        // Temos competidoras novas suficientes, selecionar aleatoriamente entre elas
        const randomNewContestants = this.getRandomElements(newEligibleContestants, remainingSlots);
        console.log(`CONTINUIDADE: Adicionando ${randomNewContestants.length} novas participantes que não estiveram no torneio anterior`);
        
        // Adicionar as novas selecionadas
        newActiveIds.push(...randomNewContestants.map(c => c.id));
      }
    } else {
      // Para o primeiro torneio, selecionar 64 competidoras aleatórias com pontos > 0
      console.log('PRIMEIRO TORNEIO: Selecionando 64 competidoras aleatórias');
      
      const eligibleContestants = allContestants.filter(c => c.points > 0);
      const selectedContestants = this.getRandomElements(eligibleContestants, 64);
      
      console.log(`PRIMEIRO TORNEIO: Selecionadas ${selectedContestants.length} competidoras`);
      newActiveIds.push(...selectedContestants.map(c => c.id));
    }
    
    // Activate the selected contestants
    for (const id of newActiveIds) {
      await this.updateContestant(id, { active: true });
    }
    
    // Create a new tournament
    const newTournament = await this.createTournament({
      startDate: new Date(),
      endDate: undefined,
      completed: false,
      currentRound: 1, // Start with round 1
      currentMatch: 1, // Start with match 1
      matches: 0,
      champion: undefined,
      runnerUp: undefined,
      thirdPlace: undefined
    });
    
    // Create matches for round 1 (32 matches with 64 unique contestants)
    const activeContestants = await this.getActiveContestants();
    console.log(`Total de atrizes ativas disponíveis: ${activeContestants.length}`);
    
    // Ensure we have exactly 64 unique contestants
    if (activeContestants.length < 64) {
      throw new Error(`Não há atrizes suficientes para o torneio. Necessário: 64, Disponível: ${activeContestants.length}`);
    }
    
    // Shuffle and take exactly 64 unique contestants
    const shuffledContestants = this.shuffleArray([...activeContestants]);
    const tournamentContestants = shuffledContestants.slice(0, 64);
    
    console.log(`Selecionadas ${tournamentContestants.length} atrizes para o torneio`);
    
    // Verify uniqueness (debugging)
    const contestantNames = tournamentContestants.map(c => c.name);
    const uniqueNames = new Set(contestantNames);
    if (uniqueNames.size !== 64) {
      console.error(`ERRO: Encontradas ${uniqueNames.size} atrizes únicas de ${tournamentContestants.length} selecionadas`);
      throw new Error(`Erro na seleção de atrizes: ${uniqueNames.size} únicas de ${tournamentContestants.length}`);
    }
    
    // Create 32 matches with the 64 unique contestants
    for (let i = 0; i < 32; i++) {
      const contestant1 = tournamentContestants[i * 2];
      const contestant2 = tournamentContestants[i * 2 + 1];
      
      console.log(`Criando partida ${i + 1}: ${contestant1.name} vs ${contestant2.name}`);
      
      await this.createMatch({
        tournamentId: newTournament.id,
        round: 1,
        matchNumber: i + 1,
        contestant1Id: contestant1.id,
        contestant2Id: contestant2.id,
        winnerId: undefined,
        completed: false
      });
    }
    
    return newTournament;
  }

  async selectTournamentWinner(matchId: number, winnerId: number): Promise<void> {
    console.log(`Selecionando vencedora para a partida ${matchId}: Concorrente ${winnerId}`);
    
    const match = await this.getMatchById(matchId);
    if (!match) {
      throw new Error(`Match with id ${matchId} not found`);
    }
    
    const tournament = await this.getTournamentById(match.tournamentId);
    if (!tournament) {
      throw new Error(`Tournament not found for match ${matchId}`);
    }
    
    // Get the contestants
    const winner = await this.getContestantById(winnerId);
    const loserId = match.contestant1Id === winnerId ? match.contestant2Id : match.contestant1Id;
    const loser = await this.getContestantById(loserId);
    
    if (!winner || !loser) {
      throw new Error(`Contestant not found`);
    }
    
    console.log(`Vencedora: ${winner.name}, Perdedora: ${loser.name}`);
    
    // Update the match
    await this.updateMatch(matchId, {
      winnerId,
      completed: true
    });
    
    // Update tournament matches completed count
    await this.updateTournament(tournament.id, {
      matches: tournament.matches + 1
    });
    
    // Update contestant stats
    await this.updateContestant(winner.id, {
      matches: winner.matches + 1,
      wins: winner.wins + 1
    });
    
    await this.updateContestant(loser.id, {
      matches: loser.matches + 1,
      losses: loser.losses + 1
    });
    
    // Update points based on the ranking system
    // Winner gets 10% of loser's points, loser loses 10% of winner's points
    const winnerPointsGain = Math.floor(loser.points * 0.1);
    const loserPointsLoss = Math.floor(winner.points * 0.1);
    
    const updatedWinner = await this.updateContestant(winner.id, {
      points: winner.points + winnerPointsGain
    });
    
    const updatedLoser = await this.updateContestant(loser.id, {
      points: Math.max(0, loser.points - loserPointsLoss) // Permitir que os pontos cheguem a 0
    });
    
    // Record point history
    await this.createPointHistory({
      contestantId: winner.id,
      tournamentId: tournament.id,
      matchId: match.id,
      pointsBefore: winner.points,
      pointsChange: winnerPointsGain,
      pointsAfter: updatedWinner.points,
      reason: `Vitória contra ${loser.name}`,
      createdAt: new Date()
    });
    
    await this.createPointHistory({
      contestantId: loser.id,
      tournamentId: tournament.id,
      matchId: match.id,
      pointsBefore: loser.points,
      pointsChange: -loserPointsLoss,
      pointsAfter: updatedLoser.points,
      reason: `Derrota para ${winner.name}`,
      createdAt: new Date()
    });
    
    console.log(`Rodada atual: ${match.round}, Partida: ${match.matchNumber}`);
    
    // Create next round matches if necessary
    if (match.round < 6) { // We have 6 rounds total (64 → 32 → 16 → 8 → 4 → 2 → 1)
      const roundMatches = await this.getMatchesByRound(tournament.id, match.round);
      const completedMatches = roundMatches.filter(m => m.completed);
      
      console.log(`Partidas na rodada ${match.round}: ${roundMatches.length}, Partidas completadas: ${completedMatches.length}`);
      
      // If all matches in this round are completed, create matches for the next round
      if (completedMatches.length === roundMatches.length) {
        console.log(`Todas as partidas da rodada ${match.round} foram completadas!`);
        
        if (match.round === 5) {
          // If we're in the semi-finals (round 5), create bronze match and final
          const semiFinals = await this.getMatchesByRound(tournament.id, 5);
          
          if (semiFinals.length >= 2) {
            console.log("Criando jogos finais a partir das semifinais:", semiFinals);
            
            // Verificamos se temos vencedores válidos nas semifinais
            const semifinal1Winner = semiFinals[0].winnerId;
            const semifinal2Winner = semiFinals[1].winnerId;
            
            if (!semifinal1Winner || !semifinal2Winner) {
              console.error("Erro: semifinais sem vencedores definidos!");
              return;
            }
            
            // Get the two losers for bronze match
            const loser1 = semiFinals[0].contestant1Id === semifinal1Winner 
              ? semiFinals[0].contestant2Id 
              : semiFinals[0].contestant1Id;
            
            const loser2 = semiFinals[1].contestant1Id === semifinal2Winner 
              ? semiFinals[1].contestant2Id 
              : semiFinals[1].contestant1Id;
            
            console.log(`Criando bronze match entre perdedores das semifinais: ${loser1} vs ${loser2}`);
            
            // Create bronze match (3rd place match)
            await this.createMatch({
              tournamentId: tournament.id,
              round: 6,
              matchNumber: 1, // Match #1 is the bronze match
              contestant1Id: loser1,
              contestant2Id: loser2,
              winnerId: null,
              completed: false
            });
            
            console.log(`Criando final entre os vencedores das semifinais: ${semifinal1Winner} vs ${semifinal2Winner}`);
            
            // Create final match
            await this.createMatch({
              tournamentId: tournament.id,
              round: 6,
              matchNumber: 2, // Match #2 is the final
              contestant1Id: semifinal1Winner,
              contestant2Id: semifinal2Winner,
              winnerId: null,
              completed: false
            });
            
            // Update tournament round and match - começamos com o bronze match
            await this.updateTournament(tournament.id, {
              currentRound: 6,
              currentMatch: 1 // Start with the bronze match
            });
            
            console.log("Partidas finais criadas com sucesso!");
          } else {
            console.error("Erro: não há duas semifinais para criar os jogos finais");
          }
        } else if (match.round === 6 && match.matchNumber === 1) {
          // Se acabamos de completar o bronze match, o próximo é a final
          console.log("Bronze match completo! Avançando para a final.");
          
          // Registra o terceiro lugar no torneio 
          await this.updateTournament(tournament.id, {
            currentRound: 6,     // Mantém na rodada 6
            currentMatch: 2,     // Avança para a partida 2 (final)
            thirdPlace: winnerId // Registra o terceiro lugar
          });
          
          // Give bronze medal
          await this.updateContestant(winnerId, {
            bronzeMedals: winner.bronzeMedals + 1,
            tournamentPoints: winner.tournamentPoints + TOURNAMENT_POINTS.THIRD_PLACE
          });
          
          // 4th place gets points too
          await this.updateContestant(loserId, {
            tournamentPoints: loser.tournamentPoints + TOURNAMENT_POINTS.FOURTH_PLACE
          });
          
          console.log("Terceiro lugar determinado. Partida final configurada para iniciar.");
        } else if (match.round === 6 && match.matchNumber === 2) {
          // Tournament is complete, update the winner and runner-up
          console.log("Final completa! Atualizando campeã e vice-campeã. Iniciando novo torneio automaticamente.");
          
          await this.updateTournament(tournament.id, {
            completed: true,
            endDate: new Date(),
            champion: winnerId,
            runnerUp: loserId
          });
          
          // Assign tournament points and medals to all participants based on their finish
          await this.assignTournamentPoints(tournament.id);
          
          // Initialize a new tournament automatically
          console.log("Torneio finalizado! Iniciando automaticamente um novo torneio.");
          await this.initializeNewTournament();
        } else {
          // Create matches for the next round
          const nextRound = match.round + 1;
          const matchesInRound = Math.pow(2, 6 - nextRound);
          
          console.log(`Criando ${matchesInRound} partidas para a próxima rodada ${nextRound}`);
          
          // For each pair of matches in the current round, create one match in the next round
          for (let i = 0; i < matchesInRound; i++) {
            const match1 = roundMatches[i * 2];
            const match2 = roundMatches[i * 2 + 1];
            
            if (!match1.winnerId || !match2.winnerId) {
              console.error(`Erro: uma partida não tem vencedor definido! Match1: ${match1.id}, Match2: ${match2.id}`);
              continue;
            }
            
            await this.createMatch({
              tournamentId: tournament.id,
              round: nextRound,
              matchNumber: i + 1,
              contestant1Id: match1.winnerId,
              contestant2Id: match2.winnerId,
              winnerId: null,
              completed: false
            });
          }
          
          // Update tournament round and match
          await this.updateTournament(tournament.id, {
            currentRound: nextRound,
            currentMatch: 1
          });
        }
      } else {
        // Move to the next match in the current round
        const nextMatchNumber = match.matchNumber + 1;
        const nextMatchExists = roundMatches.some(m => m.matchNumber === nextMatchNumber);
        
        if (nextMatchExists) {
          console.log(`Avançando para a próxima partida: Rodada ${match.round}, Partida ${nextMatchNumber}`);
          
          await this.updateTournament(tournament.id, {
            currentMatch: nextMatchNumber
          });
        } else {
          console.log(`Não há mais partidas na rodada ${match.round}`);
        }
      }
    } else if (match.round === 6 && match.matchNumber === 2) {
      // Se a final (rodada 6, partida 2) foi completada, finalizar o torneio e iniciar um novo
      console.log("Final completa! Terminando torneio atual e iniciando novo torneio.");
      
      // Atualizar o torneio
      await this.updateTournament(tournament.id, {
        completed: true,
        endDate: new Date(),
        champion: winnerId,
        runnerUp: loserId
      });
      
      // Assign tournament points and medals
      await this.assignTournamentPoints(tournament.id);
      
      // Initialize a new tournament automatically
      console.log("Torneio finalizado! Iniciando automaticamente um novo torneio.");
      await this.initializeNewTournament();
    }
  }

  async advanceToNextMatch(): Promise<Match | undefined> {
    const tournament = await this.getCurrentTournament();
    if (!tournament) return undefined;
    
    const currentMatch = await this.getCurrentMatch();
    if (!currentMatch) return undefined;
    
    // If the current match is not completed, return it
    if (!currentMatch.completed) {
      return currentMatch;
    }
    
    // Special handling for semifinals (round 5)
    if (tournament.currentRound === 5 && currentMatch.completed) {
      // Check if all semifinals are completed
      const semifinals = await this.getMatchesByRound(tournament.id, 5);
      const completedSemifinals = semifinals.filter(m => m.completed);
      
      if (completedSemifinals.length === semifinals.length) {
        console.log("Todas as semifinais estão completas. Verificando se as partidas finais foram criadas...");
        
        // Check if finals are already created
        const finals = await this.getMatchesByRound(tournament.id, 6);
        
        if (finals.length === 0) {
          console.log("Partidas finais ainda não foram criadas. Criando agora...");
          
          // Create bronze match and final
          if (semifinals.length >= 2 && semifinals[0].winnerId && semifinals[1].winnerId) {
            // Get the losers for bronze match
            const loser1 = semifinals[0].contestant1Id === semifinals[0].winnerId 
              ? semifinals[0].contestant2Id 
              : semifinals[0].contestant1Id;
              
            const loser2 = semifinals[1].contestant1Id === semifinals[1].winnerId 
              ? semifinals[1].contestant2Id 
              : semifinals[1].contestant1Id;
            
            // Create bronze match (3rd place playoff)
            await this.createMatch({
              tournamentId: tournament.id,
              round: 6,
              matchNumber: 1,
              contestant1Id: loser1,
              contestant2Id: loser2,
              winnerId: null,
              completed: false
            });
            
            // Create final match
            await this.createMatch({
              tournamentId: tournament.id,
              round: 6,
              matchNumber: 2,
              contestant1Id: semifinals[0].winnerId,
              contestant2Id: semifinals[1].winnerId,
              winnerId: null,
              completed: false
            });
            
            // Move to bronze match
            await this.updateTournament(tournament.id, {
              currentRound: 6,
              currentMatch: 1
            });
            
            console.log("Partidas finais criadas com sucesso! Começando com o bronze match.");
            return this.getCurrentMatch();
          }
        }
      }
    }
    
    // If we're in the final match (round 6, match 2) and it's completed, tournament is over
    if (tournament.currentRound === 6 && tournament.currentMatch === 2 && currentMatch.completed) {
      try {
        // Obtenha as informações do torneio completo
        const completedTournament = await this.getTournamentById(tournament.id);
        if (completedTournament) {
          // Obtenha todos os matches do torneio
          const allMatches = await this.getMatchesByTournament(tournament.id);
          
          // Encontre a final (round 6, match 2)
          const finalMatch = allMatches.find(m => m.round === 6 && m.matchNumber === 2);
          
          // Encontre o bronze match (round 6, match 1)
          const bronzeMatch = allMatches.find(m => m.round === 6 && m.matchNumber === 1);
          
          if (finalMatch && finalMatch.winnerId && finalMatch.completed) {
            // Obtenha o campeão e vice-campeão
            const champion = await this.getContestantById(finalMatch.winnerId);
            const runnerUpId = finalMatch.contestant1Id === finalMatch.winnerId 
              ? finalMatch.contestant2Id 
              : finalMatch.contestant1Id;
            const runnerUp = await this.getContestantById(runnerUpId);
            
            // Obtenha o terceiro lugar
            let thirdPlace = null;
            if (bronzeMatch && bronzeMatch.winnerId && bronzeMatch.completed) {
              thirdPlace = await this.getContestantById(bronzeMatch.winnerId);
            }
            
            if (champion && runnerUp) {
              console.log(`Final concluída: ${champion.name} (campeã) vs ${runnerUp.name} (vice-campeã)`);
              
              // Atualize o torneio com os vencedores
              await this.updateTournament(tournament.id, {
                champion: champion.id,
                runnerUp: runnerUp.id,
                thirdPlace: thirdPlace?.id || null,
                completed: true,
                endDate: new Date()
              });
              
              // Verificar se o torneio já está finalizado para evitar duplicar medalhas
              // Medalhas e pontos já são atribuídos no método selectTournamentWinner
              console.log(`Torneio completo! Campeã: ${champion.name}, Vice-campeã: ${runnerUp.name}`);
              
              if (thirdPlace) {
                console.log(`Terceiro lugar: ${thirdPlace.name}`);
              }
              
              console.log("Torneio concluído com sucesso!");
            } else {
              console.error("Não foi possível obter informações do campeão ou vice-campeão");
            }
          }
        }
        
        // Iniciar automaticamente um novo torneio
        console.log("Torneio finalizado! Iniciando automaticamente um novo torneio.");
        await this.initializeNewTournament();
      } catch (error) {
        console.error("Erro ao finalizar torneio:", error);
      }
      
      return undefined;
    }
    
    // Get matches in the current round
    const roundMatches = await this.getMatchesByRound(tournament.id, tournament.currentRound);
    
    // If there are more matches in this round, advance to the next one
    if (tournament.currentMatch < roundMatches.length) {
      const nextMatchNumber = tournament.currentMatch + 1;
      await this.updateTournament(tournament.id, {
        currentMatch: nextMatchNumber
      });
      
      return this.getCurrentMatch();
    }
    
    // If we're at the end of the round, check if the next round is set up
    const nextRound = tournament.currentRound + 1;
    const nextRoundMatches = await this.getMatchesByRound(tournament.id, nextRound);
    
    if (nextRoundMatches.length > 0) {
      // Move to the first match of the next round
      await this.updateTournament(tournament.id, {
        currentRound: nextRound,
        currentMatch: 1
      });
      
      return this.getCurrentMatch();
    }
    
    // If we're here, we're waiting for matches to be created for the next round
    return undefined;
  }

  // Tournament data retrieval
  async getTournamentBracket(tournamentId: number): Promise<TournamentBracket> {
    const tournament = await this.getTournamentById(tournamentId);
    if (!tournament) {
      throw new Error(`Tournament with id ${tournamentId} not found`);
    }
    
    const tournamentMatches = await this.getMatchesByTournament(tournamentId);
    const bracket: TournamentBracket = {
      rounds: []
    };
    
    // Round names
    const roundNames = [
      "Round of 64",
      "Round of 32",
      "Round of 16",
      "Quarter-finals",
      "Semi-finals",
      "Finals"
    ];
    
    // Process each round
    for (let round = 1; round <= 6; round++) {
      const matchesInRound = tournamentMatches.filter(match => match.round === round);
      
      // Special handling for final round which has bronze match and final
      if (round === 6) {
        const bronzeMatch = matchesInRound.find(match => match.matchNumber === 1);
        const finalMatch = matchesInRound.find(match => match.matchNumber === 2);
        
        const roundMatches: BracketMatch[] = [];
        
        if (finalMatch) {
          const contestant1 = await this.getContestantById(finalMatch.contestant1Id);
          const contestant2 = await this.getContestantById(finalMatch.contestant2Id);
          const winner = finalMatch.winnerId ? await this.getContestantById(finalMatch.winnerId) : null;
          
          // Garantimos que a nacionalidade das concorrentes esteja disponível para exibição das bandeiras
          roundMatches.push({
            id: finalMatch.id,
            round: finalMatch.round,
            matchNumber: finalMatch.matchNumber,
            contestant1: contestant1 || null,
            contestant2: contestant2 || null,
            winner: winner,
            completed: finalMatch.completed
          });
        }
        
        if (bronzeMatch) {
          const contestant1 = await this.getContestantById(bronzeMatch.contestant1Id);
          const contestant2 = await this.getContestantById(bronzeMatch.contestant2Id);
          const winner = bronzeMatch.winnerId ? await this.getContestantById(bronzeMatch.winnerId) : null;
          
          // Garantimos que a nacionalidade das concorrentes esteja disponível para exibição das bandeiras
          roundMatches.push({
            id: bronzeMatch.id,
            round: bronzeMatch.round,
            matchNumber: bronzeMatch.matchNumber,
            contestant1: contestant1 || null,
            contestant2: contestant2 || null,
            winner: winner,
            completed: bronzeMatch.completed
          });
        }
        
        bracket.rounds.push({
          round,
          name: roundNames[round - 1],
          matches: roundMatches
        });
      } else {
        // For other rounds, process normally
        const roundMatches: BracketMatch[] = [];
        
        for (const match of matchesInRound) {
          const contestant1 = await this.getContestantById(match.contestant1Id);
          const contestant2 = await this.getContestantById(match.contestant2Id);
          const winner = match.winnerId ? await this.getContestantById(match.winnerId) : null;
          
          // Garantir que todos os dados da concorrente, incluindo a nacionalidade, estejam disponíveis
          roundMatches.push({
            id: match.id,
            round: match.round,
            matchNumber: match.matchNumber,
            contestant1: contestant1 || null,
            contestant2: contestant2 || null,
            winner: winner,
            completed: match.completed
          });
        }
        
        bracket.rounds.push({
          round,
          name: roundNames[round - 1],
          matches: roundMatches
        });
      }
    }
    
    return bracket;
  }

  async getCurrentMatchData(): Promise<CurrentMatchData | undefined> {
    const currentMatch = await this.getCurrentMatch();
    if (!currentMatch) return undefined;
    
    const tournament = await this.getCurrentTournament();
    if (!tournament) return undefined;
    
    const contestant1 = await this.getContestantById(currentMatch.contestant1Id);
    const contestant2 = await this.getContestantById(currentMatch.contestant2Id);
    
    if (!contestant1 || !contestant2) return undefined;
    
    // Get top contestants by points to determine rank
    const topContestants = await this.getTopContestantsByPoints(100);
    const contestant1Rank = topContestants.findIndex(c => c.id === contestant1.id) + 1;
    const contestant2Rank = topContestants.findIndex(c => c.id === contestant2.id) + 1;
    
    // Round names
    const roundNames = [
      "Round of 64",
      "Round of 32",
      "Round of 16",
      "Quarter-finals",
      "Semi-finals",
      "Finals"
    ];
    
    // Special handling for the final round
    let roundName = roundNames[currentMatch.round - 1];
    if (currentMatch.round === 6 && currentMatch.matchNumber === 1) {
      roundName = "Bronze Match";
    } else if (currentMatch.round === 6 && currentMatch.matchNumber === 2) {
      roundName = "Final";
    }
    
    // Obtenção das imagens dos concorrentes
    // Verificamos primeiro se temos no cache, caso contrário buscamos as imagens
    const { fetchContestantImages } = await import('./image-service');
    
    // Concorrente 1 - imagens
    const imageCache1 = await this.getImageCache(contestant1.id);
    let contestant1Images: string[] = [];
    if (imageCache1 && imageCache1.imageUrls.length >= 3) {
      console.log(`Usando cache para ${contestant1.name}, ${imageCache1.imageUrls.length} imagens`);
      contestant1Images = imageCache1.imageUrls;
    } else {
      console.log(`Buscando novas imagens para ${contestant1.name}`);
      contestant1Images = await fetchContestantImages(contestant1.id, contestant1.name, 'tournament');
      console.log(`Obtidas ${contestant1Images.length} imagens para ${contestant1.name}`);
      if (contestant1Images.length > 0) {
        // Armazenamos no cache para uso futuro
        await this.createImageCache({
          contestantId: contestant1.id,
          imageUrls: contestant1Images,
          createdAt: new Date()
        });
      }
    }
    
    // Concorrente 2 - imagens
    const imageCache2 = await this.getImageCache(contestant2.id);
    let contestant2Images: string[] = [];
    if (imageCache2 && imageCache2.imageUrls.length >= 3) {
      console.log(`Usando cache para ${contestant2.name}, ${imageCache2.imageUrls.length} imagens`);
      contestant2Images = imageCache2.imageUrls;
    } else {
      console.log(`Buscando novas imagens para ${contestant2.name}`);
      contestant2Images = await fetchContestantImages(contestant2.id, contestant2.name, 'tournament');
      console.log(`Obtidas ${contestant2Images.length} imagens para ${contestant2.name}`);
      if (contestant2Images.length > 0) {
        // Armazenamos no cache para uso futuro
        await this.createImageCache({
          contestantId: contestant2.id,
          imageUrls: contestant2Images,
          createdAt: new Date()
        });
      }
    }
    
    return {
      matchId: currentMatch.id,
      contestant1: {
        id: contestant1.id,
        name: contestant1.name,
        nationality: contestant1.nationality || '',
        points: contestant1.points,
        imageUrls: contestant1Images,
        rank: contestant1Rank
      },
      contestant2: {
        id: contestant2.id,
        name: contestant2.name,
        nationality: contestant2.nationality || '',
        points: contestant2.points,
        imageUrls: contestant2Images,
        rank: contestant2Rank
      },
      round: currentMatch.round,
      matchNumber: currentMatch.matchNumber,
      roundName
    };
  }

  async getTournamentProgress(tournamentId: number): Promise<TournamentProgress> {
    const tournament = await this.getTournamentById(tournamentId);
    if (!tournament) {
      throw new Error(`Tournament with id ${tournamentId} not found`);
    }
    
    // Total matches in a tournament with 64 participants: 32 + 16 + 8 + 4 + 2 + 2 = 64
    // (incluindo match de bronze e final)
    const totalMatches = 64;
    
    // Round names
    const roundNames = [
      "Round of 64",
      "Round of 32",
      "Round of 16",
      "Quarter-finals",
      "Semi-finals",
      "Finals"
    ];
    
    // Special handling for the final round
    let roundName = roundNames[tournament.currentRound - 1];
    const currentMatch = await this.getCurrentMatch();
    if (currentMatch && currentMatch.round === 6 && currentMatch.matchNumber === 1) {
      roundName = "Bronze Match";
    } else if (currentMatch && currentMatch.round === 6 && currentMatch.matchNumber === 2) {
      roundName = "Final";
    }
    
    // Calculate matches in the current round
    const matchesInRound = Math.pow(2, 6 - tournament.currentRound);
    
    // Calcular corretamente o número de partidas completadas
    const matches = await this.getMatchesByTournament(tournament.id);
    const completedMatches = matches.filter(m => m.completed).length;
    
    return {
      totalMatches,
      completedMatches: completedMatches,
      currentRound: tournament.currentRound,
      currentMatch: tournament.currentMatch,
      roundName,
      percentComplete: Math.floor((completedMatches / totalMatches) * 100)
    };
  }

  // Helper functions
  private assignTournamentPoints(tournamentId: number): Promise<void> {
    return new Promise<void>(async (resolve) => {
      const tournament = await this.getTournamentById(tournamentId);
      if (!tournament) {
        throw new Error(`Tournament with id ${tournamentId} not found`);
      }
      
      console.log(`Atribuindo pontos para o torneio ${tournamentId}...`);
      
      const allMatches = await this.getMatchesByTournament(tournamentId);
      
      // Assegurar que o torneio está completado
      const finalMatches = allMatches.filter(match => match.round === 6);
      if (finalMatches.length < 2) {
        console.log(`Torneio ${tournamentId} ainda não tem partidas finais, não atribuindo pontos ainda.`);
        resolve();
        return;
      }
      
      const goldFinalMatch = finalMatches.find(m => m.matchNumber === 2); // Final match
      const bronzeFinalMatch = finalMatches.find(m => m.matchNumber === 1); // 3rd place match
      
      if (!goldFinalMatch?.completed || !bronzeFinalMatch?.completed) {
        console.log(`Torneio ${tournamentId} ainda tem partidas finais incompletas, não atribuindo pontos ainda.`);
        resolve();
        return;
      }
      
      console.log(`Torneio ${tournamentId} completo! Atribuindo medalhas e pontos.`);
      
      // Atribuir ouro (campeão)
      if (goldFinalMatch.winnerId) {
        const champion = await this.getContestantById(goldFinalMatch.winnerId);
        if (champion) {
          console.log(`Atribuindo OURO e ${TOURNAMENT_POINTS.CHAMPION} pontos para ${champion.name}`);
          await this.updateContestant(champion.id, {
            tournamentPoints: champion.tournamentPoints + TOURNAMENT_POINTS.CHAMPION,
            goldMedals: champion.goldMedals + 1
          });
          
          // Atualizar torneio com o campeão
          await this.updateTournament(tournamentId, {
            champion: champion.id
          });
        }
      }
      
      // Atribuir prata (vice-campeão)
      const silverWinnerId = goldFinalMatch.contestant1Id === goldFinalMatch.winnerId
        ? goldFinalMatch.contestant2Id
        : goldFinalMatch.contestant1Id;
      
      const runnerUp = await this.getContestantById(silverWinnerId);
      if (runnerUp) {
        console.log(`Atribuindo PRATA e ${TOURNAMENT_POINTS.RUNNER_UP} pontos para ${runnerUp.name}`);
        await this.updateContestant(runnerUp.id, {
          tournamentPoints: runnerUp.tournamentPoints + TOURNAMENT_POINTS.RUNNER_UP,
          silverMedals: runnerUp.silverMedals + 1
        });
        
        // Atualizar torneio com o vice-campeão
        await this.updateTournament(tournamentId, {
          runnerUp: runnerUp.id
        });
      }
      
      // Atribuir bronze (terceiro lugar)
      if (bronzeFinalMatch.winnerId) {
        const thirdPlace = await this.getContestantById(bronzeFinalMatch.winnerId);
        if (thirdPlace) {
          console.log(`Atribuindo BRONZE e ${TOURNAMENT_POINTS.THIRD_PLACE} pontos para ${thirdPlace.name}`);
          await this.updateContestant(thirdPlace.id, {
            tournamentPoints: thirdPlace.tournamentPoints + TOURNAMENT_POINTS.THIRD_PLACE,
            bronzeMedals: thirdPlace.bronzeMedals + 1
          });
          
          // Atualizar torneio com o terceiro lugar
          await this.updateTournament(tournamentId, {
            thirdPlace: thirdPlace.id
          });
        }
      }
      
      // Atribuir quarto lugar
      const fourthPlaceId = bronzeFinalMatch.contestant1Id === bronzeFinalMatch.winnerId
        ? bronzeFinalMatch.contestant2Id
        : bronzeFinalMatch.contestant1Id;
      
      const fourthPlace = await this.getContestantById(fourthPlaceId);
      if (fourthPlace) {
        console.log(`Atribuindo ${TOURNAMENT_POINTS.FOURTH_PLACE} pontos para o 4º lugar: ${fourthPlace.name}`);
        await this.updateContestant(fourthPlace.id, {
          tournamentPoints: fourthPlace.tournamentPoints + TOURNAMENT_POINTS.FOURTH_PLACE
        });
      }
      
      // Assign points to 5th-8th (Quarter-finals losers)
      const quarterFinals = allMatches.filter(match => match.round === 4);
      for (const match of quarterFinals) {
        if (!match.winnerId) continue;
        
        const loserId = match.contestant1Id === match.winnerId 
          ? match.contestant2Id 
          : match.contestant1Id;
        
        const loser = await this.getContestantById(loserId);
        if (loser) {
          console.log(`Atribuindo ${TOURNAMENT_POINTS.FIFTH_EIGHTH} pontos para colocação 5º-8º: ${loser.name}`);
          await this.updateContestant(loser.id, {
            tournamentPoints: loser.tournamentPoints + TOURNAMENT_POINTS.FIFTH_EIGHTH
          });
        }
      }
      
      // Assign points to 9th-16th (Round of 16 losers)
      const roundOf16 = allMatches.filter(match => match.round === 3);
      for (const match of roundOf16) {
        if (!match.winnerId) continue;
        
        const loserId = match.contestant1Id === match.winnerId 
          ? match.contestant2Id 
          : match.contestant1Id;
        
        const loser = await this.getContestantById(loserId);
        if (loser) {
          console.log(`Atribuindo ${TOURNAMENT_POINTS.NINTH_SIXTEENTH} pontos para colocação 9º-16º: ${loser.name}`);
          await this.updateContestant(loser.id, {
            tournamentPoints: loser.tournamentPoints + TOURNAMENT_POINTS.NINTH_SIXTEENTH
          });
        }
      }
      
      // Assign points to 17th-32nd (Round of 32 losers)
      const roundOf32 = allMatches.filter(match => match.round === 2);
      for (const match of roundOf32) {
        if (!match.winnerId) continue;
        
        const loserId = match.contestant1Id === match.winnerId 
          ? match.contestant2Id 
          : match.contestant1Id;
        
        const loser = await this.getContestantById(loserId);
        if (loser) {
          console.log(`Atribuindo ${TOURNAMENT_POINTS.SEVENTEENTH_THIRTYSECOND} pontos para colocação 17º-32º: ${loser.name}`);
          await this.updateContestant(loser.id, {
            tournamentPoints: loser.tournamentPoints + TOURNAMENT_POINTS.SEVENTEENTH_THIRTYSECOND
          });
        }
      }
      
      // Assign points to 33rd-64th (Round of 64 losers)
      const roundOf64 = allMatches.filter(match => match.round === 1);
      for (const match of roundOf64) {
        if (!match.winnerId) continue;
        
        const loserId = match.contestant1Id === match.winnerId 
          ? match.contestant2Id 
          : match.contestant1Id;
        
        const loser = await this.getContestantById(loserId);
        if (loser) {
          console.log(`Atribuindo ${TOURNAMENT_POINTS.THIRTYTHIRD_SIXTYFOURTH} pontos para colocação 33º-64º: ${loser.name}`);
          await this.updateContestant(loser.id, {
            tournamentPoints: loser.tournamentPoints + TOURNAMENT_POINTS.THIRTYTHIRD_SIXTYFOURTH
          });
        }
      }
      
      // Marcar torneio como concluído
      await this.updateTournament(tournamentId, {
        completed: true,
        endDate: new Date()
      });
      
      console.log(`Finalização da atribuição de pontos para o torneio ${tournamentId} concluída!`);
      resolve();
    });
  }

  private getRandomElements<T>(array: T[], count: number): T[] {
    const shuffled = this.shuffleArray([...array]);
    return shuffled.slice(0, count);
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

export const storage = new MemStorage();
