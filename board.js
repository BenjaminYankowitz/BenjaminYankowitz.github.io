/*
Copyright 2026 Benjamin Yankowitz
This file is part of JavascriptChess.
JavascriptChess is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
JavascriptChess is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with JavascriptChess. If not, see <https://www.gnu.org/licenses/>. 
*/

import {piece_from_char, King, promote_able, promote_able_type} from './piece.js'
import {in_bounds, board_dim, point_dif} from './util.js'
export {board_dim} from './util.js';



export const unicode_pieces = {
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

export function board_as_string(board, piece_to_char) {
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
    this.promote_info = null;
    this.history = []
    this.current_turn_capture = []
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
      this.board[board_dim - 2][i] = new top("White")
      this.board[board_dim - 1][i] = new bottom("White")
    }
  }
  undo_last() {
    const action = this.history.pop()
    if (action !== undefined) {
      this.undo(...action)
    }
  }
  undo(from, to, capture_info) {
    const mover = this.at(to)
    mover.alert_undo()
    if (mover instanceof King) {
      const [dy, dx] = point_dif(to, from)
      if (Math.abs(dx) === 2){
        const rook_pos_old = [from[0],King.get_rook_x(dx)]
        const rook_pos = [to[0],to[1]-dx/2]
        this.at(rook_pos).execute_move(rook_pos,rook_pos_old,this)
      }
    }
    this.board[from[0]][from[1]] = mover
    this.board[to[0]][to[1]] = null
    for (let i = 0; i < capture_info.length; i++) {
      const c_info = capture_info[i];
      this.board[c_info[0][0]][c_info[0][1]] = c_info[1]
    }
    this.promote_info = null
  }
  undo_current(from, to) {
    this.undo(from, to, this.current_turn_capture)
    this.current_turn_capture = []
  }
  commit_move(from, to) {
    this.history.push([from, to, this.current_turn_capture])
    this.current_turn_capture = []
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
    if (this.turn_num % 2 === 0) {
      return "White"
    } else {
      return "Black"
    }
  }
  at(spot) {
    console.assert(in_bounds(spot), "Can only access points in bounds")
    return this.board[spot[0]][spot[1]]
  }
  capture(spot) {
    console.assert(this.at(spot) !== null, "Cannot capture nothing")
    this.current_turn_capture.push([spot, this.at(spot)])
    this.board[spot[0]][spot[1]] = null
  }
  move_attempt(from, to) {
    if (this.promote_info !== null) {
      return "promotion"
    }
    return this.at(from).move_attempt(from, to, this)
  }
  valid_select(spot) {
    if (!in_bounds(spot)) {
      return false
    }
    let piece = this.at(spot)
    return piece !== null && piece.color === this.turn
  }
  move(from, to) {
    if (this.at(to) !== null) {
      this.capture(to)
    }
    this.board[to[0]][to[1]] = this.at(from)
    this.board[from[0]][from[1]] = null
  }
  select_promotion(promote_to) {
    console.assert(this.promote_info !== null, "Can only promote when something is ready to promote")
    if (this.promote_info === null) {
      return false;
    }
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
    let [from, to] = this.promote_info
    const color = this.at(from).color
    this.capture(from)
    this.board[from[0]][from[1]] = new target(color)
    this.move(from, to)
    this.promote_info = null
    this.commit_move(from, to)
    return true;
  }
}