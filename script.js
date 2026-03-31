const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const linesElement = document.getElementById('lines');
const pauseBtn = document.getElementById('pause-btn');
const restartBtn = document.getElementById('restart-btn');
const overlay = document.getElementById('overlay');
const overlayText = document.getElementById('overlay-text');
const canvasWrapper = document.querySelector('.canvas-wrapper');

const scoreBanner = document.createElement('div');
scoreBanner.className = 'canvas-score';
scoreBanner.innerHTML = `
    <span class="canvas-score-label">分数</span>
    <span id="canvas-score-value" class="canvas-score-value">0</span>
`;
if (canvasWrapper) {
    const playfieldShell = document.createElement('div');
    playfieldShell.className = 'playfield-shell';
    canvasWrapper.insertBefore(scoreBanner, canvas);
    canvasWrapper.appendChild(playfieldShell);
    playfieldShell.appendChild(canvas);
    playfieldShell.appendChild(overlay);
}
const canvasScoreElement = scoreBanner.querySelector('#canvas-score-value');

const ROW = 20;
const COL = 10;
const SQ = 30; // Square size
const VACANT = "transparent"; // Empty color

function drawSquare(x, y, color, context = ctx) {
    if (color === VACANT) {
        context.clearRect(x * SQ, y * SQ, SQ, SQ);
    } else {
        context.fillStyle = color;
        context.fillRect(x * SQ, y * SQ, SQ, SQ);
        
        context.strokeStyle = "rgba(255, 255, 255, 0.3)";
        context.lineWidth = 2;
        context.strokeRect(x * SQ, y * SQ, SQ, SQ);
        
        // Add a slight highlight for 3D effect
        context.fillStyle = "rgba(255, 255, 255, 0.1)";
        context.fillRect(x * SQ, y * SQ, SQ, SQ / 4);
    }
}

// Create board
let board = [];
function initBoard() {
    for (let r = 0; r < ROW; r++) {
        board[r] = [];
        for (let c = 0; c < COL; c++) {
            board[r][c] = VACANT;
        }
    }
}

function drawBoard() {
    for (let r = 0; r < ROW; r++) {
        for (let c = 0; c < COL; c++) {
            drawSquare(c, r, board[r][c]);
        }
    }
}

// Piece constructor
function Piece(tetromino, color) {
    this.tetromino = tetromino;
    this.color = color;
    this.tetrominoN = 0; // Start with the first pattern
    this.activeTetromino = this.tetromino[this.tetrominoN];
    
    this.x = 3;
    this.y = -2;
}

Piece.prototype.fill = function(color, context = ctx, offsetX = 0, offsetY = 0) {
    for (let r = 0; r < this.activeTetromino.length; r++) {
        for (let c = 0; c < this.activeTetromino.length; c++) {
            if (this.activeTetromino[r][c]) {
                drawSquare(this.x + c + offsetX, this.y + r + offsetY, color, context);
            }
        }
    }
};

Piece.prototype.draw = function() {
    this.fill(this.color);
};

Piece.prototype.unDraw = function() {
    this.fill(VACANT);
};

Piece.prototype.moveDown = function() {
    if (!this.collision(0, 1, this.activeTetromino)) {
        this.unDraw();
        this.y++;
        this.draw();
    } else {
        this.lock();
        if (gameOver) return;
        spawnNextPiece();
    }
};

Piece.prototype.moveRight = function() {
    if (!this.collision(1, 0, this.activeTetromino)) {
        this.unDraw();
        this.x++;
        this.draw();
    }
};

Piece.prototype.moveLeft = function() {
    if (!this.collision(-1, 0, this.activeTetromino)) {
        this.unDraw();
        this.x--;
        this.draw();
    }
};

Piece.prototype.rotate = function() {
    let nextPattern = this.tetromino[(this.tetrominoN + 1) % this.tetromino.length];
    let kick = 0;
    
    if (this.collision(0, 0, nextPattern)) {
        if (this.x > COL / 2) {
            kick = -1;
        } else {
            kick = 1;
        }
    }
    
    if (!this.collision(kick, 0, nextPattern)) {
        this.unDraw();
        this.x += kick;
        this.tetrominoN = (this.tetrominoN + 1) % this.tetromino.length;
        this.activeTetromino = this.tetromino[this.tetrominoN];
        this.draw();
    }
};

Piece.prototype.hardDrop = function() {
    this.unDraw();
    while (!this.collision(0, 1, this.activeTetromino)) {
        this.y++;
    }
    this.draw();
    this.lock();
    if (gameOver) return;
    spawnNextPiece();
};

