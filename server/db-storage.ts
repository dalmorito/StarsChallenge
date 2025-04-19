import { db, ensureConnection } from './db';
import { eq, desc, asc, and, sql, not, inArray } from 'drizzle-orm';
import {
  Contestant, InsertContestant,
  Tournament, InsertTournament,
  Match, InsertMatch,
  PointHistory, InsertPointHistory,
  ImageCache, InsertImageCache,
  CONTESTANTS_LIST, TOURNAMENT_POINTS,
  TournamentBracket, BracketMatch,
  CurrentMatchData, TournamentProgress,
  CurrentMatchContestant,
  contestants, tournaments, matches, pointHistory, imageCache, users
} from '@shared/schema';
import { type User, type InsertUser } from "@shared/schema";
import { IStorage } from './storage';

export class DbStorage implements IStorage {
  // User methods (from template)
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Contestant methods
  async getAllContestants(): Promise<Contestant[]> {
    return db.select().from(contestants);
  }

  async getActiveContestants(): Promise<Contestant[]> {
    return db.select()
      .from(contestants)
      .where(and(eq(contestants.active, true), sql`${contestants.points} > 0`));
  }

  async getContestantById(id: number): Promise<Contestant | undefined> {
    const result = await db.select().from(contestants).where(eq(contestants.id, id)).limit(1);
    return result[0];
  }

  async createContestant(insertContestant: InsertContestant): Promise<Contestant> {
    const result = await db.insert(contestants).values(insertContestant).returning();
    return result[0];
  }

  async updateContestant(id: number, contestantUpdate: Partial<Contestant>): Promise<Contestant> {
    const result = await db.update(contestants)
      .set(contestantUpdate)
      .where(eq(contestants.id, id))
      .returning();
    return result[0];
  }

  async getTopContestantsByPoints(limit: number): Promise<Contestant[]> {
    return db.select().from(contestants)
      .orderBy(desc(contestants.points))
      .limit(limit);
  }

  async getTopContestantsByTournamentPoints(limit: number): Promise<Contestant[]> {
    return db.select().from(contestants)
      .orderBy(desc(contestants.tournamentPoints))
      .limit(limit);
  }

  // Tournament methods
  async getCurrentTournament(): Promise<Tournament | undefined> {
    const result = await db.select().from(tournaments)
      .where(eq(tournaments.completed, false))
      .orderBy(desc(tournaments.id))
      .limit(1);
    return result[0];
  }

  async getTournamentById(id: number): Promise<Tournament | undefined> {
    const result = await db.select().from(tournaments).where(eq(tournaments.id, id)).limit(1);
    return result[0];
  }

  async getAllTournaments(): Promise<Tournament[]> {
    return db.select().from(tournaments).orderBy(desc(tournaments.id));
  }

  async createTournament(insertTournament: InsertTournament): Promise<Tournament> {
    const result = await db.insert(tournaments).values(insertTournament).returning();
    return result[0];
  }

  async updateTournament(id: number, tournamentUpdate: Partial<Tournament>): Promise<Tournament> {
    const result = await db.update(tournaments)
      .set(tournamentUpdate)
      .where(eq(tournaments.id, id))
      .returning();
    return result[0];
  }

  // Match methods
  async getMatchById(id: number): Promise<Match | undefined> {
    const result = await db.select().from(matches).where(eq(matches.id, id)).limit(1);
    return result[0];
  }

  async getMatchesByTournament(tournamentId: number): Promise<Match[]> {
    return db.select().from(matches)
      .where(eq(matches.tournamentId, tournamentId))
      .orderBy(asc(matches.round), asc(matches.matchNumber));
  }

  async getMatchesByRound(tournamentId: number, round: number): Promise<Match[]> {
    return db.select().from(matches)
      .where(and(
        eq(matches.tournamentId, tournamentId),
        eq(matches.round, round)
      ))
      .orderBy(asc(matches.matchNumber));
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const result = await db.insert(matches).values(insertMatch).returning();
    return result[0];
  }

  async updateMatch(id: number, matchUpdate: Partial<Match>): Promise<Match> {
    const result = await db.update(matches)
      .set(matchUpdate)
      .where(eq(matches.id, id))
      .returning();
    return result[0];
  }

