// Simple testing helper
const tests = [];
function test(name, fn) {
    tests.push({ name, fn });
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}

// Mocking necessary environment for logic tests
const ROW = 20;
const COL = 10;
const VACANT = "transparent";
let board = [];
function initBoard() {
    board = [];
    for (let r = 0; r < ROW; r++) {
        board[r] = [];
        for (let c = 0; c < COL; c++) {
            board[r][c] = VACANT;
        }
    }
}

const LINE_CLEAR_POINTS = [0, 10, 25, 40, 60];

function calculateLineClearScore(cleared) {
    return LINE_CLEAR_POINTS[cleared] || 0;
}

function clearCompletedLines(boardState) {
    let cleared = 0;

    for (let r = ROW - 1; r >= 0; r--) {
        let isFull = true;
        for (let c = 0; c < COL; c++) {
            if (boardState[r][c] === VACANT) {
                isFull = false;
                break;
            }
        }

        if (!isFull) {
            continue;
        }

        for (let y = r; y > 0; y--) {
            for (let c = 0; c < COL; c++) {
                boardState[y][c] = boardState[y - 1][c];
            }
        }
        for (let c = 0; c < COL; c++) {
            boardState[0][c] = VACANT;
        }

        cleared++;
        r++;
    }

    return cleared;
}

// Minimal Piece implementation for tests
function MockPiece(tetromino, x, y) {
    this.tetromino = tetromino;
    this.activeTetromino = tetromino[0];
    this.x = x;
    this.y = y;
}

MockPiece.prototype.collision = function(x, y, piece, board) {
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

MockPiece.prototype.getGhostOffsetY = function(board) {
    let offsetY = 0;

    while (!this.collision(0, offsetY + 1, this.activeTetromino, board)) {
        offsetY++;
    }

    return offsetY;
};

// Test Cases
test("Board Initialization", () => {
    initBoard();
    assert(board.length === ROW, "Board should have correct number of rows");
    assert(board[0].length === COL, "Board should have correct number of columns");
    assert(board[0][0] === VACANT, "Board should be initialized as vacant");
});

test("Collision Detection - Walls", () => {
    initBoard();
    const T = [[[0, 1, 0], [1, 1, 1], [0, 0, 0]]];
    const piece = new MockPiece(T, 0, 0);
    
    assert(piece.collision(-1, 0, piece.activeTetromino, board) === true, "Should collide with left wall");
    assert(piece.collision(0, ROW, piece.activeTetromino, board) === true, "Should collide with bottom");
    
    const rightPiece = new MockPiece(T, COL - 3, 0);
    assert(rightPiece.collision(1, 0, rightPiece.activeTetromino, board) === true, "Should collide with right wall when moving right by 1");
});

test("Collision Detection - Blocks", () => {
    initBoard();
    board[10][5] = "blue";
    const T = [[[0, 1, 0], [1, 1, 1], [0, 0, 0]]];
    const piece = new MockPiece(T, 4, 8);
    
    assert(piece.collision(0, 1, piece.activeTetromino, board) === true, "Should collide with existing block below");
    assert(piece.collision(0, 0, piece.activeTetromino, board) === false, "Should not collide if not moving into block");
});

test("Line Clearing Logic Simulation", () => {
    initBoard();
    // Fill the bottom row
    for (let c = 0; c < COL; c++) {
        board[ROW - 1][c] = "blue";
    }
    // Fill one block in the second to last row
    board[ROW - 2][0] = "red";
    
    // Simulate lock/clear logic
    const linesCleared = clearCompletedLines(board);
    
    assert(linesCleared === 1, "Should have cleared one line");
    assert(board[ROW - 1][0] === "red", "Block above should have moved down to the bottom row");
    assert(board[ROW - 1][1] === VACANT, "Other blocks in the bottom row should be vacant");
});

test("Line Clearing Logic Simulation - Double Line", () => {
    initBoard();
    for (let c = 0; c < COL; c++) {
        board[ROW - 1][c] = "blue";
        board[ROW - 2][c] = "green";
    }
    board[ROW - 3][2] = "red";

    const linesCleared = clearCompletedLines(board);

    assert(linesCleared === 2, "Should have cleared two lines");
    assert(board[ROW - 1][2] === "red", "Block above double clear should fall to bottom");
});

test("Ghost Drop Position Stops Above Existing Stack", () => {
    initBoard();
    board[18][4] = "blue";
    board[18][5] = "blue";

    const O = [[[1, 1], [1, 1]]];
    const piece = new MockPiece(O, 4, 0);
    const ghostOffsetY = piece.getGhostOffsetY(board);

    assert(ghostOffsetY === 16, "Ghost should stop with the piece directly above the stack");
    assert(board[18][4] === "blue", "Ghost calculation must not mutate the board");
});

test("Scoring Rules", () => {
    assert(calculateLineClearScore(1) === 10, "Single line should score 10");
    assert(calculateLineClearScore(2) === 25, "Double line should score 25");
    assert(calculateLineClearScore(3) === 40, "Triple line should score 40");
    assert(calculateLineClearScore(4) === 60, "Tetris should score 60");
});

// Run Tests
async function runTests() {
    const resultsDiv = document.getElementById("results");
    let passedCount = 0;
    
    for (const t of tests) {
        const item = document.createElement("div");
        try {
            t.fn();
            item.innerHTML = `✅ ${t.name} - PASSED`;
            item.style.color = "#00ff87";
            passedCount++;
        } catch (e) {
            item.innerHTML = `❌ ${t.name} - FAILED: ${e.message}`;
            item.style.color = "#ff416c";
            console.error(e);
        }
        resultsDiv.appendChild(item);
    }
    
    const summary = document.createElement("h2");
    summary.innerText = `Results: ${passedCount}/${tests.length} passed`;
    resultsDiv.prepend(summary);
}

window.onload = runTests;
