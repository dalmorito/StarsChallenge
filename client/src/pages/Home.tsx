import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import NavigationTabs from "@/components/NavigationTabs";
import TournamentView from "@/components/TournamentView";
import RankingsView from "@/components/RankingsView";
import StatisticsView from "@/components/StatisticsView";
import ChartsView from "@/components/ChartsView";
import ContestantsGalleryView from "@/components/ContestantsGalleryView";
import { getCurrentTournament } from "@/lib/api";

type Tab = "tournament" | "rankings" | "stats" | "charts" | "gallery";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("tournament");

  const { data: tournamentData, isLoading } = useQuery({
    queryKey: ["/api/tournament/current"],
    queryFn: getCurrentTournament,
  });

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary">
      {/* Header */}
      <header className="bg-primary text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-center items-center">
          <h1 className="text-2xl font-medium">Pornstars Challenge</h1>
        </div>
      </header>

      {/* Navigation Tabs */}
      <NavigationTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {activeTab === "tournament" && <TournamentView />}
        {activeTab === "rankings" && <RankingsView />}
        {activeTab === "stats" && <StatisticsView />}
        {activeTab === "charts" && <ChartsView />}
        {activeTab === "gallery" && <ContestantsGalleryView />}
      </main>

      {/* Footer */}
      <footer className="bg-textPrimary text-white py-4 mt-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} Pornstars Challenge</p>
        </div>
      </footer>
    </div>
  );
}
