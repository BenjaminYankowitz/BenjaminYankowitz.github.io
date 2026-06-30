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

test('board init: back ranks correct', function() {
  const board = new Board()
  const expected = [Rook, Knight, Bishop, Queen, King, Bishop, Knight, Rook]
  for (let col = 0; col < 8; col++) {
    const piece_black = board.at([0, col])
    assert.ok(piece_black instanceof expected[col], `col ${col}: expected ${expected[col].name}, got ${piece_black?.constructor.name}`)
    assert.equal(piece_black.color, 'Black', `col ${col}: expected Black ${piece_black?.constructor.name}, got ${piece_black.color}`)
    const piece_white = board.at([7, col])
    assert.ok(piece_white instanceof expected[col], `col ${col}: expected ${expected[col].name}, got ${piece_white?.constructor.name}`)
    assert.equal(piece_white.color, 'White',`col ${col}: expected White ${piece_white?.constructor.name}, got ${piece_white.color}`)
  }
})

// --- board setup correctly ---

test('board init: pawns correct', function() {
  const board = new Board()
  for (let col = 0; col < 8; col++) {
    const piece_black = board.at([1, col])
    assert.ok(piece_black instanceof Pawn, `col ${col} expected pawn, got ${piece_black?.constructor.name}`)
    assert.equal(piece_black.color, 'Black', `col ${col} expected black pawn, got ${piece_black.color}`)
    const piece_white = board.at([6, col])
    assert.ok(piece_white instanceof Pawn, `col ${col} expected pawn, got ${piece_white?.constructor.name}`)
    assert.equal(piece_white.color, 'White', `col ${col} expected white pawn, got ${piece_white.color}`)
  }
})

test('board init: rows 2-5 empty', function() {
  const board = new Board()
  for (let row = 2; row <= 5; row++)
    for (let col = 0; col < 8; col++)
      assert.equal(board.at([row, col]), null, `row ${row} col ${col} should be empty`)
})


// --- Turn tracking ---

test('turn: goes White, Black, White', function() {
  const board = new Board()
  assert.equal(board.turn, 'White')
  assert.ok(board.move_attempt([6, 0], [5, 0]))
  assert.equal(board.turn, 'Black')
  assert.ok(board.move_attempt([1, 0], [2, 0]))
  assert.equal(board.turn, 'White')
})

test('turn: counts correctly', function() {
  const board = new Board()
  assert.equal(board.turn_num, 0)
  assert.ok(board.move_attempt([6, 1], [5, 1]))
  assert.equal(board.turn_num, 1)
  assert.ok(board.move_attempt([1, 1], [2, 1]))
  assert.equal(board.turn_num, 2)
})

// --- valid_select ---

test('valid_select: empty square', function() {
  const board = new Board()
  assert.equal(board.valid_select([4, 4]), false)
})

test('valid_select: Black piece on White turn', function() {
  const board = new Board()
  assert.equal(board.valid_select([1, 0]), false)
})

test('valid_select: White piece on Black turn', function() {
  const board = new Board()
  assert.ok(board.move_attempt([6, 2], [5, 2]))
  assert.equal(board.valid_select([7, 0]), false)
})

test('valid_select: White piece on White turn', function() {
  const board = new Board()
  assert.equal(board.valid_select([6, 0]), true)
})

test('valid_select: Black piece on Black turn', function() {
  const board = new Board()
  assert.ok(board.move_attempt([6, 3], [5, 3]))
  assert.equal(board.valid_select([1, 0]), true)
})