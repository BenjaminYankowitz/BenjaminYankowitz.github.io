/*
Copyright 2026 Benjamin Yankowitz
This file is part of JavascriptChess.
JavascriptChess is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
JavascriptChess is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with JavascriptChess. If not, see <https://www.gnu.org/licenses/>. 
*/

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Board, board_dim, board_as_string } from './board.js'
import { Pawn, Knight, Bishop, Rook, Queen, King } from './piece.js'
import { get_other_color } from './util.js'

function clear(board) {
  for (let row = 0; row < board_dim; row++)
    for (let col = 0; col < board_dim; col++)
      board.board[row][col] = null
}

function place(board, row, col, piece) {
  board.board[row][col] = piece
}

// Clear board and place kings.
function setup(board) {
  clear(board)
  place(board, 7, 7, new King('White'))
  place(board, 0, 0, new King('Black'))
}

test('board init: back ranks correct', function () {
  const board = new Board()
  const expected = [Rook, Knight, Bishop, Queen, King, Bishop, Knight, Rook]
  for (let col = 0; col < 8; col++) {
    const piece_black = board.at([0, col])
    assert.strictEqual(piece_black instanceof expected[col], true, `col ${col}: expected ${expected[col].name}, got ${piece_black?.constructor.name}`)
    assert.strictEqual(piece_black.color, 'Black', `col ${col}: expected Black ${piece_black?.constructor.name}, got ${piece_black.color}`)
    const piece_white = board.at([7, col])
    assert.strictEqual(piece_white instanceof expected[col], true, `col ${col}: expected ${expected[col].name}, got ${piece_white?.constructor.name}`)
    assert.strictEqual(piece_white.color, 'White', `col ${col}: expected White ${piece_white?.constructor.name}, got ${piece_white.color}`)
  }
})

// --- board setup correctly ---

test('board init: pawns correct', function () {
  const board = new Board()
  for (let col = 0; col < 8; col++) {
    const piece_black = board.at([1, col])
    assert.strictEqual(piece_black instanceof Pawn, true, `col ${col} expected pawn, got ${piece_black?.constructor.name}`)
    assert.strictEqual(piece_black.color, 'Black', `col ${col} expected black pawn, got ${piece_black.color}`)
    const piece_white = board.at([6, col])
    assert.strictEqual(piece_white instanceof Pawn, true, `col ${col} expected pawn, got ${piece_white?.constructor.name}`)
    assert.strictEqual(piece_white.color, 'White', `col ${col} expected white pawn, got ${piece_white.color}`)
  }
})

test('board init: rows 2-5 empty', function () {
  const board = new Board()
  for (let row = 2; row <= 5; row++)
    for (let col = 0; col < 8; col++)
      assert.strictEqual(board.at([row, col]), null, `row ${row} col ${col} should be empty`)
})


// --- Turn tracking ---

test('turn: goes White, Black, White', function () {
  const board = new Board()
  assert.strictEqual(board.turn, 'White')
  assert.strictEqual(board.move_attempt([6, 0], [5, 0]), 'succeeded')
  assert.strictEqual(board.turn, 'Black')
  assert.strictEqual(board.move_attempt([1, 0], [2, 0]), 'succeeded')
  assert.strictEqual(board.turn, 'White')
})

test('turn: counts correctly', function () {
  const board = new Board()
  assert.strictEqual(board.turn_num, 0)
  assert.strictEqual(board.move_attempt([6, 1], [5, 1]), 'succeeded')
  assert.strictEqual(board.turn_num, 1)
  assert.strictEqual(board.move_attempt([1, 1], [2, 1]), 'succeeded')
  assert.strictEqual(board.turn_num, 2)
})

// --- valid_select ---

test('valid_select: empty square', function () {
  const board = new Board()
  assert.strictEqual(board.valid_select([4, 4]), false)
})

test('valid_select: Black piece on White turn', function () {
  const board = new Board()
  assert.strictEqual(board.valid_select([1, 0]), false)
})

test('valid_select: White piece on Black turn', function () {
  const board = new Board()
  assert.strictEqual(board.move_attempt([6, 2], [5, 2]), 'succeeded')
  assert.strictEqual(board.valid_select([7, 0]), false)
})

test('valid_select: White piece on White turn', function () {
  const board = new Board()
  assert.strictEqual(board.valid_select([6, 0]), true)
})