Piece.prototype.collision = function(x, y, piece) {
    for (let r = 0; r < piece.length; r++) {
        for (let c = 0; c < piece.length; c++) {
            if (!piece[r][c]) continue;
            
            let newX = this.x + c + x;
            let newY = this.y + r + y;
            
            if (newX < 0 || newX >= COL || newY >= ROW) return true;
            if (newY < 0) continue;
            if (board[newY][newX] !== VACANT) return true;
        }
    }
    return false;
};

Piece.prototype.lock = function() {
    for (let r = 0; r < this.activeTetromino.length; r++) {
        for (let c = 0; c < this.activeTetromino.length; c++) {
            if (!this.activeTetromino[r][c]) continue;
            
            if (this.y + r < 0) {
                gameOver = true;
                overlayText.innerText = "游戏结束";
                overlay.classList.remove('hidden');
                cancelAnimationFrame(animationId);
                return;
            }
            board[this.y + r][this.x + c] = this.color;
        }
    }
    
    let linesClearedThisTurn = 0;
    for (let r = 0; r < ROW; r++) {
        let isFull = true;
        for (let c = 0; c < COL; c++) {
            if (board[r][c] === VACANT) {
                isFull = false;
                break;
            }
        }
        if (isFull) {
            for (let y = r; y > 0; y--) {
                for (let c = 0; c < COL; c++) {
                    board[y][c] = board[y - 1][c];
                }
            }
            for (let c = 0; c < COL; c++) {
                board[0][c] = VACANT;
            }
            linesClearedThisTurn++;
        }
    }
    
    if (linesClearedThisTurn > 0) {
        updateScore(linesClearedThisTurn);
        drawBoard();
    }
};

// Game state
let score = 0;
let level = 1;
let lines = 0;
let gameOver = false;
let isPaused = false;
let currentPiece;
let nextPiece;
let dropStart = Date.now();
let animationId;

function renderStats() {
    scoreElement.innerText = score;
    canvasScoreElement.innerText = score;
    levelElement.innerText = level;
    linesElement.innerText = lines;
}

function updateScore(cleared) {
    const points = [0, 100, 300, 500, 800];
    score += points[cleared] * level;
    lines += cleared;
    level = Math.floor(lines / 10) + 1;
    renderStats();
}

function randomPiece() {
    let rIndex = Math.floor(Math.random() * PIECES.length);
    // Deep clone the tetromino pattern to prevent template pollution
    const tetrominoCopy = JSON.parse(JSON.stringify(PIECES[rIndex][0]));
    return new Piece(tetrominoCopy, PIECES[rIndex][1]);
}

function spawnNextPiece() {
    currentPiece = nextPiece;
    currentPiece.draw();
    nextPiece = randomPiece();
    drawNextPiece();
}

function drawNextPiece() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    const piece = nextPiece.activeTetromino;
    const color = nextPiece.color;
    
    for (let r = 0; r < piece.length; r++) {
        for (let c = 0; c < piece.length; c++) {
            if (piece[r][c]) {
                const previewSQ = 20;
                const pOffsetX = (nextCanvas.width - piece.length * previewSQ) / 2;
                const pOffsetY = (nextCanvas.height - piece.length * previewSQ) / 2;
                
                nextCtx.fillStyle = color;
                nextCtx.fillRect(pOffsetX + c * previewSQ, pOffsetY + r * previewSQ, previewSQ, previewSQ);
                nextCtx.strokeStyle = "rgba(255, 255, 255, 0.3)";
                nextCtx.strokeRect(pOffsetX + c * previewSQ, pOffsetY + r * previewSQ, previewSQ, previewSQ);
            }
        }
    }
}

// Input handling
document.addEventListener("keydown", event => {
    if (gameOver) return;
    
    if (event.key === 'p' || event.key === 'P') {
        togglePause();
        return;
    }
    
    if (isPaused) return;

    if (event.key === 'ArrowLeft') {
        currentPiece.moveLeft();
        dropStart = Date.now();
    } else if (event.key === 'ArrowUp') {
        currentPiece.rotate();
        dropStart = Date.now();
    } else if (event.key === 'ArrowRight') {
        currentPiece.moveRight();
        dropStart = Date.now();
    } else if (event.key === 'ArrowDown') {
        currentPiece.moveDown();
    } else if (event.code === 'Space') {
        event.preventDefault();
        currentPiece.hardDrop();
        dropStart = Date.now();
    }
});

function togglePause() {
    if (gameOver) return;
    isPaused = !isPaused;
    if (isPaused) {
        overlayText.innerText = "已暂停";
        overlay.classList.remove('hidden');
        pauseBtn.innerText = "继续";
        cancelAnimationFrame(animationId);
    } else {
        overlay.classList.add('hidden');
        pauseBtn.innerText = "暂停";
        dropStart = Date.now();
        animationId = requestAnimationFrame(drop);
    }
}

