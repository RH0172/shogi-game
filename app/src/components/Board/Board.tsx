import { useGame } from '../../hooks/useGame';
import { Square } from './Square';

export const Board = () => {
  const {
    board,
    selectSquare,
    isSquareSelected,
    isLegalMove,
    isLastMoveSquare,
  } = useGame();

  // Column labels (9 to 1, right to left)
  const colLabels = ['9', '8', '7', '6', '5', '4', '3', '2', '1'];

  // Row labels (一 to 九, top to bottom)
  const rowLabels = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];

  return (
    <div className="flex flex-col items-center">
      <div className="inline-flex flex-col bg-amber-100 p-4 rounded-lg shadow-lg">
        {/* Column labels */}
        <div className="flex mb-1">
          <div className="w-6"></div>
          {colLabels.map((label, idx) => (
            <div
              key={idx}
              className="flex-1 text-center text-sm font-semibold text-gray-700 min-w-[40px] max-w-[60px]"
            >
              {label}
            </div>
          ))}
          <div className="w-6"></div>
        </div>

        {/* Board grid */}
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {/* Row label - left */}
            <div className="w-6 flex items-center justify-center text-sm font-semibold text-gray-700">
              {rowLabels[rowIndex]}
            </div>

            {/* Squares */}
            {row.map((piece, colIndex) => {
              const position = { row: rowIndex, col: colIndex };
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="min-w-[40px] max-w-[60px] flex-1"
                >
                  <Square
                    piece={piece}
                    position={position}
                    isSelected={isSquareSelected(position)}
                    isLegalMove={isLegalMove(position)}
                    isLastMove={isLastMoveSquare(position)}
                    onClick={() => selectSquare(position)}
                  />
                </div>
              );
            })}

            {/* Row label - right */}
            <div className="w-6 flex items-center justify-center text-sm font-semibold text-gray-700">
              {rowLabels[rowIndex]}
            </div>
          </div>
        ))}

        {/* Column labels - bottom */}
        <div className="flex mt-1">
          <div className="w-6"></div>
          {colLabels.map((label, idx) => (
            <div
              key={idx}
              className="flex-1 text-center text-sm font-semibold text-gray-700 min-w-[40px] max-w-[60px]"
            >
              {label}
            </div>
          ))}
          <div className="w-6"></div>
        </div>
      </div>
    </div>
  );
};
