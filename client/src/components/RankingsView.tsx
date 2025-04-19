import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getTournamentRanking, getContestantRanking } from "@/lib/api";

export default function RankingsView() {
  const { data: tournamentRankingData, isLoading: tournamentLoading } = useQuery({
    queryKey: ["/api/contestants/tournament-ranking"],
    queryFn: () => getTournamentRanking(1000), // Mostrar todos
  });

  const { data: pointsRankingData, isLoading: pointsLoading } = useQuery({
    queryKey: ["/api/contestants/ranking"],
    queryFn: () => getContestantRanking(1000), // Mostrar todos
  });

  const tournamentStandings = tournamentRankingData?.data || [];
  const pointsRanking = pointsRankingData?.data || [];

  return (
    <div id="rankingsView">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tournament Standings */}
        <Card>
          <CardHeader>
            <CardTitle>Tournament Standings</CardTitle>
          </CardHeader>
          <CardContent>
            {tournamentLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="pb-2 pr-4">Rank</th>
                      <th className="pb-2 pr-4">Name</th>
                      <th className="pb-2 pr-4">Points</th>
                      <th className="pb-2">Medals</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournamentStandings.map((contestant, index) => (
                      <tr key={contestant.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 pr-4 font-mono">#{index + 1}</td>
                        <td className="py-3 pr-4 font-medium">{contestant.name}</td>
                        <td className="py-3 pr-4 font-mono">{contestant.tournamentPoints}</td>
                        <td className="py-3">
                          <div className="flex space-x-1">
                            <span className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-white text-xs">
                              {contestant.goldMedals}
                            </span>
                            <span className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs">
                              {contestant.silverMedals}
                            </span>
                            <span className="w-6 h-6 rounded-full bg-amber-600 flex items-center justify-center text-white text-xs">
                              {contestant.bronzeMedals}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Points Ranking */}
        <Card>
          <CardHeader>
            <CardTitle>Points Ranking</CardTitle>
          </CardHeader>
          <CardContent>
            {pointsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="pb-2 pr-4">Rank</th>
                      <th className="pb-2 pr-4">Name</th>
                      <th className="pb-2 pr-4">Points</th>
                      <th className="pb-2">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pointsRanking.map((contestant, index) => {
                      const winRate = contestant.matches > 0
                        ? Math.round((contestant.wins / contestant.matches) * 100)
                        : 0;
                      
                      return (
                        <tr key={contestant.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 pr-4 font-mono">#{index + 1}</td>
                          <td className="py-3 pr-4 font-medium">{contestant.name}</td>
                          <td className="py-3 pr-4 font-mono">{contestant.points}</td>
                          <td className="py-3 font-medium">
                            {winRate}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
