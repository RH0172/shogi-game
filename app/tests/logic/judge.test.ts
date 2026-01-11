import { describe, it, expect } from 'vitest';
import {
  isKingInCheck,
  isCheckmate,
  isRepetition,
  checkGameStatus,
  getKingEscapeSquares,
  getCheckingPieces,
} from '../../src/logic/judge';
import { Board, CapturedPieces } from '../../src/logic/types';

describe('judge.ts - 王手・詰み判定', () => {
  // 空の盤面を作成するヘルパー
  const createEmptyBoard = (): Board => {
    return Array(9).fill(null).map(() => Array(9).fill(null));
  };

  const emptyCapturedPieces: CapturedPieces = { sente: [], gote: [] };

  describe('isKingInCheck - 王手判定', () => {
    it('王手されていない状態', () => {
      const board = createEmptyBoard();
      board[8][4] = { type: 'OU', owner: 'sente' };
      board[0][4] = { type: 'OU', owner: 'gote' };

      expect(isKingInCheck(board, 'sente')).toBe(false);
      expect(isKingInCheck(board, 'gote')).toBe(false);
    });

    it('飛車による王手', () => {
      const board = createEmptyBoard();
      board[8][4] = { type: 'OU', owner: 'sente' };
      board[8][0] = { type: 'HI', owner: 'gote' }; // 横から飛車で王手

      expect(isKingInCheck(board, 'sente')).toBe(true);
    });

    it('角による王手', () => {
      const board = createEmptyBoard();
      board[8][4] = { type: 'OU', owner: 'sente' };
      board[6][2] = { type: 'KA', owner: 'gote' }; // 斜めから角で王手

      expect(isKingInCheck(board, 'sente')).toBe(true);
    });

    it('歩による王手', () => {
      const board = createEmptyBoard();
      board[8][4] = { type: 'OU', owner: 'sente' };
      board[7][4] = { type: 'FU', owner: 'gote' }; // 上から歩で王手

      expect(isKingInCheck(board, 'sente')).toBe(true);
    });

    it('金による王手', () => {
      const board = createEmptyBoard();
      board[8][4] = { type: 'OU', owner: 'sente' };
      board[7][3] = { type: 'KI', owner: 'gote' }; // 斜め前から金で王手

      expect(isKingInCheck(board, 'sente')).toBe(true);
    });

    it('桂馬による王手', () => {
      const board = createEmptyBoard();
      board[8][4] = { type: 'OU', owner: 'sente' };
      board[6][3] = { type: 'KE', owner: 'gote' }; // 桂馬飛びで王手

      expect(isKingInCheck(board, 'sente')).toBe(true);
    });

    it('香による王手', () => {
      const board = createEmptyBoard();
      board[8][4] = { type: 'OU', owner: 'sente' };
      board[0][4] = { type: 'KY', owner: 'gote' }; // 縦から香で王手

      expect(isKingInCheck(board, 'sente')).toBe(true);
    });

    it('途中に駒があると王手にならない（飛車）', () => {
      const board = createEmptyBoard();
      board[8][4] = { type: 'OU', owner: 'sente' };
      board[8][2] = { type: 'FU', owner: 'sente' }; // 間に駒
      board[8][0] = { type: 'HI', owner: 'gote' };

      expect(isKingInCheck(board, 'sente')).toBe(false);
    });

    it('途中に駒があると王手にならない（角）', () => {
      const board = createEmptyBoard();
      board[8][4] = { type: 'OU', owner: 'sente' };
      board[7][3] = { type: 'FU', owner: 'sente' }; // 間に駒
      board[6][2] = { type: 'KA', owner: 'gote' };

      expect(isKingInCheck(board, 'sente')).toBe(false);
    });

    it('両王手（2つの駒から同時に王手）', () => {
      const board = createEmptyBoard();
      board[8][4] = { type: 'OU', owner: 'sente' };
      board[8][0] = { type: 'HI', owner: 'gote' }; // 飛車で王手
      board[6][2] = { type: 'KA', owner: 'gote' }; // 角でも王手

      expect(isKingInCheck(board, 'sente')).toBe(true);
    });
  });

  describe('isCheckmate - 詰み判定（実戦詰将棋）', () => {
    it('1手詰め: 頭金', () => {
      // 頭金の詰み
      const board = createEmptyBoard();
      board[0][4] = { type: 'OU', owner: 'gote' };
      board[1][4] = { type: 'KI', owner: 'sente' }; // 王の頭に金
      board[0][3] = { type: 'KI', owner: 'sente' }; // 逃げ道を塞ぐ
      board[0][5] = { type: 'KI', owner: 'sente' }; // 逃げ道を塞ぐ
      board[1][3] = { type: 'KI', owner: 'sente' }; // 斜め下も塞ぐ
      board[1][5] = { type: 'KI', owner: 'sente' }; // 斜め下も塞ぐ

      expect(isKingInCheck(board, 'gote')).toBe(true);
      expect(isCheckmate(board, 'gote', emptyCapturedPieces)).toBe(true);
    });

    it('1手詰め: 背面からの飛車', () => {
      const board = createEmptyBoard();
      board[4][4] = { type: 'OU', owner: 'gote' };
      board[4][8] = { type: 'HI', owner: 'sente' }; // 後ろから飛車
      board[3][3] = { type: 'KI', owner: 'sente' }; // 逃げ道を塞ぐ
      board[3][4] = { type: 'KI', owner: 'sente' };
      board[3][5] = { type: 'KI', owner: 'sente' };
      board[4][3] = { type: 'KI', owner: 'sente' };
      board[5][3] = { type: 'KI', owner: 'sente' };
      board[5][4] = { type: 'KI', owner: 'sente' };
      board[5][5] = { type: 'KI', owner: 'sente' };

      expect(isCheckmate(board, 'gote', emptyCapturedPieces)).toBe(true);
    });

    it('1手詰め: 角での詰み', () => {
      const board = createEmptyBoard();
      board[0][0] = { type: 'OU', owner: 'gote' };
      board[2][2] = { type: 'KA', owner: 'sente' }; // 斜めから角
      board[0][1] = { type: 'KI', owner: 'sente' }; // 逃げ道を塞ぐ
      board[1][1] = { type: 'KI', owner: 'sente' };

      expect(isCheckmate(board, 'gote', emptyCapturedPieces)).toBe(true);
    });

    it('王手だが詰みではない（王が逃げられる）', () => {
      const board = createEmptyBoard();
      board[8][4] = { type: 'OU', owner: 'sente' };
      board[8][0] = { type: 'HI', owner: 'gote' }; // 飛車で王手
      board[0][4] = { type: 'OU', owner: 'gote' };

      // 王手だが王が動けば逃げられる
      expect(isKingInCheck(board, 'sente')).toBe(true);
      expect(isCheckmate(board, 'sente', emptyCapturedPieces)).toBe(false);
    });

    it('王手だが詰みではない（合駒ができる）', () => {
      const board = createEmptyBoard();
      board[8][4] = { type: 'OU', owner: 'sente' };
      board[0][4] = { type: 'HI', owner: 'gote' }; // 縦から飛車
      board[6][3] = { type: 'KI', owner: 'sente' }; // 合駒可能な金

      expect(isKingInCheck(board, 'sente')).toBe(true);
      // 金が間に入れば詰みでない
      expect(isCheckmate(board, 'sente', emptyCapturedPieces)).toBe(false);
    });

    it('王手だが詰みではない（王手している駒を取れる）', () => {
      const board = createEmptyBoard();
      board[8][4] = { type: 'OU', owner: 'sente' };
      board[7][4] = { type: 'FU', owner: 'gote' }; // 歩で王手
      board[7][3] = { type: 'KI', owner: 'sente' }; // 歩を取れる金

      expect(isKingInCheck(board, 'sente')).toBe(true);
      expect(isCheckmate(board, 'sente', emptyCapturedPieces)).toBe(false);
    });

    it('3手詰め: 寄せの基本形', () => {
      const board = createEmptyBoard();
      board[0][4] = { type: 'OU', owner: 'gote' };
      board[2][4] = { type: 'HI', owner: 'sente' }; // 飛車で押さえる
      board[1][3] = { type: 'KI', owner: 'sente' }; // 金で逃げ道を塞ぐ
      board[1][5] = { type: 'KI', owner: 'sente' };

      // 飛車を1段目に寄せれば詰み
      board[1][4] = { type: 'HI', owner: 'sente' };
      expect(isCheckmate(board, 'gote', emptyCapturedPieces)).toBe(true);
    });

    it('隅での詰み: 1一角', () => {
      const board = createEmptyBoard();
      board[0][0] = { type: 'OU', owner: 'gote' };
      board[0][0] = { type: 'OU', owner: 'gote' };
      board[2][2] = { type: 'KA', owner: 'sente' }; // 角
      board[1][1] = { type: 'KI', owner: 'sente' }; // 金で逃げ道を塞ぐ

      expect(isCheckmate(board, 'gote', emptyCapturedPieces)).toBe(true);
    });

    it('端での詰み: 桂馬と金の連携', () => {
      const board = createEmptyBoard();
      board[1][0] = { type: 'OU', owner: 'gote' };
      board[3][1] = { type: 'KE', owner: 'sente' }; // 桂馬で王手
      board[0][0] = { type: 'KI', owner: 'sente' }; // 金で逃げ道を塞ぐ
      board[0][1] = { type: 'KI', owner: 'sente' };
      board[1][1] = { type: 'KI', owner: 'sente' };
      board[2][0] = { type: 'KI', owner: 'sente' };
      board[2][1] = { type: 'KI', owner: 'sente' }; // 2二も塞ぐ

      expect(isCheckmate(board, 'gote', emptyCapturedPieces)).toBe(true);
    });

    it('実戦型: 美濃崩し', () => {
      const board = createEmptyBoard();
      board[8][6] = { type: 'OU', owner: 'gote' };
      board[7][6] = { type: 'KI', owner: 'gote' }; // 美濃の金
      board[7][7] = { type: 'KI', owner: 'gote' };
      board[8][7] = { type: 'GI', owner: 'gote' };

      // 攻め駒を配置して詰ます
      board[6][6] = { type: 'KI', owner: 'sente' }; // 垂れ歩からの寄せ
      board[7][5] = { type: 'RY', owner: 'sente' }; // 竜

      // この配置では詰みではないが、王手
      expect(isKingInCheck(board, 'gote')).toBe(true);
    });

    it('実戦型: 矢倉崩し（王手状態の確認）', () => {
      const board = createEmptyBoard();
      board[8][6] = { type: 'OU', owner: 'gote' };
      board[7][5] = { type: 'KI', owner: 'gote' };
      board[7][6] = { type: 'KI', owner: 'gote' };
      board[7][7] = { type: 'GI', owner: 'gote' };
      board[8][7] = { type: 'KE', owner: 'gote' };

      // 攻め駒
      board[8][5] = { type: 'KI', owner: 'sente' }; // 王の横に金で王手
      board[5][6] = { type: 'HI', owner: 'sente' };

      // 王手状態
      expect(isKingInCheck(board, 'gote')).toBe(true);
    });

    it('詰みではない: 王が動ける', () => {
      const board = createEmptyBoard();
      board[4][4] = { type: 'OU', owner: 'gote' };
      board[4][0] = { type: 'HI', owner: 'sente' }; // 飛車で王手
      board[8][8] = { type: 'OU', owner: 'sente' };

      expect(isKingInCheck(board, 'gote')).toBe(true);
      expect(isCheckmate(board, 'gote', emptyCapturedPieces)).toBe(false);
    });
  });

  describe('isRepetition - 千日手判定', () => {
    it('同一局面が3回出現したら千日手（4回目で成立）', () => {
      const history = [
        'position1',
        'position2',
        'position1',
        'position3',
        'position1',
      ];

      // position1が3回出現している
      expect(isRepetition(history, 'position1')).toBe(true);
    });

    it('同一局面が2回以下なら千日手ではない', () => {
      const history = [
        'position1',
        'position2',
        'position1',
        'position3',
      ];

      // position1が2回のみ
      expect(isRepetition(history, 'position1')).toBe(false);
    });

    it('履歴が空の場合は千日手ではない', () => {
      const history: string[] = [];

      expect(isRepetition(history, 'position1')).toBe(false);
    });

    it('異なる局面の繰り返しは千日手ではない', () => {
      const history = [
        'position1',
        'position2',
        'position3',
        'position4',
      ];

      expect(isRepetition(history, 'position5')).toBe(false);
    });

    it('連続王手の千日手', () => {
      // 実戦では連続王手の千日手は反則負けだが、
      // この関数では単純に繰り返しをカウントする
      const history = [
        'check_position1',
        'escape_position1',
        'check_position1',
        'escape_position1',
        'check_position1',
      ];

      expect(isRepetition(history, 'check_position1')).toBe(true);
    });
  });

  describe('checkGameStatus - ゲーム状態の総合判定', () => {
    it('通常の進行中は "playing"', () => {
      const board = createEmptyBoard();
      board[8][4] = { type: 'OU', owner: 'sente' };
      board[0][4] = { type: 'OU', owner: 'gote' };

      const status = checkGameStatus(board, 'sente', [], emptyCapturedPieces);

      expect(status).toBe('playing');
    });

    it('王手状態は "check"', () => {
      const board = createEmptyBoard();
      board[8][4] = { type: 'OU', owner: 'sente' };
      board[8][0] = { type: 'HI', owner: 'gote' };

      const status = checkGameStatus(board, 'sente', [], emptyCapturedPieces);

      expect(status).toBe('check');
    });

    it('詰み状態は "checkmate"', () => {
      const board = createEmptyBoard();
      board[0][4] = { type: 'OU', owner: 'gote' };
      board[1][4] = { type: 'KI', owner: 'sente' };
      board[0][3] = { type: 'KI', owner: 'sente' };
      board[0][5] = { type: 'KI', owner: 'sente' };
      board[1][3] = { type: 'KI', owner: 'sente' }; // 斜め下も塞ぐ
      board[1][5] = { type: 'KI', owner: 'sente' }; // 斜め下も塞ぐ

      const status = checkGameStatus(board, 'gote', [], emptyCapturedPieces);

      expect(status).toBe('checkmate');
    });

    it('千日手は "repetition"', () => {
      const board = createEmptyBoard();
      board[8][4] = { type: 'OU', owner: 'sente' };
      board[0][4] = { type: 'OU', owner: 'gote' };

      const history = ['sfen1', 'sfen2', 'sfen1', 'sfen2', 'sfen1'];
      const currentSfen = 'sfen1';

      const status = checkGameStatus(board, 'sente', history, emptyCapturedPieces, currentSfen);

      expect(status).toBe('repetition');
    });
  });

  describe('getKingEscapeSquares - 王の逃げ場所', () => {
    it('王が自由に動ける場合は8方向', () => {
      const board = createEmptyBoard();
      board[4][4] = { type: 'OU', owner: 'sente' };
      board[0][0] = { type: 'OU', owner: 'gote' };

      const escapeSquares = getKingEscapeSquares(board, 'sente');

      expect(escapeSquares.length).toBe(8);
    });

    it('隅の王は3方向のみ', () => {
      const board = createEmptyBoard();
      board[0][0] = { type: 'OU', owner: 'sente' };
      board[8][8] = { type: 'OU', owner: 'gote' };

      const escapeSquares = getKingEscapeSquares(board, 'sente');

      expect(escapeSquares.length).toBe(3);
      expect(escapeSquares).toContainEqual({ row: 0, col: 1 });
      expect(escapeSquares).toContainEqual({ row: 1, col: 0 });
      expect(escapeSquares).toContainEqual({ row: 1, col: 1 });
    });

    it('自分の駒で塞がれている場所には動けない', () => {
      const board = createEmptyBoard();
      board[4][4] = { type: 'OU', owner: 'sente' };
      board[3][4] = { type: 'KI', owner: 'sente' }; // 上に自分の駒
      board[0][0] = { type: 'OU', owner: 'gote' };

      const escapeSquares = getKingEscapeSquares(board, 'sente');

      expect(escapeSquares).not.toContainEqual({ row: 3, col: 4 });
      expect(escapeSquares.length).toBe(7);
    });
  });

  describe('getCheckingPieces - 王手している駒の位置', () => {
    it('王手している駒がない場合は空配列', () => {
      const board = createEmptyBoard();
      board[8][4] = { type: 'OU', owner: 'sente' };
      board[0][4] = { type: 'OU', owner: 'gote' };

      const checkingPieces = getCheckingPieces(board, 'sente');

      expect(checkingPieces).toHaveLength(0);
    });

    it('1つの駒が王手している場合', () => {
      const board = createEmptyBoard();
      board[8][4] = { type: 'OU', owner: 'sente' };
      board[8][0] = { type: 'HI', owner: 'gote' };

      const checkingPieces = getCheckingPieces(board, 'sente');

      expect(checkingPieces).toHaveLength(1);
      expect(checkingPieces).toContainEqual({ row: 8, col: 0 });
    });

    it('両王手の場合は2つの駒', () => {
      const board = createEmptyBoard();
      board[8][4] = { type: 'OU', owner: 'sente' };
      board[8][0] = { type: 'HI', owner: 'gote' };
      board[6][2] = { type: 'KA', owner: 'gote' };

      const checkingPieces = getCheckingPieces(board, 'sente');

      expect(checkingPieces).toHaveLength(2);
      expect(checkingPieces).toContainEqual({ row: 8, col: 0 });
      expect(checkingPieces).toContainEqual({ row: 6, col: 2 });
    });
  });
});