test('valid_select: Black piece on Black turn', function () {
  const board = new Board()
  assert.strictEqual(board.move_attempt([6, 3], [5, 3]), 'succeeded')
  assert.strictEqual(board.valid_select([1, 0]), true)
})

// --- Pawn ---

test('pawn: single step forward (White)', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Pawn('White'))
  assert.strictEqual(board.move_attempt([4, 4], [3, 4]), 'succeeded')
})

test('pawn: double step from home row (White row 6)', function () {
  const board = new Board()
  setup(board)
  place(board, 6, 4, new Pawn('White'))
  assert.strictEqual(board.move_attempt([6, 4], [4, 4]), 'succeeded')
})

test('pawn: double step rejected from non-home row', function () {
  const board = new Board()
  setup(board)
  place(board, 5, 4, new Pawn('White'))
  assert.strictEqual(board.move_attempt([5, 4], [3, 4]), 'failed')
})

test('pawn: Cannot move more than one sideways to capture', function () {
  const board = new Board()
  setup(board)
  place(board, 5, 4, new Pawn('White'))
  place(board, 4, 2, new Pawn('Black'))
  assert.strictEqual(board.move_attempt([5, 4], [4, 2]), 'failed')
})

test('pawn: blocked by piece directly ahead', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Pawn('White'))
  place(board, 3, 4, new Pawn('Black'))
  assert.strictEqual(board.move_attempt([4, 4], [3, 4]), 'failed')
})

test('pawn: blocked by piece two ahead', function () {
  const board = new Board()
  setup(board)
  place(board, 6, 4, new Pawn('White'))
  place(board, 4, 4, new Pawn('Black'))
  assert.strictEqual(board.move_attempt([6, 4], [4, 4]), 'failed')
})


test('pawn: cannot move backward', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Pawn('White'))
  assert.strictEqual(board.move_attempt([4, 4], [5, 4]), 'failed')
})

test('pawn: diagonal capture of opponent', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Pawn('White'))
  place(board, 3, 5, new Pawn('Black'))
  assert.strictEqual(board.move_attempt([4, 4], [3, 5]), 'succeeded')
})

test('pawn: cannot move diagonally to empty square', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Pawn('White'))
  assert.strictEqual(board.move_attempt([4, 4], [3, 5]), 'failed')
})

test('pawn: double step from home row (Black row 1)', function () {
  const board = new Board()
  setup(board)
  assert.strictEqual(board.move_attempt([7, 7], [6, 7]), 'succeeded')
  place(board, 1, 4, new Pawn('Black'))
  assert.strictEqual(board.move_attempt([1, 4], [3, 4]), 'succeeded')
})

// --- En passant ---

test('en passant: Black captures White immediately after double jump', function () {
  const board = new Board()
  setup(board)
  const white_pawn = new Pawn('White')
  const black_pawn = new Pawn('Black')
  place(board, 6, 5, white_pawn)
  place(board, 4, 4, black_pawn)

  assert.strictEqual(board.move_attempt([6, 5], [4, 5]), 'succeeded')
  assert.strictEqual(board.move_attempt([4, 4], [5, 5]), 'succeeded')
  assert.strictEqual(board.at([4, 5]), null)
  assert.strictEqual(board.at([5, 5]), black_pawn)
})

test('en passant: invalid one turn after double jump', function () {
  const board = new Board()
  setup(board)

  const white_pawn = new Pawn('White')
  place(board, 6, 5, white_pawn)
  const black_pawn = new Pawn('Black')
  place(board, 4, 4, black_pawn)

  assert.strictEqual(board.move_attempt([6, 5], [4, 5]), 'succeeded')
  assert.strictEqual(board.move_attempt([0, 0], [1, 0]), 'succeeded')
  assert.strictEqual(board.move_attempt([7, 7], [6, 7]), 'succeeded')
  assert.strictEqual(board.move_attempt([4, 4], [5, 5]), 'failed')
})

test('promotion: can turn into queen', function () {
  const board = new Board()
  setup(board)
  place(board, 1, 4, new Pawn('White'));
  assert.strictEqual(board.move_attempt([1, 4], [0, 4]), 'promotion')
  assert.strictEqual(board.select_promotion('Queen'), true)
  assert.strictEqual(board.turn_num, 1)
  assert.strictEqual(board.at([1, 4]), null)
  assert.strictEqual(board.at([0, 4]).color, 'White')
  assert.strictEqual(board.at([0, 4]) instanceof Queen, true, board_as_string(board))
})

