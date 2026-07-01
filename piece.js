/*
Copyright 2026 Benjamin Yankowitz
This file is part of JavascriptChess.
JavascriptChess is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
JavascriptChess is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with JavascriptChess. If not, see <https://www.gnu.org/licenses/>. 
*/

import { in_bounds, point_equal, point_add, point_dif, board_dim, clamp } from './util.js'

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
    console.assert(is_queen_move(from, to), `Base impl of path_clear only supports queen moves, tried moving a ${this.name} from ${from[0]}, ${from[1]} to ${to[0]}, ${to[1]}`)
    let crow = from[0] + jy
    let ccol = from[1] + jx
    for (let i = 1; i < Math.max(Math.abs(dx), Math.abs(dy)); i++) {
      let s_piece = board.at([crow, ccol])
      if (s_piece !== null) {
        return false
      }
      crow += jy
      ccol += jx
    }
    return true
  }
  alert_undo() { }
  valid_pair(from, to) {
    return in_bounds(from) && in_bounds(to) && !point_equal(from, to)
  }
  is_legal_basic(from, to, board) {
    const dest_piece = board.at(to)
    return this.valid_pair(from, to) && (dest_piece?.color !== this.color) && this.valid_path(from, to, board) && this.path_clear(from, to, board)
  }
  execute_move(from, to, board) {
    board.move(from, to)
  }
  move_attempt(from, to, board) {
    console.assert(board.at(from) === this, 'Tried to get one piece to move another')
    if (!this.is_legal_basic(from, to, board)) {
      return 'failed'
    }
    const execution = this.execute_move(from, to, board)
    if (board.in_check()) {
      board.undo_current(from, to)
      return 'failed'
    }
    if (typeof execution === 'string') {
      return execution
    }
    board.commit_move(from, to);
    return 'succeeded'
  }
}

export class Pawn extends Piece {
  constructor(color) {
    super(color)
  }
  execute_move(from, to, board) {
    const [dy, dx] = point_dif(to, from)
    if (dx !== 0 && board.at(to) === null) {
      board.capture([from[0], to[1]])
    }
    super.execute_move(from, to, board)
    if (to[0] === 0 || to[0] === board_dim - 1) {
      board.current_move = [from,to]
      board.in_promotion = true
      return 'promotion'
    }
  }
  valid_path(from, to, board) {
    const [dy, dx] = point_dif(to, from)
    let color_dir = 1
    let home_row = 1
    if (this.color === 'White') {
      color_dir = -1
      home_row = 6
    }
    if (dy * color_dir <= 0) {
      return false
    }
    if (Math.abs(dy) > 2) {
      return false
    }
    if (Math.abs(dx) >= 2) {
      return false
    }
    if (Math.abs(dy) === 2 && (dx !== 0 || from[0] !== home_row)) {
      return false
    }
    if (dx !== 0 && board.at(to) === null) {
      const enpassant_piece_pos = point_add(to, [-color_dir, 0])
      const enpassant_piece = board.at(enpassant_piece_pos)
      const last_hist = board.history[board.history.length - 1]
      if (!(enpassant_piece instanceof Pawn) || enpassant_piece.color === this.color || last_hist === undefined) {
        return false;
      }
      const [pfrom, pto, _] = last_hist
      if (!point_equal(pto, enpassant_piece_pos) || Math.abs(pfrom[0] - from[0]) != 2) {
        return false
      }
    }
    if (dx === 0 && board.at(to) !== null) {
      return false
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

function is_bishop_move(from, to) {
  const [dy, dx] = point_dif(to, from)
  let abs_dy = Math.abs(dy)
  let abs_dx = Math.abs(dx)
  return abs_dx === abs_dy
}

export class Bishop extends Piece {
  constructor(color) {
    super(color)
  }
  valid_path(from, to, board) {
    return is_bishop_move(from, to)
  }
}

function is_rook_move(from, to) {
  const [dy, dx] = point_dif(to, from)
  return dy === 0 || dx === 0
}

export class Rook extends Piece {
  constructor(color) {
    super(color)
    this.moved = 0
  }
  execute_move(from, to, board) {
    this.moved++
    super.execute_move(from, to, board)
  }
  valid_path(from, to, board) {
    return is_rook_move(from, to)
  }
  alert_undo() {
    this.moved--
  }
}

function is_queen_move(from, to) {
  return is_rook_move(from, to) || is_bishop_move(from, to)
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
  static get_rook_x(dx) {
    return dx === 2 ? board_dim - 1 : 0
  }
  constructor(color) {
    super(color)
    this.moved = 0
  }
  execute_move(from, to, board) {
    const [dy, dx] = point_dif(to, from)
    this.moved++
    super.execute_move(from, to, board)
    if (Math.abs(dx) === 2) {
      const rook_pos = [from[0], King.get_rook_x(dx)]
      board.at(rook_pos).execute_move(rook_pos, [to[0], to[1] - dx / 2], board)
    }
  }
  path_clear(from, to, board) {
    const [dy, dx] = point_dif(to, from)
    if (Math.max(Math.abs(dy), Math.abs(dx)) === 1) {
      return true
    }
    return super.path_clear(from, [from[0], King.get_rook_x(dx)], board) && !board.in_check([from[0], from[1] + dx / 2])
  }
  valid_path(from, to, board) {
    const [dy, dx] = point_dif(to, from)
    if (Math.abs(dx) === 2 && dy === 0 && this.moved == 0) {
      const rook = board.at([from[0], King.get_rook_x(dx)])
      if (rook instanceof Rook && rook.color == this.color && rook.moved == 0 && !board.in_check()) {
        return true
      }
    }
    return Math.max(Math.abs(dy), Math.abs(dx)) === 1
  }
  alert_undo() {
    this.moved--
  }
}

export const promote_able_type = [
  Rook, Knight, Bishop, Queen
]

export const promote_able = promote_able_type.map(function (piece) { return piece.name })

export const piece_from_char = {
  'p': Pawn,
  'R': Rook,
  'N': Knight,
  'B': Bishop,
  'Q': Queen,
  'K': King,
}
