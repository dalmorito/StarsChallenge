import { useEffect, useRef } from "react";
import { Contestant, PointsHistory } from "@/lib/types";
import { CHART_COLORS } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface PointsEvolutionChartProps {
  topContestants: Contestant[];
  pointsHistories: Record<number, PointsHistory[]>;
}

export function PointsEvolutionChart({ topContestants, pointsHistories }: PointsEvolutionChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || !topContestants.length) return;

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Prepare data for chart
    const datasets = topContestants.slice(0, 8).map((contestant, index) => {
      const history = pointsHistories[contestant.id] || [];
      
      // Group points by tournament
      const tournaments: Record<number, PointsHistory[]> = {};
      history.forEach(point => {
        if (!tournaments[point.tournamentId]) {
          tournaments[point.tournamentId] = [];
        }
        tournaments[point.tournamentId].push(point);
      });

      // Get latest points for each tournament
      const tournamentPoints = Object.entries(tournaments).map(([tournamentId, points]) => {
        const latestPoint = points.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        return {
          tournament: parseInt(tournamentId),
          points: latestPoint.pointsAfter
        };
      });

      // Add starting point
      const dataPoints = [{ tournament: 0, points: 1000 }, ...tournamentPoints];
      
      return {
        label: contestant.name,
        data: dataPoints.map(p => p.points),
        borderColor: CHART_COLORS[index % CHART_COLORS.length],
        backgroundColor: `${CHART_COLORS[index % CHART_COLORS.length]}1A`, // 10% opacity
        tension: 0.4
      };
    });

    const ctx = chartRef.current.getContext('2d');
    
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Start', 'T1', 'T2', 'T3', 'Current'],
          datasets
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
              beginAtZero: false,
              min: Math.min(...topContestants.map(c => c.points || c.currentPoints || 1000)) - 200,
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
  }, [topContestants, pointsHistories]);

  return (
    <Card className="bg-dark p-4 rounded-lg shadow-md mb-6">
      <h3 className="font-bold text-lg mb-4 flex items-center">
        <i className="fas fa-chart-line text-accent mr-2"></i> Points Evolution
      </h3>
      <div className="h-64">
        <canvas ref={chartRef}></canvas>
      </div>
      <div className="mt-4 text-center text-xs text-gray-400">
        Points evolution for top 8 performers
      </div>
    </Card>
  );
}