test('promotion: can turn into rook', function () {
  const board = new Board()
  setup(board)
  place(board, 1, 4, new Pawn('White'));
  assert.strictEqual(board.move_attempt([1, 4], [0, 4]), 'promotion')
  assert.strictEqual(board.select_promotion('Rook'), true)
  assert.strictEqual(board.turn_num, 1)
  assert.strictEqual(board.at([1, 4]), null)
  assert.strictEqual(board.at([0, 4]).color, 'White')
  assert.strictEqual(board.at([0, 4]) instanceof Rook, true, board_as_string(board))
})

test('promotion: cannot turn into king', function () {
  const board = new Board()
  setup(board)
  place(board, 1, 4, new Pawn('White'));
  assert.strictEqual(board.move_attempt([1, 4], [0, 4]), 'promotion')
  assert.strictEqual(board.select_promotion('King'), false)
  assert.strictEqual(board.select_promotion('Rook'), true)
  assert.strictEqual(board.at([0, 4]) instanceof Rook, true)
  assert.strictEqual(board.at([1, 4]), null)
  assert.strictEqual(board.turn_num, 1)
})

test('promotion: cannot turn into pawn', function () {
  const board = new Board()
  setup(board)
  place(board, 1, 4, new Pawn('White'));
  assert.strictEqual(board.move_attempt([1, 4], [0, 4]), 'promotion')
  assert.strictEqual(board.select_promotion('Pawn'), false)
  assert.strictEqual(board.select_promotion('Rook'), true)
  assert.strictEqual(board.at([0, 4]) instanceof Rook, true)
  assert.strictEqual(board.at([1, 4]), null)
  assert.strictEqual(board.turn_num, 1)
})

test('promotion: cannot turn into random string', function () {
  const board = new Board()
  setup(board)
  place(board, 1, 4, new Pawn('White'));
  assert.strictEqual(board.move_attempt([1, 4], [0, 4]), 'promotion')
  assert.strictEqual(board.select_promotion('Sfasf'), false)
  assert.strictEqual(board.select_promotion('Rook'), true)
  assert.strictEqual(board.at([0, 4]) instanceof Rook, true)
  assert.strictEqual(board.at([1, 4]), null)
  assert.strictEqual(board.turn_num, 1)
})

test('promotion: can be undone', function () {
  const board = new Board()
  setup(board)
  place(board, 1, 4, new Pawn('White'));
  assert.strictEqual(board.move_attempt([1, 4], [0, 4]), 'promotion')
  assert.strictEqual(board.select_promotion('Bishop'), true)
  assert.strictEqual(board.turn_num, 1)
  assert.strictEqual(board.at([1, 4]), null)
  assert.strictEqual(board.at([0, 4]) instanceof Bishop, true)
  assert.strictEqual(board.at([0, 4]).color, 'White')
  board.undo_last()
  assert.strictEqual(board.turn_num, 0)
  assert.strictEqual(board.at([1, 4]) instanceof Pawn, true)
  assert.strictEqual(board.at([1, 4]).color, 'White')
  assert.strictEqual(board.at([0, 4]), null)
})

test('promotion: cannot promote into check', function () {
  const board = new Board()
  clear(board)
  place(board, 1, 0, new King('White'))
  place(board, 1, 4, new Pawn('White'))
  place(board, 1, 7, new Rook('Black'))
  place(board, 7, 7, new King('Black'))
  assert.strictEqual(board.move_attempt([1, 4], [0, 4]), 'failed')
})

test('undo: can castle again with same rook after undoing a castle', function () {
  const board = new Board()
  setup_castle(board, 'White')
  assert.strictEqual(board.move_attempt([7, 4], [7, 6]), 'succeeded')
  board.undo_last()
  assert.strictEqual(board.at([7, 7]).moved, 0)
  assert.strictEqual(board.move_attempt([7, 4], [7, 6]), 'succeeded')
})

// --- Knight ---

test('knight: L-shape move', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Knight('White'))
  assert.strictEqual(board.move_attempt([4, 4], [2, 5]), 'succeeded')
})

test('knight: all L-shape variants valid', function () {
  const offsets = [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]]
  for (const [dr, dc] of offsets) {
    const board = new Board()
    setup(board)
    place(board, 4, 4, new Knight('White'))
    assert.strictEqual(board.move_attempt([4, 4], [4 + dr, 4 + dc]), 'succeeded', `L-shape [${dr},${dc}] should be valid`)
  }
})

