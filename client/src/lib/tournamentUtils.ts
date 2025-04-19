import { Match, Contestant, Tournament, TournamentProgress } from "./types";
import { ROUND_NAMES, STATUS_COLORS } from "./constants";

// Get the current round of a tournament based on matches
export function getCurrentRound(matches: Match[]): number {
  const incompleteMatches = matches.filter(match => !match.completed);
  if (incompleteMatches.length === 0) return 6; // Finals (all matches complete)
  
  return incompleteMatches.reduce((min, match) => 
    match.round < min ? match.round : min, 
    6
  );
}

// Get tournament progress information
export function getTournamentProgress(matches: Match[]): TournamentProgress[] {
  const progress: TournamentProgress[] = [];
  
  // Calculate matches per round (32, 16, 8, 4, 2, 1, 1)
  const matchesPerRound = [32, 16, 8, 4, 2, 1, 1];
  
  for (let i = 0; i < ROUND_NAMES.length; i++) {
    const roundMatches = matches.filter(match => match.round === i + 1);
    const completedMatches = roundMatches.filter(match => match.completed);
    
    let status: 'Pending' | 'In Progress' | 'Completed' = 'Pending';
    
    if (completedMatches.length === matchesPerRound[i]) {
      status = 'Completed';
    } else if (completedMatches.length > 0) {
      status = 'In Progress';
    } else if (i > 0) {
      // If previous round is not completed, this round is pending
      const prevRoundCompleted = progress[i - 1]?.status === 'Completed';
      if (!prevRoundCompleted) {
        status = 'Pending';
      } else {
        status = 'In Progress';
      }
    } else if (roundMatches.length > 0) {
      // First round
      status = 'In Progress';
    }
    
    progress.push({
      round: i + 1,
      name: ROUND_NAMES[i],
      totalMatches: matchesPerRound[i],
      completedMatches: completedMatches.length,
      status
    });
  }
  
  return progress;
}

// Get the status class based on status
export function getStatusClass(status: 'Pending' | 'In Progress' | 'Completed'): string {
  switch (status) {
    case 'Completed':
      return STATUS_COLORS.COMPLETED;
    case 'In Progress':
      return STATUS_COLORS.IN_PROGRESS;
    case 'Pending':
      return STATUS_COLORS.PENDING;
    default:
      return '';
  }
}

// Format win percentage
export function formatWinPercentage(wins: number, matches: number): string {
  if (matches === 0) return '0.0%';
  return ((wins / matches) * 100).toFixed(1) + '%';
}

// Calculate tournament bracket data
export function calculateBracketData(matches: Match[], contestants: Contestant[]): any {
  const rounds = [];
  
  for (let i = 0; i < ROUND_NAMES.length; i++) {
    const roundMatches = matches
      .filter(match => match.round === i + 1)
      .sort((a, b) => a.matchNumber - b.matchNumber);
    
    const enrichedMatches = roundMatches.map(match => {
      const contestant1 = contestants.find(c => c.id === match.contestant1Id);
      const contestant2 = contestants.find(c => c.id === match.contestant2Id);
      const winner = match.winnerId 
        ? contestants.find(c => c.id === match.winnerId) 
        : undefined;
      
      return {
        ...match,
        contestant1,
        contestant2,
        winner
      };
    });
    
    rounds.push({
      name: ROUND_NAMES[i],
      matches: enrichedMatches
    });
  }
  
  return { rounds };
}

// Get seed number based on match info
export function getSeedNumber(round: number, matchNumber: number, isContestant1: boolean): number {
  if (round === 1) {
    // First round is straightforward
    return matchNumber * 2 - (isContestant1 ? 1 : 0);
  }
  
  // For other rounds, it's more complex and depends on the tournament structure
  // This is a simplified calculation
  return 0;
}

// Calculate which round a contestant reached in a tournament
export function getContestantHighestRound(matches: Match[], contestantId: number): number {
  let highestRound = 0;
  
  for (const match of matches) {
    if ((match.contestant1Id === contestantId || match.contestant2Id === contestantId) && 
        match.round > highestRound) {
      highestRound = match.round;
      
      // If they lost this match, this is their highest round
      if (match.completed && match.winnerId !== contestantId) {
        return highestRound;
      }
    }
  }
  
  return highestRound;
}

// Get position based on highest round reached
export function getPositionFromRound(round: number, isWinner: boolean): number {
  switch (round) {
    case 6: // Finals
      return isWinner ? 1 : 2;
    case 7: // 3rd place match
      return isWinner ? 3 : 4;
    case 5: // Semifinals
      return isWinner ? 0 : 3; // Winners go to finals, losers to 3rd place match
    case 4: // Quarterfinals
      return 5; // 5th-8th position
    case 3: // Round of 16
      return 9; // 9th-16th position
    case 2: // Round of 32
      return 17; // 17th-32nd position
    case 1: // Round of 64
      return 33; // 33rd-64th position
    default:
      return 0;
  }
}

// Get points for a position
export function getPointsForPosition(position: number): number {
  if (position === 1) return 50;
  if (position === 2) return 40;
  if (position === 3) return 35;
  if (position === 4) return 30;
  if (position >= 5 && position <= 8) return 25;
  if (position >= 9 && position <= 16) return 20;
  if (position >= 17 && position <= 32) return 15;
  if (position >= 33 && position <= 64) return 10;
  return 0;
}

// Calculate contestants for a new tournament
export function calculateNewTournamentContestants(
  currentTournament: Tournament,
  matches: Match[],
  allContestants: Contestant[]
): Contestant[] {
  // Get matches from first round
  const firstRoundMatches = matches.filter(m => m.round === 1);
  
  // Get contestants who won in the first round
  const advancedContestantIds = firstRoundMatches
    .filter(m => m.completed && m.winnerId)
    .map(m => m.winnerId!);
  
  // Get contestants who lost in the first round
  const eliminatedContestantIds = firstRoundMatches
    .filter(m => m.completed && m.winnerId)
    .map(m => 
      m.contestant1Id === m.winnerId ? m.contestant2Id : m.contestant1Id
    );
  
  // Get 32 new contestants who haven't participated
  const newContestants = allContestants
    .filter(c => 
      !advancedContestantIds.includes(c.id) && 
      !eliminatedContestantIds.includes(c.id) &&
      c.totalMatches === 0
    )
    .slice(0, 32);
  
  // Get advanced contestants
  const advancedContestants = allContestants.filter(c => 
    advancedContestantIds.includes(c.id)
  );
  
  // Combine advanced and new contestants
  return [...advancedContestants, ...newContestants];
}
