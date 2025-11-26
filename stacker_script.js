// --- Настройка Canvas и контекста рисования ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Элементы интерфейса ---
const scoreDisplay = document.getElementById('score');
const startButton = document.getElementById('startButton');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreDisplay = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton'); // Для экрана Game Over

// --- Настройки игры ---
const BLOCK_WIDTH = 100;
const BLOCK_HEIGHT = 40;
let GAME_SPEED = 3; // Увеличим скорость
const BLOCK_COLORS = [
    '#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c'
];

// --- Переменные состояния игры ---
let currentBlock;
let stackedBlocks = [];
let score = 0;
let gameRunning = false;
let animationFrameId;
let direction = 1; // 1 = вправо, -1 = влево
let background = new Image();
background.src = 'pixel_city_background.png'; // Ваша фоновая картинка
let initialBlockWidth = BLOCK_WIDTH;

// --- Объект блока ---
function Block(x, y, width, height, color) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;

    this.draw = function() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    };
}

// --- Инициализация новой игры ---
function initGame() {
    stackedBlocks = [];
    score = 0;
    initialBlockWidth = BLOCK_WIDTH; // Сбрасываем ширину
    scoreDisplay.textContent = score;
    gameOverScreen.style.display = 'none';
    startButton.style.display = 'block';
    restartButton.style.display = 'none';
    
    // Очищаем Canvas и рисуем фон
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGame(); 
}

// --- Создание нового движущегося блока ---
function createNewMovingBlock(blockWidth) {
    const lastBlock = stackedBlocks.length > 0 ? stackedBlocks[stackedBlocks.length - 1] : null;
    const yPos = lastBlock ? lastBlock.y - BLOCK_HEIGHT : canvas.height - BLOCK_HEIGHT;
    const randomColor = BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)];
    
    // Блок начинает движение из-за левого края, используя ширину предыдущего блока
    currentBlock = new Block(-blockWidth, yPos, blockWidth, BLOCK_HEIGHT, randomColor);
    direction = 1;
}

// --- Обновление состояния игры (движение блоков) ---
function update() {
    if (!gameRunning) return;

    // Движение текущего блока
    currentBlock.x += GAME_SPEED * direction;

    // Отбиваем блок от стенок Canvas
    if (currentBlock.x + currentBlock.width > canvas.width) {
        currentBlock.x = canvas.width - currentBlock.width; // Фиксируем на краю
        direction = -1; // Меняем направление на обратное
    } else if (currentBlock.x < 0) {
        currentBlock.x = 0; // Фиксируем на краю
        direction = 1; // Меняем направление на обратное
    }
}

// --- Отрисовка всего на Canvas ---
function drawGame() {
    // 1. Рисуем фон
    if (background.complete && background.naturalWidth !== 0) {
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#4682b4'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // 2. Рисуем уложенные блоки
    stackedBlocks.forEach(block => block.draw());

    // 3. Рисуем текущий движущийся блок
    if (currentBlock) {
        currentBlock.draw();
    }
}

// --- Основной игровой цикл ---
function gameLoop() {
    if (!gameRunning) return; // Проверка, что игра идет
    
    update();
    drawGame();
    animationFrameId = requestAnimationFrame(gameLoop);
}

// --- Обработка нажатия Пробела ---
function handleSpacebar(event) {
    if (!gameRunning) return;
    if (event.code === 'Space') {
        event.preventDefault();

        // 1. Останавливаем анимацию
        cancelAnimationFrame(animationFrameId);

        const lastStackedBlock = stackedBlocks.length > 0 ? stackedBlocks[stackedBlocks.length - 1] : null;
        
        let newBlockWidth = initialBlockWidth; // Начинаем с исходной ширины
        let newBlockX = currentBlock.x;
        
        if (lastStackedBlock) {
            // --- Логика проверки столкновения ---
            const overlapStart = Math.max(currentBlock.x, lastStackedBlock.x);
            const overlapEnd = Math.min(currentBlock.x + currentBlock.width, lastStackedBlock.x + lastStackedBlock.width);
            
            newBlockWidth = overlapEnd - overlapStart;
            newBlockX = overlapStart;

            if (newBlockWidth <= 0) {
                // Блок промахнулся или упал
                gameOver();
                return;
            }
        }
        
        // 2. Создаем и укладываем новый блок
        const newStackedBlock = new Block(newBlockX, currentBlock.y, newBlockWidth, BLOCK_HEIGHT, currentBlock.color);
        stackedBlocks.push(newStackedBlock);
        score++;
        scoreDisplay.textContent = score;
        initialBlockWidth = newBlockWidth; // Новый движущийся блок будет той же ширины, что и предыдущий

        // 3. Сдвигаем башню вниз, чтобы она помещалась на экране
        if (newStackedBlock.y < 100) { // Если блок слишком высоко
            const shift = 100 - newStackedBlock.y;
            stackedBlocks.forEach(block => block.y += shift);
        }

        // 4. Увеличиваем сложность (ускорение)
        if (score % 5 === 0 && GAME_SPEED < 10) {
            GAME_SPEED += 0.5;
        }

        // 5. Создаем следующий блок и запускаем цикл заново
        createNewMovingBlock(initialBlockWidth);
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

// --- Функция завершения игры ---
function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationFrameId);
    finalScoreDisplay.textContent = score;
    gameOverScreen.style.display = 'flex';
}

// --- Обработка кнопки "Начать игру" ---
startButton.addEventListener('click', () => {
    if (gameRunning) return; // Защита от повторного нажатия
    gameRunning = true;
    startButton.style.display = 'none';
    document.addEventListener('keydown', handleSpacebar); // Добавляем слушатель
    
    // Запускаем игру
    createNewMovingBlock(initialBlockWidth);
    gameLoop(); 
});

// --- Обработка кнопки "Играть снова" на экране Game Over ---
function restartGame() {
    // Вызов функции initGame, которая сбрасывает состояние
    initGame(); 
    // Запускаем игру, имитируя нажатие кнопки "Начать игру"
    startButton.click(); 
}

// --- Привязка функции restartGame к кнопке "Играть снова" на экране Game Over ---
// Эта функция привязана в HTML через onclick="restartGame()"
// Инициализация при загрузке страницы
background.onload = initGame; // Ждем загрузки фона
if (background.complete) {
    initGame();
}
// Если фон не загружен, initGame все равно будет вызван после загрузки


// --- Инициализация при загрузке страницы ---
initGame();
// Добавляем слушатель события загрузки изображения

background.onload = drawGame;
