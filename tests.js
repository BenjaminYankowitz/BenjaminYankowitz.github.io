import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Board, Pawn, Knight, Bishop, Rook, Queen, King, board_dim } from './main.js'

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
  assert.strictEqual(board.move_attempt([6, 0], [5, 0]), true)
  assert.strictEqual(board.turn, 'Black')
  assert.strictEqual(board.move_attempt([1, 0], [2, 0]), true)
  assert.strictEqual(board.turn, 'White')
})

test('turn: counts correctly', function () {
  const board = new Board()
  assert.strictEqual(board.turn_num, 0)
  assert.strictEqual(board.move_attempt([6, 1], [5, 1]), true)
  assert.strictEqual(board.turn_num, 1)
  assert.strictEqual(board.move_attempt([1, 1], [2, 1]), true)
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
  assert.strictEqual(board.move_attempt([6, 2], [5, 2]), true)
  assert.strictEqual(board.valid_select([7, 0]), false)
})

test('valid_select: White piece on White turn', function () {
  const board = new Board()
  assert.strictEqual(board.valid_select([6, 0]), true)
})

test('valid_select: Black piece on Black turn', function () {
  const board = new Board()
  assert.strictEqual(board.move_attempt([6, 3], [5, 3]), true)
  assert.strictEqual(board.valid_select([1, 0]), true)
})

// --- Pawn ---

test('pawn: single step forward (White)', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Pawn('White'))
  assert.strictEqual(board.move_attempt([4, 4], [3, 4]), true)
})

test('pawn: double step from home row (White row 6)', function () {
  const board = new Board()
  setup(board)
  place(board, 6, 4, new Pawn('White'))
  assert.strictEqual(board.move_attempt([6, 4], [4, 4]), true)
})

test('pawn: double step rejected from non-home row', function () {
  const board = new Board()
  setup(board)
  place(board, 5, 4, new Pawn('White'))
  assert.strictEqual(board.move_attempt([5, 4], [3, 4]), false)
})

test('pawn: blocked by piece directly ahead', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Pawn('White'))
  place(board, 3, 4, new Pawn('Black'))
  assert.strictEqual(board.move_attempt([4, 4], [3, 4]), false)
})

test('pawn: cannot move backward', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Pawn('White'))
  assert.strictEqual(board.move_attempt([4, 4], [5, 4]), false)
})

test('pawn: diagonal capture of opponent', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Pawn('White'))
  place(board, 3, 5, new Pawn('Black'))
  assert.strictEqual(board.move_attempt([4, 4], [3, 5]), true)
})

test('pawn: cannot move diagonally to empty square', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Pawn('White'))
  assert.strictEqual(board.move_attempt([4, 4], [3, 5]), false)
})

test('pawn: double step from home row (Black row 1)', function () {
  const board = new Board()
  setup(board)
  assert.strictEqual(board.move_attempt([7, 7], [6, 7]), true)
  place(board, 1, 4, new Pawn('Black'))
  assert.strictEqual(board.move_attempt([1, 4], [3, 4]), true)
})

// --- En passant ---

test('en passant: Black captures White immediately after double jump', function () {
  const board = new Board()
  setup(board)
  const white_pawn = new Pawn('White')
  const black_pawn = new Pawn('Black')
  place(board, 6, 5, white_pawn)
  place(board, 4, 4, black_pawn)

  assert.strictEqual(board.move_attempt([6, 5], [4, 5]), true)
  assert.strictEqual(board.move_attempt([4, 4], [5, 5]), true)
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

  assert.strictEqual(board.move_attempt([6, 5], [4, 5]), true)
  assert.strictEqual(board.move_attempt([0, 0], [1, 0]), true)
  assert.strictEqual(board.move_attempt([7, 7], [6, 7]), true)
  assert.strictEqual(board.move_attempt([4, 4], [5, 5]), false)
})

test('promotion: can turn into queen', function () {
  const board = new Board()
  setup(board)
  place(board, 1, 4, new Pawn('White'));
  assert.strictEqual(board.move_attempt([1, 4], [0, 4]), "promotion")
  assert.strictEqual(board.select_promotion("Queen"), true)
  assert.strictEqual(board.turn_num, 1)
  assert.strictEqual(board.at([1, 4]), null)
  assert.strictEqual(board.at([0, 4]) instanceof Queen, true)
})

test('promotion: can turn into rook', function () {
  setup(board)
  place(board, 1, 4, new Pawn('White'));
  assert.strictEqual(board.move_attempt([1, 4], [0, 4]), "promotion")
  assert.strictEqual(board.select_promotion("Rook"), true)
  assert.strictEqual(board.turn_num, 1)
  assert.strictEqual(board.at([1, 4]), null)
  assert.strictEqual(board.at([0, 4]) instanceof Rook, true)
})

test('promotion: cannot turn into king', function () {
  setup(board)
  place(board, 1, 4, new Pawn('White'));
  assert.strictEqual(board.move_attempt([1, 4], [0, 4]), "promotion")
  assert.strictEqual(board.select_promotion("King"), false)
  assert.strictEqual(board.turn_num, 0)
  assert.strictEqual(board.at([1, 4]) instanceof Pawn, true)
  assert.strictEqual(board.at([0, 4]), null)
})

