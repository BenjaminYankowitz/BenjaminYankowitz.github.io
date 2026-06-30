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
    assert.strictEqual(piece_black instanceof expected[col], `col ${col}: expected ${expected[col].name}, got ${piece_black?.constructor.name}`, true)
    assert.strictEqual(piece_black.color, 'Black', `col ${col}: expected Black ${piece_black?.constructor.name}, got ${piece_black.color}`)
    const piece_white = board.at([7, col])
    assert.strictEqual(piece_white instanceof expected[col], `col ${col}: expected ${expected[col].name}, got ${piece_white?.constructor.name}`, true)
    assert.strictEqual(piece_white.color, 'White', `col ${col}: expected White ${piece_white?.constructor.name}, got ${piece_white.color}`)
  }
})

// --- board setup correctly ---

test('board init: pawns correct', function () {
  const board = new Board()
  for (let col = 0; col < 8; col++) {
    const piece_black = board.at([1, col])
    assert.strictEqual(piece_black instanceof Pawn, `col ${col} expected pawn, got ${piece_black?.constructor.name}`, true)
    assert.strictEqual(piece_black.color, 'Black', `col ${col} expected black pawn, got ${piece_black.color}`)
    const piece_white = board.at([6, col])
    assert.strictEqual(piece_white instanceof Pawn, `col ${col} expected pawn, got ${piece_white?.constructor.name}`, true)
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
  const whitePawn = new Pawn('White')
  const blackPawn = new Pawn('Black')
  place(board, 6, 5, whitePawn)
  place(board, 4, 4, blackPawn)

  assert.strictEqual(board.move_attempt([6, 5], [4, 5]), true)
  assert.strictEqual(board.move_attempt([4, 4], [5, 5]), true)
  assert.strictEqual(board.at([4, 5]), null)
  assert.strictEqual(board.at([5, 5]), blackPawn)
})

test('en passant: invalid one turn after double jump', function () {
  const board = new Board()
  setup(board)

  const whitePawn = new Pawn('White')
  place(board, 6, 5, whitePawn)
  const blackPawn = new Pawn('Black')
  place(board, 4, 4, blackPawn)

  assert.strictEqual(board.move_attempt([6, 5], [4, 5]), true)
  assert.strictEqual(board.move_attempt([0, 0], [1, 0]), true)
  assert.strictEqual(board.move_attempt([7, 7], [6, 7]), true)
  assert.strictEqual(board.move_attempt([4, 4], [5, 5]), false)
})