  async getCurrentMatch(): Promise<Match | undefined> {
    // Garantir que a conexão com o banco de dados está ativa
    await ensureConnection();
    
    // Obter o torneio atual
    const tournament = await this.getCurrentTournament();
    if (!tournament) {
      console.log("Não há torneio ativo para obter a partida atual");
      return undefined;
    }
    
    // Obter a partida atual com base no torneio atual
    // (sem filtrar por completed para garantir que encontramos a partida correta)
    const result = await db.select().from(matches)
      .where(and(
        eq(matches.tournamentId, tournament.id),
        eq(matches.round, tournament.currentRound),
        eq(matches.matchNumber, tournament.currentMatch)
      ))
      .limit(1);
    
    if (result.length === 0) {
      console.log("Partida atual não encontrada para torneio ID:", tournament.id, 
                 "rodada:", tournament.currentRound, 
                 "partida:", tournament.currentMatch);
      return undefined;
    }
    
    return result[0];
  }

  // Point history methods
  async getPointHistoryByContestant(contestantId: number, limit?: number): Promise<PointHistory[]> {
    // Garantir que a conexão com o banco de dados está ativa
    await ensureConnection();
    
    let query = db.select().from(pointHistory)
      .where(eq(pointHistory.contestantId, contestantId))
      .orderBy(desc(pointHistory.createdAt));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return query;
  }

  async createPointHistory(insertPointHistory: InsertPointHistory): Promise<PointHistory> {
    const result = await db.insert(pointHistory).values(insertPointHistory).returning();
    return result[0];
  }

  async getTopContestantsPointHistory(contestantIds: number[], limit?: number): Promise<Record<number, PointHistory[]>> {
    const result: Record<number, PointHistory[]> = {};
    
    // Inicializar o resultado com arrays vazios para cada ID
    for (const id of contestantIds) {
      result[id] = [];
    }
    
    // Buscar histórico de pontos para todos os IDs
    const history = await db.select()
      .from(pointHistory)
      .where(inArray(pointHistory.contestantId, contestantIds))
      .orderBy(desc(pointHistory.createdAt));
    
    // Agrupar por ID do competidor
    for (const entry of history) {
      if (!result[entry.contestantId]) {
        result[entry.contestantId] = [];
      }
      
      if (limit && result[entry.contestantId].length >= limit) {
        continue;
      }
      
      result[entry.contestantId].push(entry);
    }
    
    return result;
  }

  // Image cache methods
  async getImageCache(contestantId: number): Promise<ImageCache | undefined> {
    const result = await db.select().from(imageCache)
      .where(eq(imageCache.contestantId, contestantId))
      .limit(1);
    return result[0];
  }

  async createImageCache(insertImageCache: InsertImageCache): Promise<ImageCache> {
    // Primeiro, verificar se já existe um cache para esta contestante
    const existing = await this.getImageCache(insertImageCache.contestantId);
    
    if (existing) {
      // Atualizar o cache existente
      const result = await db.update(imageCache)
        .set({
          imageUrls: insertImageCache.imageUrls,
          createdAt: insertImageCache.createdAt || new Date()
        })
        .where(eq(imageCache.id, existing.id))
        .returning();
      return result[0];
    } else {
      // Criar novo cache
      const result = await db.insert(imageCache).values(insertImageCache).returning();
      return result[0];
    }
  }

