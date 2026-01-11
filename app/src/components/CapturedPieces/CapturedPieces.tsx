import type { Player, PieceType } from '../../logic/types';
import { useGame } from '../../hooks/useGame';

interface CapturedPiecesProps {
  player: Player;
}

const PIECE_CHARS: Record<PieceType, string> = {
  FU: '歩',
  KY: '香',
  KE: '桂',
  GI: '銀',
  KI: '金',
  KA: '角',
  HI: '飛',
  OU: '王',
  TO: 'と',
  NY: '杏',
  NK: '圭',
  NG: '全',
  UM: '馬',
  RY: '龍',
};

export const CapturedPieces = ({ player }: CapturedPiecesProps) => {
  const {
    capturedPieces,
    currentPlayer,
    selectCapturedPiece,
    isCapturedPieceSelected,
    gameStatus,
  } = useGame();

  const pieces = player === 'sente' ? capturedPieces.sente : capturedPieces.gote;
  const isMyTurn = currentPlayer === player;
  const isGameOver = gameStatus === 'checkmate' || gameStatus === 'resigned';

  // Group pieces by type and count them
  const pieceCounts = pieces.reduce((acc, piece) => {
    acc[piece] = (acc[piece] || 0) + 1;
    return acc;
  }, {} as Record<PieceType, number>);

  // Sort pieces in a logical order
  const pieceOrder: PieceType[] = ['HI', 'KA', 'KI', 'GI', 'KE', 'KY', 'FU'];
  const sortedPieces = pieceOrder.filter(type => pieceCounts[type] > 0);

  const handlePieceClick = (piece: PieceType) => {
    if (!isMyTurn || isGameOver) return;

    if (isCapturedPieceSelected(piece)) {
      selectCapturedPiece(null);
    } else {
      selectCapturedPiece(piece);
    }
  };

  return (
    <div
      className={`
        p-4 rounded-lg shadow-md min-h-[100px]
        ${player === 'sente' ? 'bg-gray-100' : 'bg-red-50'}
      `}
    >
      <div className="text-sm font-semibold mb-2 text-gray-700">
        {player === 'sente' ? '先手 持ち駒' : '後手 持ち駒'}
      </div>

      {pieces.length === 0 ? (
        <div className="text-gray-400 text-sm italic">なし</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sortedPieces.map((pieceType) => {
            const count = pieceCounts[pieceType];
            const isSelected = isCapturedPieceSelected(pieceType);

            return (
              <button
                key={pieceType}
                onClick={() => handlePieceClick(pieceType)}
                disabled={!isMyTurn || isGameOver}
                className={`
                  relative px-3 py-2 rounded border-2 transition-all
                  ${isSelected
                    ? 'border-yellow-400 bg-yellow-100 shadow-lg scale-110'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                  }
                  ${isMyTurn && !isGameOver ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}
                `}
              >
                <div
                  className={`text-xl font-bold ${
                    player === 'sente' ? 'text-gray-900' : 'text-red-700'
                  }`}
                >
                  {PIECE_CHARS[pieceType]}
                </div>
                {count > 1 && (
                  <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {count}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