test('knight: jumps over intervening pieces', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Knight('White'))
  place(board, 3, 4, new Pawn('Black'))
  place(board, 4, 5, new Pawn('Black'))
  assert.strictEqual(board.move_attempt([4, 4], [2, 5]), 'succeeded')
})

test('knight: invalid non-L move', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Knight('White'))
  assert.strictEqual(board.move_attempt([4, 4], [4, 6]), 'failed')
})

// --- Bishop ---

test('bishop: diagonal move', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Bishop('White'))
  assert.strictEqual(board.move_attempt([4, 4], [2, 6]), 'succeeded')
})

test('bishop: blocked by piece in path', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Bishop('White'))
  place(board, 3, 5, new Pawn('White'))
  assert.strictEqual(board.move_attempt([4, 4], [2, 6]), 'failed')
})

test('bishop: invalid non-diagonal move', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Bishop('White'))
  assert.strictEqual(board.move_attempt([4, 4], [4, 7]), 'failed')
})

// --- Rook ---

test('rook: horizontal move', function () {
  const board = new Board()
  setup(board)
  const rook = new Rook('White')
  place(board, 4, 0, rook)
  assert.strictEqual(board.move_attempt([4, 0], [4, 6]), 'succeeded')
  assert.strictEqual(board.at([4, 6]), rook)
})

test('rook: vertical move', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Rook('White'))
  assert.strictEqual(board.move_attempt([4, 4], [1, 4]), 'succeeded')
})

test('rook: blocked by piece in path', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Rook('White'))
  place(board, 4, 6, new Pawn('White'))
  assert.strictEqual(board.move_attempt([4, 4], [4, 7]), 'failed')
})

test('rook: captures opponent piece', function () {
  const board = new Board()
  setup(board)
  const rook = new Rook('White')
  const target = new Pawn('Black')
  place(board, 4, 4, rook)
  place(board, 4, 7, target)
  assert.strictEqual(board.move_attempt([4, 4], [4, 7]), 'succeeded')
  assert.strictEqual(board.at([4, 7]), rook)
})

test('rook: cannot capture own piece', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Rook('White'))
  place(board, 4, 7, new Pawn('White'))
  assert.strictEqual(board.move_attempt([4, 4], [4, 7]), 'failed')
})

test('rook: invalid diagonal move', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Rook('White'))
  assert.strictEqual(board.move_attempt([4, 4], [6, 6]), 'failed')
})

// --- Queen ---

test('queen: moves like rook', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Queen('White'))
  assert.strictEqual(board.move_attempt([4, 4], [4, 7]), 'succeeded')
})

test('queen: moves like bishop', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Queen('White'))
  assert.strictEqual(board.move_attempt([4, 4], [2, 6]), 'succeeded')
})

test('queen: blocked by piece on diagonal', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Queen('White'))
  place(board, 3, 5, new Pawn('White'))
  assert.strictEqual(board.move_attempt([4, 4], [2, 6]), 'failed')
})

// --- King ---

test('king: single step in any direction', function () {
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
  for (const [dr, dc] of directions) {
    const board = new Board()
    clear(board)
    place(board, 4, 4, new King('White'))
    place(board, 0, 0, new King('Black'))
    assert.strictEqual(board.move_attempt([4, 4], [4 + dr, 4 + dc]), 'succeeded', `direction [${dr},${dc}] should be valid`)
  }
})

test('king: invalid two-step move', function () {
  const board = new Board()
  setup(board)
  assert.strictEqual(board.move_attempt([7, 7], [5, 7]), 'failed')
})

// --- in_check ---

test('in_check: rook on same rank threatens king', function () {
  const board = new Board()
  clear(board)
  place(board, 4, 4, new King('White'))
  place(board, 0, 0, new King('Black'))
  place(board, 4, 0, new Rook('Black'))
  assert.strictEqual(board.in_check(), true)
})

test('in_check: blocked rook does not threaten king', function () {
  const board = new Board()
  clear(board)
  place(board, 4, 4, new King('White'))
  place(board, 0, 0, new King('Black'))
  place(board, 4, 0, new Rook('Black'))
  place(board, 4, 2, new Pawn('White'))
  assert.strictEqual(board.in_check(), false)
})

test('in_check: no threats', function () {
  const board = new Board()
  clear(board)
  place(board, 4, 4, new King('White'))
  place(board, 0, 0, new King('Black'))
  assert.strictEqual(board.in_check(), false)
})

