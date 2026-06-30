/*
Copyright 2026 Benjamin Yankowitz
This file is part of JavascriptChess.
JavascriptChess is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
JavascriptChess is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with JavascriptChess. If not, see <https://www.gnu.org/licenses/>. 
*/

/* Todo 
add unit tests
add castling
add promotion
add checkmate detection
add ui stating checkmate status and current turn
add stalemate detection
*/ 

export const board_dim = 8

const unicode_pieces = {
  White: {
    King: '♔',
    Queen: '♕',
    Rook: '♖',
    Bishop: '♗',
    Knight: '♘',
    Pawn: '♙'
  },
  Black: {
    King: '♚',
    Queen: '♛',
    Rook: '♜',
    Bishop: '♝',
    Knight: '♞',
    Pawn: '♟'
  },
  Empty: ' '
}

function board_as_string(board, piece_to_char) {
  let str = '-'.repeat(board_dim * 4 + 1)
  str += '\n'
  for (let row = 0; row < board_dim; row++) {
    str += '|'
    for (let col = 0; col < board_dim; col++) {
      let piece = board.at([row, col])
      let symbol
      if (piece === null) {
        symbol = piece_to_char.Empty
      } else {
        symbol = piece_to_char[piece.color][piece.piece_name]
      }
      str += ' ' + symbol + ' '
      str += '|'
    }
    str += '\n'
    str += '-'.repeat(board_dim * 4 + 1)
    str += '\n'
  }
  return str
}

function clamp(n) {
  return Math.min(Math.max(n, -1), 1)
}

function point_dif(to, from) {
  return [to[0] - from[0], to[1] - from[1]]
}

function point_add(point, dif) {
  return [point[0] + dif[0], point[1] + dif[1]]
}

function point_equal(point1, point2) {
  return point1[0] === point2[0] && point1[1] === point2[1]
}

function is_rook_move(from, to) {
  const [dy, dx] = point_dif(to, from)
  return dy === 0 || dx === 0
}

function is_bishop_move(from, to) {
  const [dy, dx] = point_dif(to, from)
  let abs_dy = Math.abs(dy)
  let abs_dx = Math.abs(dx)
  return abs_dx === abs_dy
}

function is_queen_move(from, to) {
  return is_rook_move(from, to) || is_bishop_move(from, to)
}

class Piece {
  constructor(color) {
    this.color = color
  }
  get name() {
    return this.color + ' ' + this.piece_name
  }
  get piece_name() { return this.constructor.name }
  path_clear(from, to, board) {
    const [dy, dx] = point_dif(to, from)
    const jx = clamp(dx)
    const jy = clamp(dy)
    console.assert(is_queen_move(from, to), "Base impl of path_clear only supports queen moves")
    let crow = from[0] + jy
    let ccol = from[1] + jx
    for (let i = 1; i < Math.max(Math.abs(dx), Math.abs(dy)); i++) {
      let s_piece = board.at([crow, ccol])
      if (s_piece != null) {
        return false
      }
      crow += jy
      ccol += jx
    }
    return true
  }
  valid_pair(from, to) {
    return Board.in_bounds(from) && Board.in_bounds(to) && !point_equal(from, to)
  }
  is_legal_basic(from, to, board) {
    const dest_piece = board.at(to)
    return this.valid_pair(from, to) && dest_piece?.color != this.color && this.valid_path(from, to, board) && this.path_clear(from, to, board)
  }
  execute_move(from, to, board) {
    board.move(from, to)
  }
  move_attempt(from, to, board) {
    console.assert(board.at(from) === this, "Tried to get one piece to move another")
    if (!this.is_legal_basic(from, to, board)) {
      return false
    }
    this.execute_move(from, to, board)
    if (board.in_check()) {
      board.undo_current(from, to)
      return false
    }
    board.commit_move(from, to);
    return true
  }
}

export class Pawn extends Piece {
  constructor(color) {
    super(color)
    this.double_jump_turn = -1
  }
  execute_move(from, to, board) {
    const [dy, dx] = point_dif(to, from)
    if (Math.abs(dy) === 2) {
      this.double_jump_turn = board.turn_num
    } else if (dx != 0 && board.at(to) === null) {
      board.capture([from[0], to[1]])
    }
    super.execute_move(from, to, board)
  }
  valid_path(from, to, board) {
    const [dy, dx] = point_dif(to, from)
    let color_dir = 1
    let home_row = 1
    if (this.color === "White") {
      color_dir = -1
      home_row = 6
    }
    if (dy * color_dir <= 0) {
      return false
    }
    if (Math.abs(dy) > 2) {
      return false
    }
    if (Math.abs(dy) === 2 && (dx != 0 || from[0] != home_row)) {
      return false
    }
    if (dx != 0 && board.at(to) === null) {
      let enpassant_piece = board.at(point_add(to, [-color_dir, 0]))
      if (!(enpassant_piece instanceof Pawn) || enpassant_piece.double_jump_turn !== board.turn_num - 1 || this.piece_color === this.color) {
        return false
      }
    }
    return true
  }
}

export class Knight extends Piece {
  constructor(color) {
    super(color)
  }
  valid_path(from, to, board) {
    const [dy, dx] = point_dif(to, from)
    let abs_dy = Math.abs(dy)
    let abs_dx = Math.abs(dx)
    return Math.min(abs_dy, abs_dx) === 1 && Math.max(abs_dy, abs_dx) === 2
  }
  path_clear(from, to, board) {
    return true
  }
}

export class Bishop extends Piece {
  constructor(color) {
    super(color)
  }
  valid_path(from, to, board) {
    return is_bishop_move(from, to)
  }
}

