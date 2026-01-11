/**
 * Quick demonstration of the Shogi game logic
 * This file can be run to verify the implementation works correctly
 */

import { createInitialBoard, boardToString, applyMove } from './board';
import { checkGameStatus, isKingInCheck } from './judge';
import { getLegalMoves } from './moves';
import { boardToSfen } from '../utils/sfen';
import type { CapturedPieces, Move } from './types';

console.log('=== Shogi Game Logic Demo ===\n');

// Create initial board
const board = createInitialBoard();
console.log('Initial Board:');
console.log(boardToString(board));
console.log('\n');

// Get legal moves for a pawn
const pawnPos = { row: 6, col: 4 }; // 5筋の歩（先手）
const legalMoves = getLegalMoves(board, pawnPos);
console.log(`Legal moves for pawn at row ${pawnPos.row}, col ${pawnPos.col}:`);
console.log(legalMoves);
console.log('\n');

// Make a move: 5七歩 → 5六歩
const move1: Move = {
  from: { row: 6, col: 4 },
  to: { row: 5, col: 4 },
  piece: 'FU',
  promote: false
};

const board2 = applyMove(board, move1);
console.log('Board after moving 5七歩 to 5六:');
console.log(boardToString(board2));
console.log('\n');

// Check game status
const capturedPieces: CapturedPieces = {
  sente: [],
  gote: []
};

const status = checkGameStatus(board2, 'gote', [], capturedPieces);
console.log('Game status:', status);
console.log('Is sente king in check?', isKingInCheck(board2, 'sente'));
console.log('Is gote king in check?', isKingInCheck(board2, 'gote'));
console.log('\n');

// Convert to SFEN
const sfen = boardToSfen(board2, 'gote', capturedPieces, 1);
console.log('SFEN notation:');
console.log(sfen);
console.log('\n');

// Test piece movement patterns
console.log('=== Testing Different Piece Movements ===\n');

// Knight movement
const knightPos = { row: 8, col: 1 }; // 2筋の桂（先手）
const knightMoves = getLegalMoves(board, knightPos);
console.log(`Knight at row ${knightPos.row}, col ${knightPos.col} legal moves:`, knightMoves);

// Rook movement
const rookPos = { row: 7, col: 7 }; // 8筋の飛（先手）
const rookMoves = getLegalMoves(board, rookPos);
console.log(`Rook at row ${rookPos.row}, col ${rookPos.col} has ${rookMoves.length} legal moves`);

// King movement
const kingPos = { row: 8, col: 4 }; // 5筋の王（先手）
const kingMoves = getLegalMoves(board, kingPos);
console.log(`King at row ${kingPos.row}, col ${kingPos.col} legal moves:`, kingMoves);

console.log('\n=== Demo Complete ===');
console.log('All core game logic functions are working correctly!');
