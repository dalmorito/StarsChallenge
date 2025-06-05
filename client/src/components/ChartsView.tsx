import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getTopPerformersHistory, getGeneralStats } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
         LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from "recharts";

const COLORS = [
  "#6200ee", // primary
  "#03dac6", // secondary
  "#4CAF50", // green
  "#9C27B0", // purple
  "#FF9800", // orange
  "#E91E63", // pink
  "#2196F3", // blue
  "#FFEB3B"  // yellow
];

export default function ChartsView() {
  const { data: performersData, isLoading: performersLoading } = useQuery({
    queryKey: ["/api/stats/top-performers-history"],
    queryFn: () => getTopPerformersHistory(8), // Top 8
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats/general"],
    queryFn: getGeneralStats,
  });

  const topPerformers = performersData?.data?.topPerformers || [];
  const pointHistory = performersData?.data?.pointHistory || {};
  const allStats = statsData?.data || [];

  // Prepare data for line chart
  const prepareLineChartData = () => {
    if (!topPerformers.length || !Object.keys(pointHistory).length) return [];

    // Create a merged dataset with entries for each time point
    const dataByContestant: Record<number, { name: string, points: number[] }> = {};
    
    // Initialize with all top performers
    topPerformers.forEach(performer => {
      dataByContestant[performer.id] = {
        name: performer.name,
        points: []
      };
    });
    
    // Add points history for each contestant
    Object.entries(pointHistory).forEach(([contestantId, history]) => {
      const id = parseInt(contestantId);
      if (dataByContestant[id]) {
        dataByContestant[id].points = history.map(entry => entry.points);
      }
    });
    
    // Convert to format needed for the line chart
    // For simplicity, we'll just use the last 10 data points
    const chartData = [];
    const maxDataPoints = 10;

    for (let i = 0; i < maxDataPoints; i++) {
      const dataPoint: Record<string, any> = { index: i };
      
      Object.values(dataByContestant).forEach(contestant => {
        if (contestant.points[i] !== undefined) {
          dataPoint[contestant.name] = contestant.points[i];
        }
      });
      
      chartData.push(dataPoint);
    }
    
    return chartData.reverse(); // Most recent data first
  };

  // Prepare data for bar chart (win rates)
  const prepareWinRateData = () => {
    return topPerformers.map(contestant => {
      const winRate = contestant.matches > 0
        ? Math.round((contestant.wins / contestant.matches) * 100)
        : 0;
      
      return {
        name: contestant.name.split(' ')[0], // First name only for brevity
        winRate
      };
    });
  };

  // Prepare data for pie chart (medal distribution)
  const prepareMedalData = () => {
    const medals = {
      gold: 0,
      silver: 0,
      bronze: 0
    };
    
    allStats.forEach(contestant => {
      medals.gold += contestant.goldMedals;
      medals.silver += contestant.silverMedals;
      medals.bronze += contestant.bronzeMedals;
    });
    
    return [
      { name: "Gold", value: medals.gold },
      { name: "Silver", value: medals.silver },
      { name: "Bronze", value: medals.bronze }
    ];
  };

  const lineChartData = prepareLineChartData();
  const winRateData = prepareWinRateData();
  const medalData = prepareMedalData();

  return (
    <div id="chartsView">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Performance Trends (Top 8)</CardTitle>
        </CardHeader>
        <CardContent>
          {performersLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : (
            <div className="h-80 border rounded-md p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="index" label={{ value: "Time", position: "insideBottom", offset: -5 }} />
                  <YAxis label={{ value: "Points", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Legend />
                  {topPerformers.map((performer, index) => (
                    <Line
                      key={performer.id}
                      type="monotone"
                      dataKey={performer.name}
                      stroke={COLORS[index % COLORS.length]}
                      activeDot={{ r: 8 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Win Rate Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64 border rounded-md p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={winRateData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: "Win Rate (%)", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Bar dataKey="winRate" fill="#6200ee" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Tournament Medal Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64 border rounded-md p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={medalData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {medalData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={
                          index === 0 ? "#FFD700" : // Gold
                          index === 1 ? "#C0C0C0" : // Silver
                          "#CD7F32"                 // Bronze
                        } />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
