import type { Player, GameStatus } from '../../logic/types';

interface GameOverDialogProps {
  isOpen: boolean;
  winner: Player | null;
  gameStatus: GameStatus;
  onNewGame: () => void;
  onClose: () => void;
}

export const GameOverDialog = ({
  isOpen,
  winner,
  gameStatus,
  onNewGame,
  onClose,
}: GameOverDialogProps) => {
  if (!isOpen) return null;

  const getMessage = () => {
    if (gameStatus === 'checkmate' && winner) {
      return `${winner === 'sente' ? '先手' : '後手'}の勝利！`;
    }
    if (gameStatus === 'resigned' && winner) {
      return `${winner === 'sente' ? '先手' : '後手'}の勝利！（投了）`;
    }
    if (gameStatus === 'stalemate') {
      return '引き分け（ステイルメイト）';
    }
    if (gameStatus === 'repetition') {
      return '引き分け（千日手）';
    }
    return '対局終了';
  };

  const getSubMessage = () => {
    if (gameStatus === 'checkmate') {
      return '詰みです。';
    }
    if (gameStatus === 'resigned') {
      return '相手が投了しました。';
    }
    return '';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
        <h2 className="text-3xl font-bold mb-4 text-center text-gray-800">
          {getMessage()}
        </h2>
        {getSubMessage() && (
          <p className="text-gray-600 mb-6 text-center text-lg">
            {getSubMessage()}
          </p>
        )}

        <div className="flex gap-4 justify-center mt-8">
          <button
            onClick={onNewGame}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-lg transition-colors"
          >
            新規対局
          </button>
          <button
            onClick={onClose}
            className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg shadow-lg transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
