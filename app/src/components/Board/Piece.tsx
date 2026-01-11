import type { PieceType, Player } from '../../logic/types';

interface PieceProps {
  type: PieceType;
  owner: Player;
}

/**
 * Unicode characters for Shogi pieces
 * ☗ = Sente (black)
 * ☖ = Gote (white)
 */
const PIECE_CHARS: Record<PieceType, string> = {
  FU: '歩',  // Pawn
  KY: '香',  // Lance
  KE: '桂',  // Knight
  GI: '銀',  // Silver
  KI: '金',  // Gold
  KA: '角',  // Bishop
  HI: '飛',  // Rook
  OU: '王',  // King
  TO: 'と',  // Promoted Pawn
  NY: '杏',  // Promoted Lance
  NK: '圭',  // Promoted Knight
  NG: '全',  // Promoted Silver
  UM: '馬',  // Promoted Bishop (Horse)
  RY: '龍',  // Promoted Rook (Dragon)
};

export const Piece = ({ type, owner }: PieceProps) => {
  const char = PIECE_CHARS[type];
  const directionIndicator = owner === 'sente' ? '☗' : '☖';

  return (
    <div className="flex flex-col items-center justify-center w-full h-full select-none pointer-events-none">
      <div
        className={`text-2xl font-bold ${
          owner === 'sente' ? 'text-gray-900' : 'text-red-700'
        }`}
        style={{
          transform: owner === 'gote' ? 'rotate(180deg)' : 'none',
        }}
      >
        <div className="text-xs opacity-60 text-center">{directionIndicator}</div>
        <div>{char}</div>
      </div>
    </div>
  );
};
