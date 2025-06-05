import { useEffect, useRef } from "react";
import { Contestant } from "@/lib/types";
import { CHART_COLORS } from "@/lib/constants";
import { formatWinPercentage } from "@/lib/tournamentUtils";
import { Card } from "@/components/ui/card";
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface StatisticsChartsProps {
  contestants: Contestant[];
}

export function WinLossChart({ contestants }: StatisticsChartsProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || !contestants.length) return;

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    
    if (ctx) {
      // Take top 5 contestants by total matches
      const topContestants = [...contestants]
        .sort((a, b) => {
          const aMatches = typeof a.totalMatches !== 'undefined' ? a.totalMatches : a.matches || 0;
          const bMatches = typeof b.totalMatches !== 'undefined' ? b.totalMatches : b.matches || 0;
          return bMatches - aMatches;
        })
        .slice(0, 5);

      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: topContestants.map(c => c.name),
          datasets: [
            {
              label: 'Wins',
              data: topContestants.map(c => c.wins),
              backgroundColor: 'rgba(16, 185, 129, 0.6)',
              borderColor: 'rgba(16, 185, 129, 1)',
              borderWidth: 1
            },
            {
              label: 'Losses',
              data: topContestants.map(c => c.losses),
              backgroundColor: 'rgba(239, 68, 68, 0.6)',
              borderColor: 'rgba(239, 68, 68, 1)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: '#F8FAFC'
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                color: '#94A3B8'
              },
              grid: {
                color: 'rgba(148, 163, 184, 0.1)'
              }
            },
            x: {
              ticks: {
                color: '#94A3B8'
              },
              grid: {
                color: 'rgba(148, 163, 184, 0.1)'
              }
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [contestants]);

  return (
    <Card className="bg-dark p-4 rounded-lg shadow-md">
      <h3 className="font-bold text-lg mb-4">Win/Loss Distribution</h3>
      <div className="h-64">
        <canvas ref={chartRef}></canvas>
      </div>
      <div className="mt-4 text-center text-xs text-gray-400">
        Win/loss ratio distribution for top performers
      </div>
    </Card>
  );
}

export function PerformanceTrendsChart({ contestants }: StatisticsChartsProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || !contestants.length) return;

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    
    if (ctx) {
      // Take top 3 contestants by points
      const topContestants = [...contestants]
        .sort((a, b) => {
          const aPoints = a.points || a.currentPoints || 0;
          const bPoints = b.points || b.currentPoints || 0;
          return bPoints - aPoints;
        })
        .slice(0, 3);

      // Normalize data to 0-100 scale for radar chart
      const getMaxValue = (key: keyof Contestant) => {
        return Math.max(...contestants.map(c => typeof c[key] === 'number' ? Number(c[key]) : 0));
      };

      const normalize = (value: number, max: number) => {
        return max > 0 ? (value / max) * 100 : 0;
      };

      const maxWins = getMaxValue('wins');
      const maxTournamentPoints = getMaxValue('tournamentPoints');
      const maxCurrentPoints = getMaxValue('points');
      const maxMatches = Math.max(
        ...contestants.map(c => c.totalMatches || c.matches || 0)
      );
      const maxMedals = Math.max(...contestants.map(c => 
        c.goldMedals + c.silverMedals + c.bronzeMedals
      ));

      chartInstance.current = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: ['Wins', 'Tournament Points', 'Ranking Points', 'Win %', 'Medals', 'Match Count'],
          datasets: topContestants.map((contestant, index) => {
            const totalMatches = contestant.totalMatches || contestant.matches || 0;
            const winPercentage = totalMatches > 0 
              ? (contestant.wins / totalMatches) * 100 
              : 0;
            const medals = contestant.goldMedals + contestant.silverMedals + contestant.bronzeMedals;
            
            return {
              label: contestant.name,
              data: [
                normalize(contestant.wins, maxWins),
                normalize(contestant.tournamentPoints, maxTournamentPoints),
                normalize(contestant.points || contestant.currentPoints || 0, maxCurrentPoints),
                winPercentage,
                normalize(medals, maxMedals),
                normalize(totalMatches, maxMatches)
              ],
              backgroundColor: `${CHART_COLORS[index % CHART_COLORS.length]}33`, // 20% opacity
              borderColor: CHART_COLORS[index % CHART_COLORS.length],
              pointBackgroundColor: CHART_COLORS[index % CHART_COLORS.length],
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: CHART_COLORS[index % CHART_COLORS.length]
            };
          })
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: '#F8FAFC'
              }
            }
          },
          scales: {
            r: {
              angleLines: {
                color: 'rgba(148, 163, 184, 0.2)'
              },
              grid: {
                color: 'rgba(148, 163, 184, 0.2)'
              },
              pointLabels: {
                color: '#F8FAFC'
              },
              ticks: {
                backdropColor: 'transparent',
                color: '#94A3B8'
              }
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [contestants]);

  return (
    <Card className="bg-dark p-4 rounded-lg shadow-md mb-6">
      <h3 className="font-bold text-lg mb-4 flex items-center">
        <i className="fas fa-chart-line text-accent mr-2"></i> Top Performers Trends
      </h3>
      <div className="h-64">
        <canvas ref={chartRef}></canvas>
      </div>
      <div className="mt-4 text-center text-xs text-gray-400">
        Performance trends for top performers
      </div>
    </Card>
  );
}