test('in_check: castling doesn\'t cause in_check infinite loop', function () {
  const board = new Board()
  clear(board)
  place(board, 7, 4, new King('White'))
  place(board, 7, 6, new King('Black'))
  assert.strictEqual(board.in_check(), false)
})

test('in_check: castling-eligible kings are two squares apart does not trigger infinte loop', function () {
  const board = new Board()
  clear(board)
  place(board, 7, 4, new King('White'))
  place(board, 7, 6, new King('Black'))
  place(board, 7, 0, new Rook('Black'))
  place(board, 7, 2, new Knight('White'))
  assert.strictEqual(board.in_check(), false)
})

// --- Check prevention ---

test('move that exposes king to check is rejected', function () {
  const board = new Board()
  clear(board)
  const whiteKing = new King('White')
  const whiteRook = new Rook('White')
  place(board, 7, 4, whiteKing)
  place(board, 7, 3, whiteRook)
  place(board, 0, 0, new King('Black'))
  place(board, 7, 0, new Rook('Black'))

  assert.strictEqual(board.move_attempt([7, 3], [6, 3]), 'failed')
  assert.strictEqual(board.at([7, 3]), whiteRook)
  assert.strictEqual(board.at([6, 3]), null)
})

// --- Undo ---

test('undo: restores moved piece to original square', function () {
  const board = new Board()
  setup(board)
  const rook = new Rook('White')
  place(board, 4, 4, rook)

  board.move_attempt([4, 4], [4, 7])
  assert.strictEqual(board.at([4, 7]), rook)

  board.undo_last()
  assert.strictEqual(board.at([4, 4]), rook)
  assert.strictEqual(board.at([4, 7]), null)
})

test('undo: restores captured piece', function () {
  const board = new Board()
  setup(board)
  const rook = new Rook('White')
  const target = new Pawn('Black')
  place(board, 4, 4, rook)
  place(board, 4, 7, target)

  board.move_attempt([4, 4], [4, 7])
  board.undo_last()
  assert.strictEqual(board.at([4, 4]), rook)
  assert.strictEqual(board.at([4, 7]), target)
})

test('undo: restores en passant captured pawn', function () {
  const board = new Board()
  setup(board)
  const whitePawn = new Pawn('White')
  const blackPawn = new Pawn('Black')
  place(board, 6, 5, whitePawn)
  place(board, 4, 4, blackPawn)

  board.move_attempt([6, 5], [4, 5])
  board.move_attempt([4, 4], [5, 5])

  board.undo_last()
  assert.strictEqual(board.at([4, 4]), blackPawn)
  assert.strictEqual(board.at([4, 5]), whitePawn)
  assert.strictEqual(board.at([5, 5]), null)
})

test('undo: on empty history does nothing', function () {
  const board = new Board()
  board.undo_last()
  assert.strictEqual(board.at([0, 0]) instanceof Rook, true)
})

test('undo: Rook can castle after undo', function () {
  const board = new Board()
  setup_castle(board, 'White')

  assert.strictEqual(board.move_attempt([7, 7], [7, 6]), 'succeeded')
  board.undo_last()
  assert.strictEqual(board.at([7, 4]) instanceof King, true)
  assert.strictEqual(board.at([7, 7]) instanceof Rook, true)
})

test('undo: King can castle after undo', function () {
  const board = new Board()
  setup_castle(board, 'White')

  assert.strictEqual(board.move_attempt([7, 4], [7, 5]), 'succeeded')
  board.undo_last()
  assert.strictEqual(board.at([7, 4]) instanceof King, true)
  assert.strictEqual(board.at([7, 7]) instanceof Rook, true)
})

test('undo: restores before castle', function () {
  const board = new Board()
  setup_castle(board, 'White')

  assert.strictEqual(board.move_attempt([7, 4], [7, 6]), 'succeeded')
  board.undo_last()
  assert.strictEqual(board.at([7, 4]) instanceof King, true)
  assert.strictEqual(board.at([7, 7]) instanceof Rook, true)
  for (let col = 5; col <= 6; col++) {
    assert.strictEqual(board.at([7, col]), null, `col ${col} should be empty after undoing right castle`)
  }

  assert.strictEqual(board.move_attempt([7, 4], [7, 2]), 'succeeded')
  board.undo_last()
  assert.strictEqual(board.at([7, 4]) instanceof King, true)
  assert.strictEqual(board.at([7, 0]) instanceof Rook, true)
  for (let col = 1; col <= 3; col++) {
    assert.strictEqual(board.at([7, col]), null, `col ${col} should be empty after undoing left castle`)
  }
})

