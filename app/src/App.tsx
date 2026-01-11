import { useState, useEffect } from 'react';
import { Board } from './components/Board/Board';
import { CapturedPieces } from './components/CapturedPieces/CapturedPieces';
import { GameControls } from './components/GameControls/GameControls';
import { GameOverDialog } from './components/Dialogs/GameOverDialog';
import { ModeSelectDialog } from './components/Dialogs/ModeSelectDialog';
import { useGame } from './hooks/useGame';
import { initEngine } from './services/aiService';
import type { GameMode, AILevel } from './logic/types';

function App() {
  const { gameStatus, winner, newGame } = useGame();
  const [showModeSelect, setShowModeSelect] = useState(true);
  const [showGameOver, setShowGameOver] = useState(false);

  // Initialize AI engine on startup
  useEffect(() => {
    const initAI = async () => {
      try {
        await initEngine();
        console.log('AI engine initialized successfully');
      } catch (error) {
        console.error('Failed to initialize AI engine:', error);
        // Continue anyway - PvP mode will still work
      }
    };

    initAI();
  }, []);

  // Show game over dialog when game ends
  useEffect(() => {
    if (gameStatus === 'checkmate' || gameStatus === 'resigned') {
      setShowGameOver(true);
    } else {
      setShowGameOver(false);
    }
  }, [gameStatus]);

  const handleModeSelect = (mode: GameMode, aiLevel?: AILevel) => {
    newGame(mode, aiLevel);
    setShowModeSelect(false);
  };

  const handleNewGame = () => {
    setShowModeSelect(true);
    setShowGameOver(false);
  };

  const handleCloseGameOver = () => {
    setShowGameOver(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          将棋 - Shogi Game
        </h1>

        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
          {/* Left side - Gote captured pieces */}
          <div className="w-full lg:w-64">
            <CapturedPieces player="gote" />
          </div>

          {/* Center - Board and controls */}
          <div className="flex flex-col items-center gap-6">
            <GameControls onNewGame={handleNewGame} />
            <Board />
          </div>

          {/* Right side - Sente captured pieces */}
          <div className="w-full lg:w-64">
            <CapturedPieces player="sente" />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center text-gray-600 text-sm max-w-2xl mx-auto">
          <p className="mb-2">
            <strong>操作方法:</strong> 駒をクリックして選択し、移動先をクリックして駒を動かします。
          </p>
          <p>
            持ち駒をクリックすると、打てる位置が表示されます。
          </p>
        </div>
      </div>

      {/* Dialogs */}
      <ModeSelectDialog
        isOpen={showModeSelect}
        onSelect={handleModeSelect}
        onClose={() => setShowModeSelect(false)}
      />

      <GameOverDialog
        isOpen={showGameOver}
        winner={winner}
        gameStatus={gameStatus}
        onNewGame={handleNewGame}
        onClose={handleCloseGameOver}
      />
    </div>
  );
}

export default App;
