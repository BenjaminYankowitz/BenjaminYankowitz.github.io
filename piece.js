/*
Copyright 2026 Benjamin Yankowitz
This file is part of JavascriptChess.
JavascriptChess is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
JavascriptChess is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with JavascriptChess. If not, see <https://www.gnu.org/licenses/>. 
*/

import { game_assert, in_bounds, point_equal, point_add, point_dif, board_dim, clamp, valid_pair } from './util.js'

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
    game_assert(is_queen_move(from, to), `Base impl of path_clear only supports queen moves, tried moving a ${this.name} from ${from[0]}, ${from[1]} to ${to[0]}, ${to[1]}`)
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
  is_legal_basic(from, to, board) {
    return valid_pair(from, to) && (board.at(to)?.color !== this.color) && this.valid_path(from, to, board) && this.path_clear(from, to, board)
  }
  alert_undo() { }
  pre_move_hook(board) { }
  valid_path(from, to, board) {
    game_assert(false, "Subclasses must implement valid_path")
  }
}

export class Pawn extends Piece {
  constructor(color) {
    super(color)
  }
  pre_move_hook(board) {
    const [from, to] = board.current_move
    const [dy, dx] = point_dif(to, from)
    if (dx !== 0 && board.at(to) === null) {
      board.capture([from[0], to[1]])
    }
    if (to[0] === 0 || to[0] === board_dim - 1) {
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
    if (dy * color_dir <= 0 || Math.abs(dy) > 2 || Math.abs(dx) > 1) {
      return false
    }
    if (dx === 0) {
      return board.at(to) === null && (Math.abs(dy) === 1 || from[0] === home_row)
    }
    if (board.at(to) !== null) {
      return true
    }
    const enpassant_piece_pos = point_add(to, [-color_dir, 0])
    const enpassant_piece = board.at(enpassant_piece_pos)
    const last_hist = board.history[board.history.length - 1]
    if (!(enpassant_piece instanceof Pawn) || enpassant_piece.color === this.color || last_hist === undefined) {
      return false;
    }
    const [prev_from, prev_to, _] = last_hist
    return point_equal(prev_to, enpassant_piece_pos) && Math.abs(prev_from[0] - from[0]) === 2
  }
}

export class Knight extends Piece {
  constructor(color) {
    super(color)
  }
  valid_path(from, to, board) {
    const [dy, dx] = point_dif(to, from)
    const abs_dy = Math.abs(dy)
    const abs_dx = Math.abs(dx)
    return Math.min(abs_dy, abs_dx) === 1 && Math.max(abs_dy, abs_dx) === 2
  }
  path_clear(from, to, board) {
    return true
  }
}

function is_bishop_move(from, to) {
  const [dy, dx] = point_dif(to, from)
  return Math.abs(dx) === Math.abs(dy)
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
  pre_move_hook(board) {
    this.moved++
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
  pre_move_hook(board) {
    const [from, to] = board.current_move
    const [dy, dx] = point_dif(to, from)
    this.moved++
    if (Math.abs(dx) === 2) {
      const rook_pos = [from[0], King.get_rook_x(dx)]
      const rook = board.at(rook_pos)
      rook.pre_move_hook(board)
      board.transfer_piece(rook_pos, [to[0], to[1] - dx / 2])
    }
  }
  path_clear(from, to, board) {
    const [dy, dx] = point_dif(to, from)
    return Math.max(Math.abs(dy), Math.abs(dx)) === 1 || (super.path_clear(from, [from[0], King.get_rook_x(dx)], board) && !board.in_check([from[0], from[1] + dx / 2]))
  }
  valid_path(from, to, board) {
    const [dy, dx] = point_dif(to, from)
    if (Math.abs(dx) === 2) {
      const rook = board.at([from[0], King.get_rook_x(dx)])
      return dy === 0 && this.moved == 0 && rook instanceof Rook && rook.color == this.color && rook.moved == 0 && board.at(to) === null && !board.in_check()
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
