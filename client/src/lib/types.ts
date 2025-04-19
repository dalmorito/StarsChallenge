// Client-side types for the tournament application

export interface Contestant {
  id: number;
  name: string;
  nationality?: string;
  points: number; // Nome do campo conforme usado no servidor
  currentPoints?: number; // Mantido por compatibilidade com código existente
  tournamentPoints: number;
  totalMatches?: number; // Pode ser chamado matches no servidor
  matches?: number; // Nome do campo conforme usado no servidor
  wins: number;
  losses: number;
  goldMedals: number;
  silverMedals: number;
  bronzeMedals: number;
  active: boolean;
}

export interface Tournament {
  id: number;
  completed: boolean;
  startedAt: string;
  completedAt: string | null;
}

export interface Match {
  id: number;
  tournamentId: number;
  round: number;
  matchNumber: number;
  contestant1Id: number;
  contestant2Id: number;
  winnerId: number | null;
  completed: boolean;
  contestant1?: Contestant;
  contestant2?: Contestant;
}

export interface TournamentResult {
  id: number;
  tournamentId: number;
  contestantId: number;
  position: number;
  pointsEarned: number;
  contestant?: Contestant;
}

export interface PointsHistory {
  id: number;
  tournamentId: number;
  matchId: number;
  contestantId: number;
  pointsChange: number;
  pointsAfter: number;
  createdAt: string;
}

export interface ContestantImages {
  images: string[];
}

export interface TournamentProgress {
  round: number;
  name: string;
  totalMatches: number;
  completedMatches: number;
  status: 'Pending' | 'In Progress' | 'Completed';
}

export interface TournamentBracketData {
  rounds: {
    name: string;
    matches: Match[];
  }[];
}

export interface LeaderboardEntry extends Contestant {
  tournamentCount?: number;
}

export interface PointsEvolutionData {
  contestant: Contestant;
  history: { tournament: number; points: number }[];
}

export interface WinLossData {
  contestant: Contestant;
  winPercentage: number;
}

export interface MedalDistributionData {
  contestant: Contestant;
  totalMedals: number;
}

export interface PerformanceTrendsData {
  contestant: Contestant;
  wins: number;
  tournamentPoints: number;
  rankingPoints: number;
  winPercentage: number;
  medals: number;
  matchCount: number;
}

export interface RecentPointChange {
  contestant: Contestant;
  opponent: Contestant;
  pointsChange: number;
}