export class Rook extends Piece {
  constructor(color) {
    super(color)
    this.moved = false
  }
  execute_move(from, to, board) {
    this.moved = true
    super.execute_move(from, to, board)
  }
  valid_path(from, to, board) {
    return is_rook_move(from, to)
  }
}

export class Queen extends Piece {
  constructor(color) {
    super(color)
  }
  valid_path(from, to, board) {
    return is_queen_move(from, to)
  }
}

export class King extends Piece {
  constructor(color) {
    super(color)
    this.moved = false
  }
  execute_move(from, to, board) {
    this.moved = true
    super.execute_move(from, to, board)
  }
  path_clear(from, to, board) {
    return true // To do add checking for castling
  }
  valid_path(from, to, board) {
    const [dy, dx] = point_dif(to, from)
    return Math.max(Math.abs(dy), Math.abs(dx)) === 1 // To do add checking for castling
  }
}

export const piece_from_char = {
  'p': Pawn,
  'R': Rook,
  'N': Knight,
  'B': Bishop,
  'Q': Queen,
  'K': King,
}
export class Board {
  static in_bounds(spot) {
    return spot[0] >= 0 && spot[0] < board_dim && spot[1] >= 0 && spot[1] < board_dim
  }
  constructor() {
    this.history = []
    this.current_turn_capture = null
    const basic_setup = [
      "p p p p p p p p",
      "R N B Q K B N R"]
    console.assert(basic_setup.length === 2, "BOard setup string not 2 high")
    let basic_setup_top = basic_setup[0].split(' ')
    let basic_setup_bottom = basic_setup[1].split(' ')
    console.assert(basic_setup_top.length === board_dim && basic_setup_bottom.length === board_dim, "Board setup string not 8 accross")
    this.board = Array(board_dim).fill().map(() => Array(board_dim).fill(null))
    for (let i in this.board) {
      let top = piece_from_char[basic_setup_top[i]]
      let bottom = piece_from_char[basic_setup_bottom[i]]
      this.board[0][i] = new bottom("Black")
      this.board[1][i] = new top("Black")
      this.board[6][i] = new top("White")
      this.board[7][i] = new bottom("White")
    }
  }
  undo_last() {
    const action = this.history.pop()
    if (action !== undefined) {
      this.undo(...action)
    }
  }
  undo(from, to, caputre_info) {
    this.board[from[0]][from[1]] = this.at(to)
    this.board[to[0]][to[1]] = null
    if (caputre_info === null) {
      return
    }
    this.board[caputre_info[0][0]][caputre_info[0][1]] = caputre_info[1]
  }
  undo_current(from, to) {
    this.undo(from, to, this.current_turn_capture)
    this.current_turn_capture = null
  }
  commit_move(from, to) {
    this.history.push([from, to, this.current_turn_capture])
    this.current_turn_capture = null
  }
  in_check() {
    const turn = this.turn
    let attackers = []
    let king = null
    for (let row = 0; row < board_dim; row++) {
      for (let col = 0; col < board_dim; col++) {
        const piece = this.at([row, col])
        if (piece === null) {
          continue
        }
        if (piece.color !== turn) {
          attackers.push([row, col])
        } else if (piece instanceof King) {
          king = [row, col]
        }
      }
    }
    console.assert(king !== null, "There must be king of both colors on the board")
    for (let i = 0; i < attackers.length; i++) {
      if (this.at(attackers[i]).is_legal_basic(attackers[i], king, this)) {
        return true
      }
    }
    return false
  }
  get turn_num() {
    return this.history.length
  }
  get turn() {
    if (this.turn_num % 2 == 0) {
      return "White"
    } else {
      return "Black"
    }
  }
  at(spot) {
    console.assert(Board.in_bounds(spot), "Can only access points in bounds")
    return this.board[spot[0]][spot[1]]
  }
  capture(spot) {
    console.assert(this.at(spot) !== null, "Cannot capture nothing")
    this.current_turn_capture = [spot, this.at(spot)]
    this.board[spot[0]][spot[1]] = null
  }
  move_attempt(from, to) {
    return this.at(from).move_attempt(from, to, this)
  }
  valid_select(spot) {
    if (!Board.in_bounds(spot)) {
      return false
    }
    let piece = this.at(spot)
    return piece != null && piece.color === this.turn
  }
  move(from, to) {
    if (this.at(to) !== null) {
      this.capture(to)
    }
    this.board[to[0]][to[1]] = this.at(from)
    this.board[from[0]][from[1]] = null
  }
}

export async function load_images() {
  let images = {}
  let to_load = 0
  for (let [_, piece] of Object.entries(piece_from_char)) {
    const colors = ["Black", "White"]
    for (let i = 0; i < colors.length; i++) {
      let full_name = colors[i] + ' ' + piece.name
      images[full_name] = new Image()
      images[full_name].src = 'assets/' + full_name + '.svg'
      images[full_name].loading = 'eager'
    }
  }
  for (let [_, image] of Object.entries(images)) {
    await image.decode()
  }
  return images
}

export function draw_board(canvas_context, square_size, images, board, black_color, white_color) {
  for (let row = 0; row < board_dim; row++) {
    for (let col = 0; col < board_dim; col++) {
      let piece = board.at([row, col])
      if ((row + col) % 2 === 0) {
        canvas_context.fillStyle = white_color
      } else {
        canvas_context.fillStyle = black_color
      }
      canvas_context.fillRect(col * square_size, row * square_size, square_size, square_size)
      if (piece != null) {
        let image = images[piece.name]
        const piece_scale = 20 / 24
        const piece_offset = (1 - piece_scale) / 2
        canvas_context.drawImage(image, (col + piece_offset) * square_size, (row + piece_offset) * square_size, square_size * piece_scale, square_size * piece_scale)
      }
    }
  }
}