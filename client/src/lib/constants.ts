// Constants used in the tournament application

// Round names for tournament bracket
export const ROUND_NAMES = [
  'Round of 64',
  'Round of 32',
  'Round of 16',
  'Quarter Finals',
  'Semi Finals',
  'Finals',
  '3rd Place Match'
];

// Points awarded for tournament positions
export const TOURNAMENT_POINTS = {
  CHAMPION: 50,    // 1st place (Gold medal)
  RUNNER_UP: 40,   // 2nd place (Silver medal)
  THIRD_PLACE: 35,    // 3rd place (Bronze medal)
  FOURTH_PLACE: 30,   // 4th place
  FIFTH_EIGHTH: 25, // 5th-8th place (Quarter-finals losers)
  NINTH_SIXTEENTH: 20, // 9th-16th place (Round of 16 losers)
  SEVENTEENTH_THIRTYSECOND: 15, // 17th-32nd place (Round of 32 losers)
  THIRTYTHIRD_SIXTYFOURTH: 10  // 33rd-64th place (Round of 64 losers)
};

// Number of participants in the tournament
export const TOTAL_PARTICIPANTS = 64;

// Colors for charts
export const CHART_COLORS = [
  '#8B5CF6',  // Primary (purple)
  '#EC4899',  // Secondary (pink)
  '#F59E0B',  // Accent (amber)
  '#10B981',  // Success (green)
  '#3B82F6',  // Blue
  '#14B8A6',  // Teal
  '#EF4444',  // Red
  '#A78BFA'   // Light purple
];

// Status colors for tournament progress
export const STATUS_COLORS = {
  COMPLETED: 'text-green-500',
  IN_PROGRESS: 'text-yellow-500',
  PENDING: 'text-gray-400'
};

// Tabs for the main application
export const TABS = [
  { id: 'current-match', label: 'Current Match', icon: 'gamepad' },
  { id: 'tournament-bracket', label: 'Tournament Bracket', icon: 'sitemap' },
  { id: 'leaderboard', label: 'Leaderboard', icon: 'medal' },
  { id: 'ranking', label: 'Point Ranking', icon: 'list-ol' },
  { id: 'statistics', label: 'Statistics', icon: 'chart-bar' }
];

// Default starting points for contestants
export const DEFAULT_POINTS = 1000;

// Points exchange percentage in matches
export const POINTS_EXCHANGE_PERCENTAGE = 0.1;  // 10%
