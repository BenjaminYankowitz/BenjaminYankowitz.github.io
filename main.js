/*
Copyright 2026 Benjamin Yankowitz
This file is part of JavascriptChess.
JavascriptChess is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
JavascriptChess is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with JavascriptChess. If not, see <https://www.gnu.org/licenses/>. 
*/

const board_dim = 8;

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
  let str = '-'.repeat(board_dim * 4 + 1);
  str += '\n'
  for (let row = 0; row < board_dim; row++) {
    str += '|'
    for (let col = 0; col < board_dim; col++) {
      let piece = board.at([row, col])
      let symbol;
      if (piece === null) {
        symbol = piece_to_char.Empty
      } else {
        let piece_color = piece.color
        let piece_name = piece.piece_name
        symbol = piece_to_char[piece_color][piece_name]
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

class Piece {
  constructor(color) {
    this.color = color;
  }
  get name() {
    return this.color + ' ' + this.piece_name
  }
  get piece_name() { return this.constructor.name }
  path_clear(from, to, board) {
    return true
  }
  is_legal(from, to, board) {
    const dest_piece = board.at(to)
    return (dest_piece === null || dest_piece.color != this.color) && this.path_clear(from, to, board);
  }
  execute_move(from, to, board) {
    board.move(from, to);
  }
  move_attempt(from, to, board) {
    console.assert(board.at(from) === this);
    if (!this.is_legal(from, to, board)) {
      return false
    }
    this.execute_move(from, to, board)
    return true;
  }
}

class Pawn extends Piece {
  constructor(color) {
    super(color);
  }
}

class Knight extends Piece {
  constructor(color) {
    super(color);
  }
}

class Bishop extends Piece {
  constructor(color) {
    super(color);
  }
}

class Rook extends Piece {
  constructor(color) {
    super(color);
    this.moved = false;
  }
  execute_move(from, to, board) {
    this.moved = true;
    super.execute_move(from, to, board)
  }
}

class Queen extends Piece {
  constructor(color) {
    super(color);
  }
}

class King extends Piece {
  constructor(color) {
    super(color);
    this.moved = false;
  }
  execute_move(from, to, board) {
    this.moved = true;
    super.execute_move(from, to, board)
  }
}

const piece_from_char = {
  'p': Pawn,
  'R': Rook,
  'N': Knight,
  'B': Bishop,
  'Q': Queen,
  'K': King,
}
class Board {
  constructor() {
    const basic_setup = [
      "p p p p p p p p",
      "R N B Q K B N R"]
    console.assert(basic_setup.length === 2);
    let basic_setup_top = basic_setup[0].split(' ')
    let basic_setup_bottom = basic_setup[1].split(' ');
    console.assert(basic_setup_top.length === board_dim && basic_setup_bottom.length === board_dim)
    this.board = Array(board_dim).fill().map(() => Array(board_dim).fill(null))
    for (let i in this.board) {
      let top = piece_from_char[basic_setup_top[i]]
      let bottom = piece_from_char[basic_setup_bottom[i]]
      this.board[0][i] = new bottom("Black");
      this.board[1][i] = new top("Black");
      this.board[6][i] = new top("White");
      this.board[7][i] = new bottom("White");
    }
    this.turn = "White"
  }
  at(spot) {
    return this.board[spot[0]][spot[1]]
  }
  move_attempt(from, to) {
    if (!this.at(from).move_attempt(from, to, this)) {
      return false;
    }
    if (this.turn === "White") {
      this.turn = "Black"
    } else {
      this.turn = "White"
    }
    return true
  }
  valid_select(spot) {
    let piece = this.at(spot)
    return piece != null && piece.color === this.turn
  }
  move(from, to) {
    this.board[to[0]][to[1]] = this.at(from);
    this.board[from[0]][from[1]] = null
  }
}

async function load_images() {
  let images = {};
  let to_load = 0;
  for (let [_, piece] of Object.entries(piece_from_char)) {
    const colors = ["Black", "White"];
    for (let i = 0; i < colors.length; i++) {
      let full_name = colors[i] + ' ' + piece.name;
      images[full_name] = new Image();
      images[full_name].src = 'assets/' + full_name + '.svg'
      images[full_name].loading = 'eager'
    }
  }
  for (let [_, image] of Object.entries(images)) {
    await image.decode()
  }
  return images
}

function draw_board(canvas_context, square_size, images, board, black_color, white_color) {
  for (let row = 0; row < board_dim; row++) {
    for (let col = 0; col < board_dim; col++) {
      let piece = board.at([row, col])
      if ((row + col) % 2 === 0) {
        canvas_context.fillStyle = white_color
      } else {
        canvas_context.fillStyle = black_color
      }
      canvas_context.fillRect(col * square_size, row * square_size, square_size, square_size);
      if (piece != null) {
        let image = images[piece.name]
        const piece_scale = 20 / 24;
        const piece_offset = (1 - piece_scale) / 2
        canvas_context.drawImage(image, (col + piece_offset) * square_size, (row + piece_offset) * square_size, square_size * piece_scale, square_size * piece_scale);
      }
    }
  }
}