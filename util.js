/*
Copyright 2026 Benjamin Yankowitz
This file is part of JavascriptChess.
JavascriptChess is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
JavascriptChess is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
You should have received a copy of the GNU General Public License along with JavascriptChess. If not, see <https://www.gnu.org/licenses/>. 
*/
export function game_assert(condition, to_print) {
    if (!condition) {
        throw to_print
    }
}

export const board_dim = 8

export function in_bounds(spot) {
    return spot[0] >= 0 && spot[0] < board_dim && spot[1] >= 0 && spot[1] < board_dim
}

export function clamp(n) {
    return Math.min(Math.max(n, -1), 1)
}

export function point_dif(to, from) {
    return [to[0] - from[0], to[1] - from[1]]
}

export function point_add(point, dif) {
    return [point[0] + dif[0], point[1] + dif[1]]
}

export function point_equal(point1, point2) {
    return point1[0] === point2[0] && point1[1] === point2[1]
}

export function get_other_color(color) {
    return color === 'White' ? 'Black' : 'White'
}

export function valid_pair(from, to) {
    return in_bounds(from) && in_bounds(to) && !point_equal(from, to)
}