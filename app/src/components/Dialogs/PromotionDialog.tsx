import type { Position } from '../../logic/types';

interface PromotionDialogProps {
  isOpen: boolean;
  position: Position;
  onPromote: () => void;
  onDecline: () => void;
}

export const PromotionDialog = ({
  isOpen,
  position,
  onPromote,
  onDecline,
}: PromotionDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">駒を成りますか？</h2>
        <p className="text-gray-600 mb-6">
          位置: {position.row + 1}行 {position.col + 1}列
        </p>

        <div className="flex gap-4 justify-center">
          <button
            onClick={onPromote}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-colors"
          >
            成る
          </button>
          <button
            onClick={onDecline}
            className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg shadow-lg transition-colors"
          >
            成らない
          </button>
        </div>
      </div>
    </div>
  );
};
