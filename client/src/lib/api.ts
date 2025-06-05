import { apiRequest } from "./queryClient";
import type { 
  Contestant, 
  Tournament, 
  Match, 
  TournamentBracket, 
  CurrentMatchData,
  TournamentProgress
} from "@shared/schema";

// API functions for tournaments
export async function initializeTournament() {
  const res = await apiRequest("POST", "/api/initialize");
  return res.json();
}

// Função para forçar a inicialização de um novo torneio (endpoint de teste)
export async function forceStartNewTournament() {
  const res = await apiRequest("POST", "/api/force-new-tournament");
  return res.json();
}

export async function getCurrentTournament() {
  const res = await apiRequest("GET", "/api/tournament/current");
  return res.json();
}

export async function getTournamentBracket() {
  const res = await apiRequest("GET", "/api/tournament/bracket");
  return res.json();
}

export async function getTournamentHistory() {
  const res = await apiRequest("GET", "/api/tournament/history");
  return res.json();
}

export async function getTournamentProgress() {
  const res = await apiRequest("GET", "/api/tournament-progress");
  return res.json();
}

// API functions for matches
export async function getCurrentMatch() {
  const res = await apiRequest("GET", "/api/current-match");
  return res.json();
}

export async function selectWinner(matchId: number, winnerId: number) {
  const res = await apiRequest("POST", "/api/select-winner", { matchId, winnerId });
  return res.json();
}

export async function advanceToNextMatch() {
  const res = await apiRequest("POST", "/api/next-match");
  return res.json();
}

export async function getMatch(id: number) {
  const res = await apiRequest("GET", `/api/matches/${id}`);
  return res.json();
}

// API functions for contestants
export async function getAllContestants() {
  const res = await apiRequest("GET", "/api/contestants");
  return res.json();
}

export async function getActiveContestants() {
  const res = await apiRequest("GET", "/api/contestants/active");
  return res.json();
}

export async function getContestantRanking(limit = 100) {
  const res = await apiRequest("GET", `/api/contestants/ranking?limit=${limit}`);
  return res.json();
}

export async function getTournamentRanking(limit = 100) {
  const res = await apiRequest("GET", `/api/contestants/tournament-ranking?limit=${limit}`);
  return res.json();
}

export async function getContestant(id: number) {
  const res = await apiRequest("GET", `/api/contestants/${id}`);
  return res.json();
}

export async function getContestantImages(id: number, source: 'gallery' | 'tournament' = 'tournament') {
  const res = await apiRequest("GET", `/api/contestants/${id}/images?source=${source}`);
  return res.json();
}

// API functions for stats
export async function getGeneralStats() {
  const res = await apiRequest("GET", "/api/stats/general");
  return res.json();
}

export async function getTopPerformersHistory(limit = 8) {
  const res = await apiRequest("GET", `/api/stats/top-performers-history?limit=${limit}`);
  return res.json();
}
