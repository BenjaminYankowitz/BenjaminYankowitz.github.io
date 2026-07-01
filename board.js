/*
Copyright 2026 Benjamin Yankowitz
This file is part of JavascriptChess.
JavascriptChess is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
JavascriptChess is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with JavascriptChess. If not, see <https://www.gnu.org/licenses/>. 
*/

import { piece_from_char, King, promote_able, promote_able_type } from './piece.js'
import { game_assert, in_bounds, board_dim, point_dif } from './util.js'
export { board_dim } from './util.js';

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

export function board_as_string(board, piece_to_char = unicode_pieces) {
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

export class Board {
  constructor() {
    this.current_move = null
    this.in_promotion = false
    this.history = []
    this.current_turn_replaces = {}
    const basic_setup = [
      'p p p p p p p p',
      'R N B Q K B N R']
    game_assert(basic_setup.length === 2, 'Board setup string not 2 high')
    let basic_setup_top = basic_setup[0].split(' ')
    let basic_setup_bottom = basic_setup[1].split(' ')
    game_assert(basic_setup_top.length === board_dim && basic_setup_bottom.length === board_dim, 'Board setup string not 8 accross')
    this.board = Array(board_dim).fill().map(() => Array(board_dim).fill(null))
    for (let i in this.board) {
      let top = piece_from_char[basic_setup_top[i]]
      let bottom = piece_from_char[basic_setup_bottom[i]]
      this.board[0][i] = new bottom('Black')
      this.board[1][i] = new top('Black')
      this.board[board_dim - 2][i] = new top('White')
      this.board[board_dim - 1][i] = new bottom('White')
    }
  }
  undo_last() {
    const action = this.history.pop()
    if (action !== undefined) {
      this.undo(...action)
    }
  }
  undo_current() {
    this.undo(this.current_move[0], this.current_move[1], this.current_turn_replaces)
    this.current_turn_replaces = {}
    this.current_move = null
  }
  undo(from, to, replace_info) {
    const mover = this.transfer_piece(to, from)
    mover.alert_undo()
    if (mover instanceof King) {
      const [dy, dx] = point_dif(to, from)
      if (Math.abs(dx) === 2) {
        this.transfer_piece([to[0], to[1] - dx / 2], [from[0], King.get_rook_x(dx)]).alert_undo()
      }
    }
    if ('capture' in replace_info) {
      this.set(...replace_info.capture)
    }
    if ('promotion' in replace_info) {
      this.set(from, replace_info.promotion)
    }
    this.in_promotion = false
  }
  commit_move() {
    this.history.push([this.current_move[0], this.current_move[1], this.current_turn_replaces])
    this.current_turn_replaces = {}
    this.current_move = null
  }
  in_check(king = null) {
    const turn = this.turn
    let attackers = []
    for (let row = 0; row < board_dim; row++) {
      for (let col = 0; col < board_dim; col++) {
        const piece = this.at([row, col])
        if (piece === null) {
          continue
        }
        if (piece.color !== turn) {
          attackers.push([row, col])
        } else if (king === null && piece instanceof King) {
          king = [row, col]
        }
      }
    }
    game_assert(king !== null, 'There must be king of both colors on the board')
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
    if (this.turn_num % 2 === 0) {
      return 'White'
    } else {
      return 'Black'
    }
  }
  at(spot) {
    game_assert(in_bounds(spot), 'Can only access points in bounds')
    return this.board[spot[0]][spot[1]]
  }
  set(spot, value) {
    game_assert(in_bounds(spot), 'Can only access points in bounds')
    this.board[spot[0]][spot[1]] = value
  }
  transfer_piece(from, to) {
    const moved = this.at(from)
    game_assert(moved !== null, 'transfer_piece souce must not be null')
    game_assert(this.at(to) === null, 'transfer_piece destination must be null')
    this.set(to, moved)
    this.set(from, null)
    return moved
  }
  capture(spot) {
    game_assert(this.at(spot) !== null, 'Cannot capture nothing')
    this.current_turn_replaces.capture = [spot, this.at(spot)]
    this.set(spot, null)
  }
  move_attempt_no_commit(from, to) {
    game_assert(!this.in_promotion, 'Cannot move during promotion')
    if (this.in_promotion) {
      return 'promotion'
    }
    let mover = this.at(from);
    if (mover?.color !== this.turn || !mover.is_legal_basic(from, to, this)) {
      return 'failed'
    }
    this.current_move = [from, to]
    const needs_more_input = mover.pre_move_hook(this)
    if (this.at(to) !== null) {
      this.capture(to)
    }
    this.transfer_piece(from, to)
    if (this.in_check()) {
      this.undo_current()
      return 'failed'
    }
    if (typeof needs_more_input === 'string') {
      return needs_more_input
    }
    return 'succeeded'
  }
  move_attempt(from, to) {
    const ret = this.move_attempt_no_commit(from, to)
    if (ret === 'succeeded') {
      this.commit_move()
    }
    return ret
  }
  valid_select(spot) {
    if (!in_bounds(spot)) {
      return false
    }
    let piece = this.at(spot)
    return piece !== null && piece.color === this.turn
  }
  select_promotion(promote_to) {
    game_assert(this.in_promotion, 'Can only promote when something is ready to promote')
    let target = null;
    for (let i = 0; i < promote_able.length; i++) {
      if (promote_able[i] === promote_to) {
        target = promote_able_type[i];
        break;
      }
    }
    if (target === null) {
      return false;
    }
    const [from, to] = this.current_move
    const old = this.at(to)
    const color = old.color
    this.set(to, new target(color))
    this.current_turn_replaces.promotion = old
    this.commit_move()
    this.in_promotion = null
    return true;
  }
  is_legal(from, to) {
    if (this.in_promotion) {
      game_assert('Don\'t try to use object mid promotion')
      return false
    }
    if (this.move_attempt_no_commit(from, to) === 'failed') {
      return false
    }
    this.undo_current()
    return true
  }
  list_legal_from(from) {
    const ret = []
    for (let to_row = 0; to_row < board_dim; to_row++) {
      for (let to_col = 0; to_col < board_dim; to_col++) {
        const to = [to_row, to_col]
        if (this.is_legal(from, to)) {
          ret.push(to)
        }
      }
    }
    return ret
  }
  list_all_legal() {
    const ret = { length: 0 }
    for (let from_row = 0; from_row < board_dim; from_row++) {
      for (let from_col = 0; from_col < board_dim; from_col++) {
        const moves = this.list_legal_from([from_row, from_col])
        ret[from_row * board_dim + from_col] = moves
        ret.length += moves.length
      }
    }
    return ret
  }
  in_stalemate() {
    return !this.in_check() && this.list_all_legal().length === 0
  }
  in_checkmate() {
    return this.in_check() && this.list_all_legal().length === 0
  }
}