function restartGame() {
    // Reset state
    cancelAnimationFrame(animationId);
    initBoard();
    score = 0;
    level = 1;
    lines = 0;
    gameOver = false;
    isPaused = false;
    
    // Update UI
    renderStats();
    overlay.classList.add('hidden');
    pauseBtn.innerText = "暂停";
    
    // Reset pieces
    currentPiece = randomPiece();
    currentPiece.draw();
    nextPiece = randomPiece();
    drawNextPiece();
    
    // Clear canvas and draw initial state
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    currentPiece.draw();
    
    // Restart loop
    dropStart = Date.now();
    animationId = requestAnimationFrame(drop);
}

pauseBtn.addEventListener('click', togglePause);
restartBtn.addEventListener('click', restartGame);

// Game Loop
function drop() {
    if (gameOver || isPaused) return;
    
    let now = Date.now();
    let delta = now - dropStart;
    let speed = Math.max(100, 1000 - (level - 1) * 100);
    
    if (delta > speed) {
        currentPiece.moveDown();
        dropStart = Date.now();
    }
    animationId = requestAnimationFrame(drop);
}

// Tetromino Patterns
const I = [
	[
		[0, 0, 0, 0],
		[1, 1, 1, 1],
		[0, 0, 0, 0],
		[0, 0, 0, 0],
	],
	[
		[0, 0, 1, 0],
		[0, 0, 1, 0],
		[0, 0, 1, 0],
		[0, 0, 1, 0],
	],
	[
		[0, 0, 0, 0],
		[0, 0, 0, 0],
		[1, 1, 1, 1],
		[0, 0, 0, 0],
	],
	[
		[0, 1, 0, 0],
		[0, 1, 0, 0],
		[0, 1, 0, 0],
		[0, 1, 0, 0],
	]
];

const J = [
	[
		[1, 0, 0],
		[1, 1, 1],
		[0, 0, 0],
	],
	[
		[0, 1, 1],
		[0, 1, 0],
		[0, 1, 0],
	],
	[
		[0, 0, 0],
		[1, 1, 1],
		[0, 0, 1],
	],
	[
		[0, 1, 0],
		[0, 1, 0],
		[1, 1, 0],
	]
];

const L = [
	[
		[0, 0, 1],
		[1, 1, 1],
		[0, 0, 0],
	],
	[
		[0, 1, 0],
		[0, 1, 0],
		[0, 1, 1],
	],
	[
		[0, 0, 0],
		[1, 1, 1],
		[1, 0, 0],
	],
	[
		[1, 1, 0],
		[0, 1, 0],
		[0, 1, 0],
	]
];

const O = [
	[
		[1, 1],
		[1, 1],
	]
];

const S = [
	[
		[0, 1, 1],
		[1, 1, 0],
		[0, 0, 0],
	],
	[
		[0, 1, 0],
		[0, 1, 1],
		[0, 0, 1],
	],
	[
		[0, 0, 0],
		[0, 1, 1],
		[1, 1, 0],
	],
	[
		[1, 0, 0],
		[1, 1, 0],
		[0, 1, 0],
	]
];

const T = [
	[
		[0, 1, 0],
		[1, 1, 1],
		[0, 0, 0],
	],
	[
		[0, 1, 0],
		[0, 1, 1],
		[0, 1, 0],
	],
	[
		[0, 0, 0],
		[1, 1, 1],
		[0, 1, 0],
	],
	[
		[0, 1, 0],
		[1, 1, 0],
		[0, 1, 0],
	]
];

const Z = [
	[
		[1, 1, 0],
		[0, 1, 1],
		[0, 0, 0],
	],
	[
		[0, 0, 1],
		[0, 1, 1],
		[0, 1, 0],
	],
	[
		[0, 0, 0],
		[1, 1, 0],
		[0, 1, 1],
	],
	[
		[0, 1, 0],
		[1, 1, 0],
		[1, 0, 0],
	]
];

// Pieces and colors
const PIECES = [
    [Z, "#ff416c"],
    [S, "#00ff87"],
    [T, "#d400ff"],
    [O, "#ffeb3b"],
    [L, "#ff9800"],
    [I, "#00d2ff"],
    [J, "#3d5afe"]
];

// Start Game
initBoard();
drawBoard();
currentPiece = randomPiece();
currentPiece.draw();
nextPiece = randomPiece();
drawNextPiece();
renderStats();
animationId = requestAnimationFrame(drop);