test('undo: Can not en passant because of undone double jump', function () {
  const board = new Board()
  setup(board)
  place(board, 1, 3, new Pawn('Black'))
  place(board, 1, 4, new Pawn('White'))
  assert.strictEqual(board.move_attempt([7, 7], [7, 6]), 'succeeded')
  assert.strictEqual(board.move_attempt([1, 3], [3, 3]), 'succeeded')
  board.undo_last()
  assert.strictEqual(board.move_attempt([1, 4], [0, 3]), 'failed')
})

test('undo: Can undo promotion', function () {
  const board = new Board()
  setup(board)
  place(board, 1, 3, new Pawn('White'))
  assert.strictEqual(board.move_attempt([1, 3], [0, 3]), 'promotion')
  assert.strictEqual(board.select_promotion('Queen'), true)
  board.undo_last()
  assert.strictEqual(board.at([1, 3]) instanceof Pawn, true)
  assert.strictEqual(board.at([1, 3]).color, 'White')
  assert.strictEqual(board.at([0, 3]), null)
})

test('undo: Can undo promotion + capture', function () {
  const board = new Board()
  setup(board)
  place(board, 1, 3, new Pawn('White'))
  place(board, 0, 4, new Rook('Black'))
  assert.strictEqual(board.move_attempt([1, 3], [0, 4]), 'promotion')
  assert.strictEqual(board.select_promotion('Queen'), true)
  board.undo_last()
  assert.strictEqual(board.at([1, 3]) instanceof Pawn, true)
  assert.strictEqual(board.at([1, 3]).color, 'White')
  assert.strictEqual(board.at([0, 4]) instanceof Rook, true)
  assert.strictEqual(board.at([0, 4]).color, 'Black')
})


// --- Castling ---

function setup_castle(board, color) {
  clear(board)
  const home_row = color === 'White' ? 7 : 0
  const other_row = color === 'White' ? 0 : 7
  place(board, home_row, 4, new King(color))
  place(board, home_row, 0, new Rook(color))
  place(board, home_row, 7, new Rook(color))
  place(board, other_row, 4, new King(get_other_color(color)))
}

test('Castling: can castle left', function () {
  const board = new Board()
  setup_castle(board, 'White')
  assert.strictEqual(board.move_attempt([7, 4], [7, 2]), 'succeeded')
  assert.strictEqual(board.at([7, 2]) instanceof King, true)
  assert.strictEqual(board.at([7, 3]) instanceof Rook, true)
  assert.strictEqual(board.at([7, 0]), null)
})

test('Castling: can castle right', function () {
  const board = new Board()
  setup_castle(board, 'White')
  assert.strictEqual(board.move_attempt([7, 4], [7, 6]), 'succeeded')
  assert.strictEqual(board.at([7, 6]) instanceof King, true)
  assert.strictEqual(board.at([7, 5]) instanceof Rook, true)
  assert.strictEqual(board.at([7, 7]), null)
})

test('Castling: pieces in the way block', function () {
  const board = new Board()
  setup_castle(board, 'White')
  place(board, 7, 1, new Knight('White'))
  assert.strictEqual(board.move_attempt([7, 4], [7, 2]), 'failed')
  board.board[7][1] = null
  assert.strictEqual(board.move_attempt([7, 4], [7, 2]), 'succeeded')
})

test('Castling: being in check blocks', function () {
  const board = new Board()
  setup_castle(board, 'White')
  place(board, 4, 4, new Rook('Black'))
  assert.strictEqual(board.move_attempt([7, 4], [7, 6]), 'failed')
  board.board[4][4] = null
  assert.strictEqual(board.move_attempt([7, 4], [7, 6]), 'succeeded')
})

test('Castling: check on the way blocks', function () {
  const board = new Board()
  setup_castle(board, 'White')
  place(board, 4, 5, new Rook('Black'))
  assert.strictEqual(board.move_attempt([7, 4], [7, 6]), 'failed')
  board.board[4][5] = null
  assert.strictEqual(board.move_attempt([7, 4], [7, 6]), 'succeeded')
})

