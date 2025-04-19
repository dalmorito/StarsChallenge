import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Contestant } from '@/lib/types';
import { getContestantImages } from '@/lib/api';
import confetti from 'canvas-confetti';
import { Trophy, Award, Medal } from 'lucide-react';

interface ChampionCelebrationProps {
  champion: Contestant;
  runnerUp: Contestant;
  thirdPlace: Contestant | null;
  onNewTournament: () => void;
}

interface ContestantImageProps {
  contestant: Contestant;
  position: 'first' | 'second' | 'third';
}

function ContestantImage({ contestant, position }: ContestantImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Cores e tamanhos para cada posição
  const positionStyles = {
    first: {
      border: 'border-amber-500',
      size: 'w-64 h-64',
      position: 'self-center',
      medal: <Trophy className="h-8 w-8 text-amber-500" />
    },
    second: {
      border: 'border-gray-400',
      size: 'w-48 h-48',
      position: 'self-end',
      medal: <Award className="h-7 w-7 text-gray-400" />
    },
    third: {
      border: 'border-amber-800',
      size: 'w-48 h-48',
      position: 'self-end',
      medal: <Medal className="h-7 w-7 text-amber-800" />
    }
  };
  
  useEffect(() => {
    const fetchImage = async () => {
      setLoading(true);
      try {
        const response = await getContestantImages(contestant.id, 'gallery');
        if (response.success && response.data.images.length > 0) {
          setImageUrl(response.data.images[0]);
        }
      } catch (error) {
        console.error(`Erro ao buscar imagem de ${contestant.name}:`, error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchImage();
  }, [contestant.id]);
  
  return (
    <div className={`flex flex-col items-center ${positionStyles[position].position}`}>
      <div className="mb-2">
        {positionStyles[position].medal}
      </div>
      
      {loading ? (
        <div className={`${positionStyles[position].size} rounded-full overflow-hidden ${positionStyles[position].border} border-4 shadow-lg flex items-center justify-center bg-gray-100`}>
          <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      ) : imageUrl ? (
        <motion.div 
          className={`${positionStyles[position].size} rounded-full overflow-hidden ${positionStyles[position].border} border-4 shadow-lg`}
          animate={{ 
            rotate: position === 'first' ? [0, 5, 0, -5, 0] : [0, 3, 0, -3, 0],
            scale: position === 'first' ? [1, 1.05, 1] : [1, 1.03, 1],
          }}
          transition={{ 
            duration: position === 'first' ? 3 : 4,
            repeat: Infinity
          }}
        >
          <img 
            src={`/proxy-image?url=${encodeURIComponent(imageUrl)}`} 
            alt={contestant.name} 
            className="w-full h-full object-cover"
          />
        </motion.div>
      ) : (
        <div className={`${positionStyles[position].size} rounded-full overflow-hidden ${positionStyles[position].border} border-4 shadow-lg flex items-center justify-center bg-gray-200`}>
          <span className="text-gray-500 text-sm">Imagem não disponível</span>
        </div>
      )}
      
      <h3 className={`mt-3 font-bold ${position === 'first' ? 'text-xl' : 'text-lg'}`}>
        {contestant.name}
      </h3>
      
      <div className="text-sm mt-1">
        {position === 'first' && <span className="text-amber-600 font-semibold">{contestant.tournamentPoints} pontos</span>}
        {position !== 'first' && <span className="text-gray-600">{contestant.tournamentPoints} pontos</span>}
      </div>
    </div>
  );
}

export default function ChampionCelebration({
  champion,
  runnerUp,
  thirdPlace,
  onNewTournament
}: ChampionCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Verificar se temos as informações completas
    console.log("Campeã recebida:", champion);
    console.log("Vice-campeã recebida:", runnerUp);
    console.log("Terceiro lugar recebido:", thirdPlace);

    // Disparar confetes quando o componente montar
    setShowConfetti(true);

    // Função para lançar confetes
    const launchConfetti = () => {
      const duration = 8 * 1000;
      const end = Date.now() + duration;

      const colors = ['#ffd700', '#ff9800', '#e91e63', '#2196f3', '#4caf50']; // Cores festivas

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    };

    if (showConfetti) {
      launchConfetti();
    }

    // Limpar os confetes quando o componente desmontar
    return () => {
      setShowConfetti(false);
    };
  }, [champion, runnerUp, thirdPlace, showConfetti]);

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 flex flex-col items-center justify-center bg-black/80 z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full text-center"
          initial={{ scale: 0.8, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
        >
          <motion.h1 
            className="text-3xl font-bold mb-6 text-amber-600"
            animate={{ 
              scale: [1, 1.2, 1],
              color: ['#f59e0b', '#ef4444', '#f59e0b'] 
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            🏆 O Pódio da Competição 🏆
          </motion.h1>
          
          {/* Pódio */}
          <div className="flex justify-center items-end gap-4 mb-8">
            {/* Segundo lugar */}
            <div className="w-1/3 relative">
              <ContestantImage contestant={runnerUp} position="second" />
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-20 bg-gradient-to-t from-gray-300 to-gray-200 rounded-t-lg border border-gray-400 -z-10"></div>
            </div>
            
            {/* Primeiro lugar - mais alto */}
            <div className="w-1/3 relative">
              <ContestantImage contestant={champion} position="first" />
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-28 bg-gradient-to-t from-amber-300 to-amber-200 rounded-t-lg border border-amber-400 -z-10"></div>
            </div>
            
            {/* Terceiro lugar */}
            {thirdPlace && (
              <div className="w-1/3 relative">
                <ContestantImage contestant={thirdPlace} position="third" />
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-14 bg-gradient-to-t from-amber-800/20 to-amber-700/20 rounded-t-lg border border-amber-800/30 -z-10"></div>
              </div>
            )}
          </div>
          
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-5 rounded-lg mb-8">
            <h2 className="text-xl font-semibold text-amber-800 mb-3">Estatísticas da Campeã</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded-md shadow-sm">
                <p className="text-lg font-medium">Pontuação Total</p>
                <p className="text-2xl text-amber-600">{champion.points} pts</p>
              </div>
              <div className="bg-white p-3 rounded-md shadow-sm">
                <p className="text-lg font-medium">Medalhas</p>
                <div className="flex justify-center gap-3 mt-1">
                  <span className="flex items-center">
                    <Trophy className="w-5 h-5 text-amber-500 mr-1" /> {champion.goldMedals}
                  </span>
                  <span className="flex items-center">
                    <Award className="w-5 h-5 text-gray-400 mr-1" /> {champion.silverMedals}
                  </span>
                  <span className="flex items-center">
                    <Medal className="w-5 h-5 text-amber-800 mr-1" /> {champion.bronzeMedals}
                  </span>
                </div>
              </div>
              <div className="bg-white p-3 rounded-md shadow-sm">
                <p className="text-lg font-medium">Desempenho</p>
                <p className="text-lg">
                  <span className="text-green-600">{champion.wins} vitórias</span> / 
                  <span className="text-red-600"> {champion.losses} derrotas</span>
                </p>
              </div>
            </div>
          </div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <Button 
              onClick={onNewTournament} 
              size="lg" 
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-8 py-6 text-lg"
            >
              Iniciar Novo Campeonato
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}