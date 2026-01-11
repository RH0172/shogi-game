import type { GameMode, AILevel } from '../../logic/types';
import { useState } from 'react';

interface ModeSelectDialogProps {
  isOpen: boolean;
  onSelect: (mode: GameMode, aiLevel?: AILevel) => void;
  onClose: () => void;
}

export const ModeSelectDialog = ({ isOpen, onSelect, onClose }: ModeSelectDialogProps) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('pvp');
  const [selectedAILevel, setSelectedAILevel] = useState<AILevel>('medium');

  if (!isOpen) return null;

  const handleStart = () => {
    if (selectedMode === 'pve') {
      onSelect(selectedMode, selectedAILevel);
    } else {
      onSelect(selectedMode);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">
          対局モード選択
        </h2>

        {/* Mode Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">対局モード</h3>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setSelectedMode('pvp')}
              className={`
                p-4 rounded-lg border-2 transition-all text-left
                ${selectedMode === 'pvp'
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-300 bg-white hover:border-gray-400'
                }
              `}
            >
              <div className="font-bold text-lg">対人戦 (PvP)</div>
              <div className="text-sm text-gray-600">二人で対局します</div>
            </button>

            <button
              onClick={() => setSelectedMode('pve')}
              className={`
                p-4 rounded-lg border-2 transition-all text-left
                ${selectedMode === 'pve'
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-300 bg-white hover:border-gray-400'
                }
              `}
            >
              <div className="font-bold text-lg">対AI戦 (PvE)</div>
              <div className="text-sm text-gray-600">AIと対局します（実装予定）</div>
            </button>
          </div>
        </div>

        {/* AI Level Selection (only shown when PvE is selected) */}
        {selectedMode === 'pve' && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">AI難易度</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedAILevel('easy')}
                className={`
                  flex-1 py-2 px-4 rounded-lg border-2 transition-all
                  ${selectedAILevel === 'easy'
                    ? 'border-green-500 bg-green-50 font-bold'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                  }
                `}
              >
                初級
              </button>
              <button
                onClick={() => setSelectedAILevel('medium')}
                className={`
                  flex-1 py-2 px-4 rounded-lg border-2 transition-all
                  ${selectedAILevel === 'medium'
                    ? 'border-yellow-500 bg-yellow-50 font-bold'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                  }
                `}
              >
                中級
              </button>
              <button
                onClick={() => setSelectedAILevel('hard')}
                className={`
                  flex-1 py-2 px-4 rounded-lg border-2 transition-all
                  ${selectedAILevel === 'hard'
                    ? 'border-red-500 bg-red-50 font-bold'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                  }
                `}
              >
                上級
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mt-8">
          <button
            onClick={handleStart}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition-colors"
          >
            対局開始
          </button>
          <button
            onClick={onClose}
            className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg shadow-lg transition-colors"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};
