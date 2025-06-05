import React from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, BarChart3, LineChart, Grid } from "lucide-react";

type TabType = "tournament" | "rankings" | "stats" | "charts" | "gallery";

interface NavigationTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function NavigationTabs({ activeTab, onTabChange }: NavigationTabsProps) {
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "tournament", label: "Tournament", icon: <Trophy className="w-4 h-4" /> },
    { id: "rankings", label: "Rankings", icon: <Medal className="w-4 h-4" /> },
    { id: "stats", label: "Statistics", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "charts", label: "Performance Charts", icon: <LineChart className="w-4 h-4" /> },
    { id: "gallery", label: "Gallery", icon: <Grid className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-white shadow-md rounded-lg mb-6 overflow-hidden">
      <div className="container mx-auto">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto p-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            
            return (
              <motion.button
                key={tab.id}
                className={`
                  px-4 py-3 rounded-md focus:outline-none transition-all duration-200 
                  flex items-center space-x-2 flex-shrink-0
                  font-medium text-sm sm:text-base
                  ${isActive 
                    ? "bg-primary text-white shadow-md" 
                    : "text-gray-600 hover:bg-gray-100"}
                `}
                onClick={() => onTabChange(tab.id)}
                whileHover={{ scale: isActive ? 1 : 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <motion.span
                  initial={{ rotate: 0 }}
                  animate={{ rotate: isActive ? [0, -10, 10, 0] : 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  {tab.icon}
                </motion.span>
                <span>{tab.label}</span>
                
                {isActive && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"
                    layoutId="activeTab"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
