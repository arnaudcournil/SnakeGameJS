let width = 15;
let height = 15;
let maxDepth = 10;

let meanScore = 0;
let bestScore = 0;
let nbEssais = 1;
let timeBetweenMoves = 0;

function printBoard(apple, snake) {
    text = "";
    let board = Array.from({ length: height }, () => Array(width).fill(0));
    board[apple[0]][apple[1]] = -1;
    board[snake[0][0]][snake[0][1]] = 2;

    for (let i = 1; i < snake.length; i++) {
        board[snake[i][0]][snake[i][1]] = 1;
    }

    text += "<span class='wall'>" + " ".repeat((width + 2) * 2) + "</span>\n";
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (x === 0) {
                text += "<span class='wall'>  </span>";
            }
            switch (board[x][y]) {
                case 0:
                    text += "  ";
                    break;
                case -1:
                    text += "<span class='fruit'>  </span>";
                    break;
                case 1:
                    text += "<span class='snake'>  </span>";
                    break;
                case 2:
                    text += "<span class='snake-head'>  </span>";
                    break;
            }
            if (x === width - 1) {
                text += "<span class='wall'>  </span>";
            }
        }
        text += "\n";
    }
    text += "<span class='wall'>" + " ".repeat((width + 2) * 2) + "</span>\n";

    return text;
}

function drawGame(elmt, apple, snake, nb_pommes) {
    let txt = "<pre>";
    txt += printBoard(apple, snake);
    txt += `\nScore: ${nb_pommes}, Best score: ${bestScore}, Essai: ${nbEssais}, Mean score: ${meanScore}\n`;
    txt += "</pre>";
    elmt.innerHTML = txt;
}

function* getPossibleMoves(snake) {
    const moves = [
        [snake[0][0] + 1, snake[0][1]],
        [snake[0][0] - 1, snake[0][1]],
        [snake[0][0], snake[0][1] + 1],
        [snake[0][0], snake[0][1] - 1]
    ];

    for (let move of moves) {
        if (!snake.some(([x, y]) => x === move[0] && y === move[1]) &&
            0 <= move[0] && move[0] < width &&
            0 <= move[1] && move[1] < height) {
            yield move;
        }
    }
}

function miniminEscape(snake, apple, depth = 10, nb_moves = 1, min_act = 1000, min_score = 100, malus = 0, onborder = false) {
    if (snake[0][0] === 0 || snake[0][0] === width - 1 || snake[0][1] === 0 || snake[0][1] === height - 1) {
        if (!onborder && !(Math.abs(snake[0][0] - apple[0]) + Math.abs(snake[0][1] - apple[1]) <= 1 &&
            (apple[0] === 0 || apple[0] === width - 1 || apple[1] === 0 || apple[1] === height - 1))) {
            malus += 1;
        }
        onborder = true;
    } else {
        onborder = false;
    }

    if (snake[0][0] === apple[0] && snake[0][1] === apple[1]) {
        min_score = Math.min(min_score, nb_moves);
    }

    if (depth === 0) {
        return min_score + malus;
    }

    let canEscape = false;
    for (const move of getPossibleMoves(snake)) {
        canEscape = true;
        const snake_copy = [...snake];
        snake_copy.unshift(move);
        snake_copy.pop();
        const next_depth = depth - 1;
        min_act = Math.min(min_act, miniminEscape(snake_copy, apple, next_depth, nb_moves + 1, min_act, min_score, malus, onborder));
    }

    if (!canEscape) {
        return 1000;
    }

    return min_act + malus;
}

function sortMoves(snake, apple) {
    const moves = [
        [snake[0][0] + 1, snake[0][1]],
        [snake[0][0] - 1, snake[0][1]],
        [snake[0][0], snake[0][1] + 1],
        [snake[0][0], snake[0][1] - 1]
    ];
    
    // Convertir le serpent en un Set pour optimiser la recherche
    const snakeSet = new Set(snake.map(part => `${part[0]},${part[1]}`));
    
    // Filtrer les mouvements valides
    const validMoves = moves.filter(([x, y]) => 
        !snakeSet.has(`${x},${y}`) && x >= 0 && x < width && y >= 0 && y < height
    );
    
    // Calculer les distances et trier les mouvements
    return validMoves
        .map(move => ({
            move,
            distance: Math.abs(apple[0] - move[0]) + Math.abs(apple[1] - move[1])
        }))
        .sort((a, b) => a.distance - b.distance)
        .map(entry => entry.move);    
}

function getBestMove(snake, apple, depth = 10) {
    let min_act = 1001;
    let best_move = null;

    for (const move of sortMoves(snake, apple)) {
        const snake_copy = [...snake];
        snake_copy.unshift(move);
        snake_copy.pop();
        const move_score = miniminEscape(snake_copy, apple, depth);

        if (move_score < min_act) {
            min_act = move_score;
            best_move = move;
        }
    }

    return [best_move, min_act];
}
  
async function snakeGame(elmt) {
    while (bestScore < width * height) {
        let nb_pommes = 3;
        let snake = [[0, 2], [0, 1], [0, 0]];
        let apple = [Math.floor(Math.random() * width), Math.floor(Math.random() * height)];
        
        while (snake.some(s => s[0] === apple[0] && s[1] === apple[1])) {
            apple = [Math.floor(Math.random() * width), Math.floor(Math.random() * height)];
        }

        drawGame(elmt, apple, snake, nb_pommes);

        while (true) {
            await new Promise(r => setTimeout(r, timeBetweenMoves));
            let [move, nb_moves] = getBestMove(snake, apple, maxDepth); // Assume getBestMove returns an array
            
            if (nb_moves === 1001) {
                meanScore = (meanScore * (nbEssais - 1) + nb_pommes) / nbEssais;
                
                if (nb_pommes >= width * height) {
                    drawGame(elmt, apple, snake, nb_pommes);
                } else {
                    elmt.innerHTML += "Game over\n";
                    nbEssais++;
                }
                break;
            }
            
            snake.unshift(move);
            
            if (snake[0][0] !== apple[0] || snake[0][1] !== apple[1]) {
                snake.pop();
            }
            
            drawGame(elmt, apple, snake, nb_pommes);
            
            if (snake[0][0] === apple[0] && snake[0][1] === apple[1]) {
                nb_pommes++;
                apple = [Math.floor(Math.random() * width), Math.floor(Math.random() * height)];
                
                while (snake.some(s => s[0] === apple[0] && s[1] === apple[1])) {
                    apple = [Math.floor(Math.random() * width), Math.floor(Math.random() * height)];
                }
                
                bestScore = Math.max(bestScore, nb_pommes);
            }
        }
    }
}

function updateSpeed(value) {
    timeBetweenMoves = 500 - value;
}

function updateDepth(value) {
    maxDepth = value;
}