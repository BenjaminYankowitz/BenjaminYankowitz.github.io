/*
Copyright 2026 Benjamin Yankowitz
This file is part of JavascriptChess.
JavascriptChess is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
JavascriptChess is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with JavascriptChess. If not, see <https://www.gnu.org/licenses/>. 
*/

import { piece_from_char } from './piece.js'
import { board_dim } from './util.js'

export async function load_images() {
    let images = {}
    let to_load = 0
    for (let [_, piece] of Object.entries(piece_from_char)) {
        const colors = ['Black', 'White']
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
            const piece = board.at([row, col])
            if ((row + col) % 2 === 0) {
                canvas_context.fillStyle = white_color
            } else {
                canvas_context.fillStyle = black_color
            }
            canvas_context.fillRect(col * square_size, row * square_size, square_size, square_size)
            if (piece !== null) {
                const image = images[piece.name]
                const piece_scale = 20 / 24
                const piece_offset = (1 - piece_scale) / 2
                canvas_context.drawImage(image, (col + piece_offset) * square_size, (row + piece_offset) * square_size, square_size * piece_scale, square_size * piece_scale)
            }
        }
    }
}

export function color_board(canvas_context, square_size, selection, board, selection_color, move_color) {
    canvas_context.fillStyle = selection_color
    canvas_context.fillRect(selection[1] * square_size, selection[0] * square_size, square_size, square_size)
    const moves = board.list_legal_from(selection)
    canvas_context.fillStyle = move_color
    for (let i = 0; i < moves.length; i++) {
        const move = moves[i]
        canvas_context.fillRect(move[1] * square_size, move[0] * square_size, square_size, square_size)
    }
}