test('promotion: cannot turn into pawn', function () {
  setup(board)
  place(board, 1, 4, new Pawn('White'));
  assert.strictEqual(board.move_attempt([1, 4], [0, 4]), "promotion")
  assert.strictEqual(board.select_promotion("Pawn"), false)
  assert.strictEqual(board.turn_num, 0)
  assert.strictEqual(board.at([1, 4]) instanceof Pawn, true)
  assert.strictEqual(board.at([0, 4]), null)
})

test('promotion: cannot turn into random string', function () {
  setup(board)
  place(board, 1, 4, new Pawn('White'));
  assert.strictEqual(board.move_attempt([1, 4], [0, 4]), "promotion")
  assert.strictEqual(board.select_promotion("Sfasf"), false)
  assert.strictEqual(board.turn_num, 0)
  assert.strictEqual(board.at([1, 4]) instanceof Pawn, true)
  assert.strictEqual(board.at([0, 4]), null)
})

test('promotion: can be undone', function () {
  setup(board)
  place(board, 1, 4, new Pawn('White'));
  assert.strictEqual(board.move_attempt([1, 4], [0, 4]), "promotion")
  assert.strictEqual(board.select_promotion("Bishop"), true)
  assert.strictEqual(board.turn_num, 1)
  assert.strictEqual(board.at([1, 4]), null)
  assert.strictEqual(board.at([0, 4]) instanceof Bishop, true)
  board.undo_last()
  assert.strictEqual(board.turn_num, 0)
  assert.strictEqual(board.at([1, 4]) instanceof Pawn, true)
  assert.strictEqual(board.at([0, 4]), null)
})

// --- Knight ---

test('knight: L-shape move', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Knight('White'))
  assert.strictEqual(board.move_attempt([4, 4], [2, 5]), true)
})

test('knight: all L-shape variants valid', function () {
  const offsets = [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]]
  for (const [dr, dc] of offsets) {
    const board = new Board()
    setup(board)
    place(board, 4, 4, new Knight('White'))
    assert.strictEqual(board.move_attempt([4, 4], [4 + dr, 4 + dc]), true, `L-shape [${dr},${dc}] should be valid`)
  }
})

test('knight: jumps over intervening pieces', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Knight('White'))
  place(board, 3, 4, new Pawn('Black'))
  place(board, 4, 5, new Pawn('Black'))
  assert.strictEqual(board.move_attempt([4, 4], [2, 5]), true)
})

test('knight: invalid non-L move', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Knight('White'))
  assert.strictEqual(board.move_attempt([4, 4], [4, 6]), false)
})

// --- Bishop ---

test('bishop: diagonal move', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Bishop('White'))
  assert.strictEqual(board.move_attempt([4, 4], [2, 6]), true)
})

test('bishop: blocked by piece in path', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Bishop('White'))
  place(board, 3, 5, new Pawn('White'))
  assert.strictEqual(board.move_attempt([4, 4], [2, 6]), false)
})

test('bishop: invalid non-diagonal move', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Bishop('White'))
  assert.strictEqual(board.move_attempt([4, 4], [4, 7]), false)
})

// --- Rook ---

test('rook: horizontal move', function () {
  const board = new Board()
  setup(board)
  const rook = new Rook('White')
  place(board, 4, 0, rook)
  assert.strictEqual(board.move_attempt([4, 0], [4, 6]), true)
  assert.strictEqual(board.at([4, 6]), rook)
})

test('rook: vertical move', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Rook('White'))
  assert.strictEqual(board.move_attempt([4, 4], [1, 4]), true)
})

test('rook: blocked by piece in path', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Rook('White'))
  place(board, 4, 6, new Pawn('White'))
  assert.strictEqual(board.move_attempt([4, 4], [4, 7]), false)
})

test('rook: captures opponent piece', function () {
  const board = new Board()
  setup(board)
  const rook = new Rook('White')
  const target = new Pawn('Black')
  place(board, 4, 4, rook)
  place(board, 4, 7, target)
  assert.strictEqual(board.move_attempt([4, 4], [4, 7]), true)
  assert.strictEqual(board.at([4, 7]), rook)
})

test('rook: cannot capture own piece', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Rook('White'))
  place(board, 4, 7, new Pawn('White'))
  assert.strictEqual(board.move_attempt([4, 4], [4, 7]), false)
})

test('rook: invalid diagonal move', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Rook('White'))
  assert.strictEqual(board.move_attempt([4, 4], [6, 6]), false)
})

// --- Queen ---

test('queen: moves like rook', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Queen('White'))
  assert.strictEqual(board.move_attempt([4, 4], [4, 7]), true)
})

test('queen: moves like bishop', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Queen('White'))
  assert.strictEqual(board.move_attempt([4, 4], [2, 6]), true)
})

test('queen: blocked by piece on diagonal', function () {
  const board = new Board()
  setup(board)
  place(board, 4, 4, new Queen('White'))
  place(board, 3, 5, new Pawn('White'))
  assert.strictEqual(board.move_attempt([4, 4], [2, 6]), false)
})

// --- King ---

test('king: single step in any direction', function () {
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
  for (const [dr, dc] of directions) {
    const board = new Board()
    clear(board)
    place(board, 4, 4, new King('White'))
    place(board, 0, 0, new King('Black'))
    assert.strictEqual(board.move_attempt([4, 4], [4 + dr, 4 + dc]), true, `direction [${dr},${dc}] should be valid`)
  }
})

test('king: invalid two-step move', function () {
  const board = new Board()
  setup(board)
  assert.strictEqual(board.move_attempt([7, 7], [5, 7]), false)
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

  assert.strictEqual(board.move_attempt([7, 3], [6, 3]), false)
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