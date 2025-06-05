import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getGeneralStats, getTournamentHistory } from "@/lib/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function StatisticsView() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats/general"],
    queryFn: getGeneralStats,
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/tournament/history"],
    queryFn: getTournamentHistory,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyWithMatches, setShowOnlyWithMatches] = useState(true);

  const statistics = statsData?.data || [];
  const tournaments = historyData?.data || [];

  // Filter statistics to show only contestants who have participated in matches
  const filteredStatistics = statistics
    .filter(contestant => 
      // Filter by search term (case insensitive)
      contestant.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      // Filter by whether they have participated in matches
      (!showOnlyWithMatches || contestant.matches > 0)
    );

  return (
    <div id="statsView">
      <Card className="mb-8">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
          <CardTitle>Contestant Statistics</CardTitle>
          <div className="flex flex-col md:flex-row gap-2 mt-2 md:mt-0">
            <Input
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Button
              variant={showOnlyWithMatches ? "default" : "outline"}
              onClick={() => setShowOnlyWithMatches(!showOnlyWithMatches)}
              size="sm"
            >
              {showOnlyWithMatches ? "Showing Active" : "Showing All"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
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
                    <th className="pb-2 pr-4">Matches</th>
                    <th className="pb-2 pr-4">Wins</th>
                    <th className="pb-2 pr-4">Losses</th>
                    <th className="pb-2 pr-4">Win Rate</th>
                    <th className="pb-2 pr-4">Gold</th>
                    <th className="pb-2 pr-4">Silver</th>
                    <th className="pb-2 pr-4">Bronze</th>
                    <th className="pb-2">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStatistics.map((contestant, index) => {
                    const winRate = contestant.matches > 0
                      ? Math.round((contestant.wins / contestant.matches) * 100)
                      : 0;
                    
                    return (
                      <tr key={contestant.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 pr-4 font-mono">#{index + 1}</td>
                        <td className="py-3 pr-4 font-medium">{contestant.name}</td>
                        <td className="py-3 pr-4 font-mono">{contestant.matches}</td>
                        <td className="py-3 pr-4 font-mono">{contestant.wins}</td>
                        <td className="py-3 pr-4 font-mono">{contestant.losses}</td>
                        <td className="py-3 pr-4 font-mono">{winRate}%</td>
                        <td className="py-3 pr-4 font-mono">{contestant.goldMedals}</td>
                        <td className="py-3 pr-4 font-mono">{contestant.silverMedals}</td>
                        <td className="py-3 pr-4 font-mono">{contestant.bronzeMedals}</td>
                        <td className="py-3 font-mono">{contestant.points}</td>
                      </tr>
                    );
                  })}
                  
                  {filteredStatistics.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-gray-500">
                        {searchTerm ? "No contestants match your search" : "No contestants have participated in matches yet"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="mt-4 text-sm text-gray-500 text-right">
                Showing {filteredStatistics.length} contestants
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tournament History</CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {tournaments.filter(t => t.completed).map((tournament) => (
                <div key={tournament.id} className="border rounded-md p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium">Tournament #{tournament.id}</h3>
                    <span className="text-sm text-textSecondary">
                      Completed on {new Date(tournament.endDate || "").toLocaleDateString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-md p-3 bg-yellow-50">
                      <p className="text-sm text-textSecondary mb-1">Champion</p>
                      <p className="font-medium">{tournament.champion?.name || "Unknown"}</p>
                    </div>
                    <div className="border rounded-md p-3 bg-gray-50">
                      <p className="text-sm text-textSecondary mb-1">Runner-up</p>
                      <p className="font-medium">{tournament.runnerUp?.name || "Unknown"}</p>
                    </div>
                    <div className="border rounded-md p-3 bg-amber-50">
                      <p className="text-sm text-textSecondary mb-1">Third Place</p>
                      <p className="font-medium">{tournament.thirdPlace?.name || "Unknown"}</p>
                    </div>
                  </div>
                </div>
              ))}

              {tournaments.filter(t => t.completed).length === 0 && (
                <p className="text-center py-4 text-textSecondary">
                  No completed tournaments yet. Finish a tournament to see its results here.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
