import { Board, Piece, Position } from '../types';

export const createEmptyBoard = (): Board => {
  return Array(9).fill(null).map(() => Array(9).fill(null));
};

export const setPiece = (board: Board, pos: Position, piece: Piece) => {
  board[pos.row][pos.col] = piece;
};

export const createBoard = (pieces: { row: number; col: number; piece: Piece }[]): Board => {
  const board = createEmptyBoard();
  pieces.forEach(({ row, col, piece }) => {
    board[row][col] = piece;
  });
  return board;
};
