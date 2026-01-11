import { useGame } from '../../hooks/useGame';

interface GameControlsProps {
  onNewGame: () => void;
}

export const GameControls = ({ onNewGame }: GameControlsProps) => {
  const { currentPlayer, gameStatus, gameMode, isAIThinking, resign } = useGame();

  const isGameOver = gameStatus === 'checkmate' || gameStatus === 'resigned';

  const getTurnDisplay = () => {
    if (gameStatus === 'checkmate') {
      return '詰み！';
    }
    if (gameStatus === 'resigned') {
      return '投了';
    }
    if (isAIThinking) {
      return 'AIが思考中...';
    }
    if (gameStatus === 'check') {
      const playerName = gameMode === 'pve' && currentPlayer === 'gote' ? 'AI' : (currentPlayer === 'sente' ? '先手' : '後手');
      return `${playerName}の番 (王手！)`;
    }
    const playerName = gameMode === 'pve' && currentPlayer === 'gote' ? 'AI' : (currentPlayer === 'sente' ? '先手' : '後手');
    return `${playerName}の番`;
  };

  const handleResign = () => {
    if (window.confirm('投了しますか？')) {
      resign();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-lg shadow-md">
      {/* Turn indicator */}
      <div
        className={`
          text-2xl font-bold px-6 py-3 rounded-lg transition-all
          ${isAIThinking ? 'bg-purple-100 text-purple-700 animate-pulse' : ''}
          ${gameStatus === 'check' && !isAIThinking ? 'bg-red-100 text-red-700 animate-pulse' : ''}
          ${isGameOver ? 'bg-gray-100 text-gray-700' : ''}
          ${!isGameOver && gameStatus !== 'check' && !isAIThinking ? 'bg-blue-100 text-blue-700' : ''}
        `}
      >
        {getTurnDisplay()}
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onNewGame}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow transition-colors"
        >
          新規対局
        </button>

        <button
          onClick={handleResign}
          disabled={isGameOver}
          className={`
            px-6 py-2 font-semibold rounded-lg shadow transition-colors
            ${isGameOver
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white'
            }
          `}
        >
          投了
        </button>
      </div>
    </div>
  );
};