test('Castling: King which moved blocks', function () {
  const board = new Board()
  setup_castle(board, 'White')
  board.at([7, 4]).moved = true
  assert.strictEqual(board.move_attempt([7, 4], [7, 6]), 'failed')
  board.at([7, 4]).moved = false
  assert.strictEqual(board.move_attempt([7, 4], [7, 6]), 'succeeded')
})

test('Castling: Rook which moved blocks', function () {
  const board = new Board()
  setup_castle(board, 'White')
  board.at([7, 7]).moved = true
  assert.strictEqual(board.move_attempt([7, 4], [7, 6]), 'failed')
  board.at([7, 7]).moved = false
  assert.strictEqual(board.move_attempt([7, 4], [7, 6]), 'succeeded')
})

test('Castling: Cannot capture', function () {
  const board = new Board()
  setup_castle(board, 'White')
  place(board, 7, 2, new Bishop('Black'))
  assert.strictEqual(board.move_attempt([7, 4], [7, 2]), 'failed')
  board.board[7][2] = null
  assert.strictEqual(board.move_attempt([7, 4], [7, 2]), 'succeeded')
})

// --- in_checkmate / in_stalemate ---

function setup_back_rank_mate(board, escape_square) {
  clear(board)
  place(board, 7, 4, new King('White'))
  for (const col of [3, 4, 5]) {
    if (col !== escape_square) place(board, 6, col, new Pawn('White'))
  }
  place(board, 7, 0, new Rook('Black'))
  place(board, 0, 0, new King('Black'))
}

test('in_checkmate: back rank mate', function () {
  const board = new Board()
  setup_back_rank_mate(board, null)
  assert.strictEqual(board.in_check(), true)
  assert.strictEqual(board.in_checkmate(), true)
  assert.strictEqual(board.in_stalemate(), false)
})

test('in_checkmate: false when king has an escape square', function () {
  const board = new Board()
  setup_back_rank_mate(board, 5)
  assert.strictEqual(board.in_check(), true)
  assert.strictEqual(board.in_checkmate(), false)
  assert.strictEqual(board.in_stalemate(), false)
})

test('in_checkmate: false on fresh board', function () {
  const board = new Board()
  assert.strictEqual(board.in_checkmate(), false)
})

function setup_king_queen_stalemate(board) {
  clear(board)
  place(board, 0, 7, new King('Black'))
  place(board, 1, 5, new King('White'))
  place(board, 2, 6, new Queen('White'))
  place(board, 6, 0, new Pawn('White'))
  assert.strictEqual(board.move_attempt([6, 0], [5, 0]), 'succeeded')
  assert.strictEqual(board.turn, 'Black')
}

test('in_stalemate: king and queen stalemate', function () {
  const board = new Board()
  setup_king_queen_stalemate(board)
  assert.strictEqual(board.in_check(), false)
  assert.strictEqual(board.in_stalemate(), true)
  assert.strictEqual(board.in_checkmate(), false)
})

test('in_stalemate: false when a legal move exists', function () {
  const board = new Board()
  clear(board)
  place(board, 0, 7, new King('Black'))
  place(board, 5, 5, new King('White'))
  place(board, 6, 0, new Pawn('White'))
  assert.strictEqual(board.move_attempt([6, 0], [5, 0]), 'succeeded')
  assert.strictEqual(board.turn, 'Black')
  assert.strictEqual(board.in_check(), false)
  assert.strictEqual(board.in_stalemate(), false)
})

test('in_stalemate: false when in checkmate', function () {
  const board = new Board()
  setup_back_rank_mate(board, null)
  assert.strictEqual(board.in_stalemate(), false)
})

test('in_stalemate: false on fresh board', function () {
  const board = new Board()
  assert.strictEqual(board.in_stalemate(), false)
})

test('integration: capute pawn start', function () {
  const board = new Board()
  assert.strictEqual(board.move_attempt([6, 4], [4,4]), 'succeeded')
  assert.strictEqual(board.in_stalemate(),false)
  assert.strictEqual(board.in_checkmate(),false)
  assert.strictEqual(board.move_attempt([1, 3], [3,3]), 'succeeded')
  assert.strictEqual(board.in_stalemate(),false)
  assert.strictEqual(board.in_checkmate(),false)
  assert.strictEqual(board.move_attempt([4, 4], [3,3]), 'succeeded')
  assert.strictEqual(board.in_stalemate(),false)
  assert.strictEqual(board.in_checkmate(),false)
})