  // Tournament initialization and management methods
  async initializeNewTournament(): Promise<Tournament> {
    // Garantir que a conexão com o banco de dados está ativa
    await ensureConnection();
    
    console.log("==================================================");
    console.log("INICIANDO NOVO TORNEIO - VERSÃO PERSISTENTE (DB)");
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
      console.log('APLICANDO REGRAS DE CONTINUIDADE DO TORNEIO - PERSISTENTE');
      
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
        const contestant = await this.getContestantById(winnerId);
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
        const losersWithPoints = await Promise.all(
          firstRoundLoserIds.map(async id => await this.getContestantById(id))
        );
        
        const eligibleLosers = losersWithPoints
          .filter(c => c && c.points > 0) as Contestant[];
        
        // Selecionar aleatoriamente entre as perdedoras
        const randomLosers = this.getRandomElements(eligibleLosers, slotsAfterNewContestants);
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
    
    // Create matches for round 1 (32 matches)
    const activeContestants = await this.getActiveContestants();
    const shuffledContestants = this.shuffleArray([...activeContestants]);
    
    for (let i = 0; i < 32; i++) {
      const contestant1 = shuffledContestants[i * 2];
      const contestant2 = shuffledContestants[i * 2 + 1];
      
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
    // Garantir que a conexão com o banco de dados está ativa
    await ensureConnection();
    
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
      matches: loser.matches +
 1,
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
              console.error(`Erro: partidas sem vencedores definidos!`);
              continue;
            }
            
            // Create a match between the winners
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
          
          // Update tournament current round and match
          await this.updateTournament(tournament.id, {
            currentRound: nextRound,
            currentMatch: 1 // Start with the first match in the next round
          });
          
          console.log(`Criadas ${matchesInRound} partidas para a rodada ${nextRound}`);
        }
      } else {
        // If not all matches are completed, move to the next match in this round
        const nextMatchNumber = match.matchNumber + 1;
        const nextMatch = roundMatches.find(m => m.matchNumber === nextMatchNumber && !m.completed);
        
        if (nextMatch) {
          // Move to the next match
          await this.updateTournament(tournament.id, {
            currentMatch: nextMatchNumber
          });
          
          console.log(`Avançando para a próxima partida: Rodada ${match.round}, Partida ${nextMatchNumber}`);
        } else {
          // Something went wrong, some matches are not completed but we can't find the next match
          console.error(`Erro: não foi possível encontrar a próxima partida incompleta na rodada ${match.round}`);
        }
      }
    }
  }

  async advanceToNextMatch(): Promise<Match | undefined> {
    // Garantir que a conexão com o banco de dados está ativa
    await ensureConnection();
    
    const currentTournament = await this.getCurrentTournament();
    if (!currentTournament) {
      console.log("Nenhum torneio ativo para avançar");
      return undefined;
    }
    
    const currentMatch = await this.getCurrentMatch();
    if (!currentMatch) {
      console.log("Nenhuma partida atual para avançar");
      return undefined;
    }
    
    // Get all matches in the current round
    const roundMatches = await this.getMatchesByRound(currentTournament.id, currentTournament.currentRound);
    
    // Find the current match index
    const currentMatchIndex = roundMatches.findIndex(m => m.matchNumber === currentTournament.currentMatch);
    
    if (currentMatchIndex >= 0 && currentMatchIndex < roundMatches.length - 1) {
      // Move to the next match in this round
      const nextMatchNumber = roundMatches[currentMatchIndex + 1].matchNumber;
      
      await this.updateTournament(currentTournament.id, {
        currentMatch: nextMatchNumber
      });
      
      console.log(`Avançando para a próxima partida: Rodada ${currentTournament.currentRound}, Partida ${nextMatchNumber}`);
      
      return this.getCurrentMatch();
    } else if (currentTournament.currentRound < 6) {
      // Move to the first match of the next round
      const nextRound = currentTournament.currentRound + 1;
      
      // Check if there are matches in the next round
      const nextRoundMatches = await this.getMatchesByRound(currentTournament.id, nextRound);
      
      if (nextRoundMatches.length > 0) {
        await this.updateTournament(currentTournament.id, {
          currentRound: nextRound,
          currentMatch: 1
        });
        
        console.log(`Avançando para a próxima rodada: Rodada ${nextRound}, Partida 1`);
        
        return this.getCurrentMatch();
      }
    }
    
    console.log("Não há mais partidas para avançar neste torneio");
    return undefined;
  }

  // Tournament data retrieval
  async getTournamentBracket(tournamentId: number): Promise<TournamentBracket> {
    // Garantir que a conexão com o banco de dados está ativa
    await ensureConnection();
    
    // First, get all matches for the tournament
    const tournamentMatches = await this.getMatchesByTournament(tournamentId);
    
    // Group matches by round
    const rounds: Map<number, BracketMatch[]> = new Map();
    
    for (const match of tournamentMatches) {
      // Get contestants
      const contestant1 = match.contestant1Id ? await this.getContestantById(match.contestant1Id) : null;
      const contestant2 = match.contestant2Id ? await this.getContestantById(match.contestant2Id) : null;
      const winner = match.winnerId ? await this.getContestantById(match.winnerId) : null;
      
      // Create bracket match
      const bracketMatch: BracketMatch = {
        id: match.id,
        round: match.round,
        matchNumber: match.matchNumber,
        contestant1: contestant1 || null,
        contestant2: contestant2 || null,
        winner: winner || null,
        completed: match.completed
      };
      
      // Add to rounds
      if (!rounds.has(match.round)) {
        rounds.set(match.round, []);
      }
      
      rounds.get(match.round)?.push(bracketMatch);
    }
    
    // Create bracket
    const bracket: TournamentBracket = {
      rounds: []
    };
    
    // Round names
    const roundNames = [
      "First Round", // 1
      "Second Round", // 2
      "Quarter-Finals", // 3
      "Semi-Finals", // 4
      "Finals" // 5
    ];
    
    // Add rounds to bracket
    for (const [roundNumber, matches] of rounds.entries()) {
      // Special handling for round 6 (contains both bronze match and final)
      if (roundNumber === 6) {
        // Bronze match
        const bronzeMatch = matches.find(m => m.matchNumber === 1);
        if (bronzeMatch) {
          bracket.rounds.push({
            round: 6,
            name: "Bronze Medal Match",
            matches: [bronzeMatch]
          });
        }
        
        // Final match
        const finalMatch = matches.find(m => m.matchNumber === 2);
        if (finalMatch) {
          bracket.rounds.push({
            round: 6,
            name: "Gold Medal Match",
            matches: [finalMatch]
          });
        }
      } else {
        // Regular rounds
        bracket.rounds.push({
          round: roundNumber,
          name: roundNames[roundNumber - 1] || `Round ${roundNumber}`,
          matches: matches.sort((a, b) => a.matchNumber - b.matchNumber)
        });
      }
    }
    
    return bracket;
  }

  async getCurrentMatchData(): Promise<CurrentMatchData | undefined> {
    // Garantir que a conexão com o banco de dados está ativa
    await ensureConnection();
    
    // Obter o torneio atual
    const tournament = await this.getCurrentTournament();
    if (!tournament) {
      console.log("Não há torneio ativo para obter a partida atual");
      return undefined;
    }
    
    // Verificar se o current_match do torneio é um ID ou um match_number
    let match;
    
    // Primeiro, tentar buscar por ID
    const matchById = await this.getMatchById(tournament.currentMatch);
    if (matchById) {
      console.log(`Partida encontrada pelo ID ${tournament.currentMatch}`);
      match = matchById;
    } else {
      // Se não encontrou por ID, buscar por round/match_number
      const result = await db.select().from(matches)
        .where(and(
          eq(matches.tournamentId, tournament.id),
          eq(matches.round, tournament.currentRound),
          eq(matches.matchNumber, tournament.currentMatch)
        ))
        .limit(1);
      
      match = result[0];
    }
    
    if (!match) {
      console.log("Partida atual não encontrada para torneio ID:", tournament.id, 
                 "rodada:", tournament.currentRound, 
                 "partida:", tournament.currentMatch);
      return undefined;
    }
    
    const contestant1 = await this.getContestantById(match.contestant1Id);
    const contestant2 = await this.getContestantById(match.contestant2Id);
    
    if (!contestant1 || !contestant2) {
      console.log("Uma ou ambas as competidoras não foram encontradas:", 
                 match.contestant1Id, match.contestant2Id);
      return undefined;
    }
    
    // Get cached images for contestants
    const images1 = await this.getImageCache(contestant1.id);
    const images2 = await this.getImageCache(contestant2.id);
    
    // Get round name
    const roundNames = [
      "First Round", // 1
      "Second Round", // 2
      "Quarter-Finals", // 3
      "Semi-Finals", // 4
      "Finals" // 5
    ];
    
    // Special handling for round 6
    let roundName = roundNames[match.round - 1] || `Round ${match.round}`;
    
    if (match.round === 6) {
      if (match.matchNumber === 1) {
        roundName = "Bronze Medal Match";
      } else if (match.matchNumber === 2) {
        roundName = "Gold Medal Match";
      }
    }
    
    // Get top contestants for ranking
    const topContestants = await this.getTopContestantsByPoints(100);
    
    // Find rank of each contestant
    const rank1 = topContestants.findIndex(c => c.id === contestant1.id) + 1;
    const rank2 = topContestants.findIndex(c => c.id === contestant2.id) + 1;
    
    return {
      matchId: match.id,
      contestant1: {
        id: contestant1.id,
        name: contestant1.name,
        nationality: contestant1.nationality,
        points: contestant1.points,
        imageUrls: images1?.imageUrls || [],
        rank: rank1 > 0 ? rank1 : undefined
      },
      contestant2: {
        id: contestant2.id,
        name: contestant2.name,
        nationality: contestant2.nationality,
        points: contestant2.points,
        imageUrls: images2?.imageUrls || [],
        rank: rank2 > 0 ? rank2 : undefined
      },
      round: match.round,
      matchNumber: match.matchNumber,
      roundName
    };
  }

  async getTournamentProgress(tournamentId: number): Promise<TournamentProgress> {
    // Garantir que a conexão com o banco de dados está ativa
    await ensureConnection();
    
    const tournament = await this.getTournamentById(tournamentId);
    if (!tournament) {
      throw new Error(`Tournament with id ${tournamentId} not found`);
    }
    
    // Get all matches for the tournament
    const tournamentMatches = await this.getMatchesByTournament(tournamentId);
    
    // Count completed matches
    const completedMatches = tournamentMatches.filter(m => m.completed).length;
    
    // Calcular o número total esperado de partidas para um torneio de 64 participantes
    // São 64 partidas no total: 32 (primeira rodada) + 16 (segunda rodada) + 8 (quartas) + 4 (semi) + 
    // 2 (disputa pelo 3º e final) + 2 (disputa pelo 3º lugar e final)
    const expectedMatches = 64;
    
    // Get round name
    const roundNames = [
      "First Round", // 1
      "Second Round", // 2
      "Quarter-Finals", // 3
      "Semi-Finals", // 4
      "Finals" // 5
    ];
    
    // Special handling for round 6
    let roundName = roundNames[tournament.currentRound - 1] || `Round ${tournament.currentRound}`;
    
    if (tournament.currentRound === 6) {
      if (tournament.currentMatch === 1) {
        roundName = "Bronze Medal Match";
      } else if (tournament.currentMatch === 2) {
        roundName = "Gold Medal Match";
      }
    }
    
    // Obter o número da partida real (não o ID)
    let currentMatchNumber = tournament.currentMatch;
    
    // Se o torneio.currentMatch é um ID de partida (maior que o número de partidas em uma rodada)
    // então precisamos obter o match_number correspondente
    const currentMatchById = await this.getMatchById(tournament.currentMatch);
    if (currentMatchById) {
      currentMatchNumber = currentMatchById.matchNumber;
      console.log(`Corrigindo exibição do número da partida: ID ${tournament.currentMatch} -> match_number ${currentMatchNumber}`);
    }
    
    return {
      totalMatches: expectedMatches, // Usamos o valor fixo de 64 partidas
      completedMatches,
      currentRound: tournament.currentRound,
      currentMatch: currentMatchNumber, // Usamos o match_number real, não o ID
      roundName,
      percentComplete: Math.floor((completedMatches / expectedMatches) * 100)
    };
  }

  // Private helper methods
  private async assignTournamentPoints(tournamentId: number): Promise<void> {
    // Garantir que a conexão com o banco de dados está ativa
    await ensureConnection();
    
    const tournament = await this.getTournamentById(tournamentId);
    if (!tournament) return;
    
    if (!tournament.champion || !tournament.runnerUp || !tournament.thirdPlace) {
      console.error("Torneio incompleto, não é possível atribuir medalhas");
      return;
    }
    
    // Get all matches in the tournament
    const allMatches = await this.getMatchesByTournament(tournamentId);
    
    // Group contestants by the round they were eliminated in
    const eliminationRounds: Record<number, number[]> = {
      1: [], // First round losers
      2: [], // Second round losers
      3: [], // Quarter-final losers
      4: [], // Semi-final losers
      5: [], // Finalist (silver)
      6: [], // Champion (gold)
      7: []  // Bronze medal
    };
    
    // Champion gets gold medal
    const champion = await this.getContestantById(tournament.champion);
    if (champion) {
      await this.updateContestant(champion.id, {
        goldMedals: champion.goldMedals + 1,
        tournamentPoints: champion.tournamentPoints + TOURNAMENT_POINTS.CHAMPION
      });
      eliminationRounds[6].push(champion.id);
    }
    
    // Runner-up gets silver medal
    const runnerUp = await this.getContestantById(tournament.runnerUp);
    if (runnerUp) {
      await this.updateContestant(runnerUp.id, {
        silverMedals: runnerUp.silverMedals + 1,
        tournamentPoints: runnerUp.tournamentPoints + TOURNAMENT_POINTS.RUNNER_UP
      });
      eliminationRounds[5].push(runnerUp.id);
    }
    
    // Third place gets bronze medal and points
    const thirdPlace = await this.getContestantById(tournament.thirdPlace);
    if (thirdPlace) {
      eliminationRounds[7].push(thirdPlace.id);
      // Bronze medal is already assigned when the bronze match is completed
    }
    
    // Process each round to find losers
    for (let round = 1; round <= 5; round++) {
      const matchesInRound = allMatches.filter(m => m.round === round);
      
      for (const match of matchesInRound) {
        if (match.completed && match.winnerId) {
          // Get the loser of this match
          const loserId = match.contestant1Id === match.winnerId 
            ? match.contestant2Id 
            : match.contestant1Id;
          
          // Skip if the loser is the 4th place (bronze match loser)
          if (round === 5 && eliminationRounds[7].includes(match.winnerId)) {
            continue;
          }
          
          // Add to the appropriate elimination round
          eliminationRounds[round].push(loserId);
          
          // Award tournament points based on round elimination
          const loser = await this.getContestantById(loserId);
          if (loser) {
            let pointsToAdd = 0;
            
            switch (round) {
              case 1:
                pointsToAdd = TOURNAMENT_POINTS.THIRTYTHIRD_SIXTYFOURTH;
                break;
              case 2:
                pointsToAdd = TOURNAMENT_POINTS.SEVENTEENTH_THIRTYSECOND;
                break;
              case 3:
                pointsToAdd = TOURNAMENT_POINTS.NINTH_SIXTEENTH;
                break;
              case 4:
                pointsToAdd = TOURNAMENT_POINTS.FIFTH_EIGHTH;
                break;
              // Round 5 losers are the 4th place, already handled separately
            }
            
            if (pointsToAdd > 0) {
              await this.updateContestant(loserId, {
                tournamentPoints: loser.tournamentPoints + pointsToAdd
              });
            }
          }
        }
      }
    }
    
    console.log("Pontos do torneio atribuídos:");
    console.log(`- Campeã (${tournament.champion}): ${TOURNAMENT_POINTS.CHAMPION} pontos`);
    console.log(`- Vice-campeã (${tournament.runnerUp}): ${TOURNAMENT_POINTS.RUNNER_UP} pontos`);
    console.log(`- 3º lugar (${tournament.thirdPlace}): ${TOURNAMENT_POINTS.THIRD_PLACE} pontos`);
    console.log(`- 4º lugar: ${TOURNAMENT_POINTS.FOURTH_PLACE} pontos`);
    console.log(`- 5º-8º: ${TOURNAMENT_POINTS.FIFTH_EIGHTH} pontos (${eliminationRounds[4].length} contestantes)`);
    console.log(`- 9º-16º: ${TOURNAMENT_POINTS.NINTH_SIXTEENTH} pontos (${eliminationRounds[3].length} contestantes)`);
    console.log(`- 17º-32º: ${TOURNAMENT_POINTS.SEVENTEENTH_THIRTYSECOND} pontos (${eliminationRounds[2].length} contestantes)`);
    console.log(`- 33º-64º: ${TOURNAMENT_POINTS.THIRTYTHIRD_SIXTYFOURTH} pontos (${eliminationRounds[1].length} contestantes)`);
  }

  private getRandomElements<T>(array: T[], count: number): T[] {
    if (count >= array.length) return [...array];
    
    const shuffled = this.shuffleArray([...array]);
    return shuffled.slice(0, count);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}