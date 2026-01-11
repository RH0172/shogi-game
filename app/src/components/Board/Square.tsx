import type { Piece as PieceType, Position } from '../../logic/types';
import { Piece } from './Piece';

interface SquareProps {
  piece: PieceType | null;
  position: Position;
  isSelected: boolean;
  isLegalMove: boolean;
  isLastMove: boolean;
  onClick: () => void;
}

export const Square = ({
  piece,
  position: _position,
  isSelected,
  isLegalMove,
  isLastMove,
  onClick,
}: SquareProps) => {
  const getBackgroundColor = () => {
    if (isSelected) {
      return 'bg-yellow-300';
    }
    if (isLegalMove) {
      return piece ? 'bg-red-200' : 'bg-green-200';
    }
    if (isLastMove) {
      return 'bg-blue-100';
    }
    return 'bg-amber-50';
  };

  return (
    <div
      className={`
        relative
        aspect-square
        border border-gray-800
        cursor-pointer
        hover:bg-opacity-80
        transition-colors
        ${getBackgroundColor()}
      `}
      onClick={onClick}
    >
      {piece && <Piece type={piece.type} owner={piece.owner} />}
      {isLegalMove && !piece && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-3 h-3 bg-green-500 rounded-full opacity-50"></div>
        </div>
      )}
      {isLegalMove && piece && (
        <div className="absolute top-1 right-1 pointer-events-none">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        </div>
      )}
    </div>
  );
};