export function MedalDistributionChart({ contestants }: StatisticsChartsProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || !contestants.length) return;

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    
    if (ctx) {
      // Get contestants with medals
      const medalists = contestants.filter(c => 
        c.goldMedals > 0 || c.silverMedals > 0 || c.bronzeMedals > 0
      );
      
      // Take top 5 medalists
      const topMedalists = [...medalists]
        .sort((a, b) => {
          const totalA = a.goldMedals * 3 + a.silverMedals * 2 + a.bronzeMedals;
          const totalB = b.goldMedals * 3 + b.silverMedals * 2 + b.bronzeMedals;
          return totalB - totalA;
        })
        .slice(0, 5);
      
      // Add "Others" category if there are more medalists
      if (medalists.length > 5) {
        const othersGold = medalists
          .filter(c => !topMedalists.includes(c))
          .reduce((sum, c) => sum + c.goldMedals, 0);
        
        const othersSilver = medalists
          .filter(c => !topMedalists.includes(c))
          .reduce((sum, c) => sum + c.silverMedals, 0);
        
        const othersBronze = medalists
          .filter(c => !topMedalists.includes(c))
          .reduce((sum, c) => sum + c.bronzeMedals, 0);
        
        if (othersGold + othersSilver + othersBronze > 0) {
          const others: Contestant = {
            id: 0,
            name: 'Others',
            points: 0,
            tournamentPoints: 0,
            matches: 0,
            totalMatches: 0,
            wins: 0,
            losses: 0,
            goldMedals: othersGold,
            silverMedals: othersSilver,
            bronzeMedals: othersBronze,
            active: false
          };
          
          topMedalists.push(others);
        }
      }

      chartInstance.current = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: topMedalists.map(c => c.name),
          datasets: [
            {
              data: topMedalists.map(c => c.goldMedals * 3 + c.silverMedals * 2 + c.bronzeMedals),
              backgroundColor: CHART_COLORS.slice(0, topMedalists.length),
              borderColor: '#0F172A',
              borderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: '#F8FAFC',
                padding: 15
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const index = context.dataIndex;
                  const contestant = topMedalists[index];
                  
                  if (!contestant) return '';
                  
                  return [
                    `${contestant.name}: ${context.raw} weighted points`,
                    `Gold: ${contestant.goldMedals}, Silver: ${contestant.silverMedals}, Bronze: ${contestant.bronzeMedals}`
                  ];
                }
              }
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [contestants]);

  return (
    <Card className="bg-dark p-4 rounded-lg shadow-md">
      <h3 className="font-bold text-lg mb-4">Medal Distribution</h3>
      <div className="h-64">
        <canvas ref={chartRef}></canvas>
      </div>
      <div className="mt-4 text-center text-xs text-gray-400">
        Distribution of gold, silver, and bronze medals among top performers
      </div>
    </Card>
  );
}
