// --- Настройка Canvas и контекста рисования ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Элементы интерфейса ---
const scoreDisplay = document.getElementById('score');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreDisplay = document.getElementById('finalScore');

// --- Настройки игры ---
const BLOCK_WIDTH = 100;
const BLOCK_HEIGHT = 40;
const GAME_SPEED = 2; // Скорость движения блока (пикселей в кадр)
const MAX_BUILD_HEIGHT = 10; // Максимальная высота башни, после которой победа
const BLOCK_COLORS = [ // Разные цвета для блоков
    '#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c'
];

// --- Переменные состояния игры ---
let currentBlock; // Текущий движущийся блок
let stackedBlocks = []; // Уложенные блоки (башня)
let score = 0; // Текущий счет (высота башни)
let gameRunning = false;
let animationFrameId; // ID для остановки requestAnimationFrame
let direction = 1; // 1 = вправо, -1 = влево
let background = new Image();
background.src = 'pixel_city_background.png'; // Имя файла для фона

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
        ctx.strokeStyle = '#2c3e50'; // Темная обводка
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    };
}

// --- Инициализация новой игры ---
function initGame() {
    stackedBlocks = [];
    score = 0;
    scoreDisplay.textContent = score;
    gameRunning = false;
    gameOverScreen.style.display = 'none';
    startButton.style.display = 'block';
    restartButton.style.display = 'none';
    document.removeEventListener('keydown', handleSpacebar); // Убираем слушатель перед стартом
    drawGame(); // Рисуем начальное состояние
}

// --- Создание нового движущегося блока ---
function createNewMovingBlock() {
    const lastBlock = stackedBlocks.length > 0 ? stackedBlocks[stackedBlocks.length - 1] : null;
    const yPos = lastBlock ? lastBlock.y - BLOCK_HEIGHT : canvas.height - BLOCK_HEIGHT;
    const randomColor = BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)];

    // Блок начинает движение из-за левого края
    currentBlock = new Block(-BLOCK_WIDTH, yPos, BLOCK_WIDTH, BLOCK_HEIGHT, randomColor);
    direction = 1; // Всегда начинаем движение вправо
}

// --- Обновление состояния игры (движение блоков, проверка столкновений) ---
function update() {
    if (!gameRunning) return;

    // Движение текущего блока
    currentBlock.x += GAME_SPEED * direction;

    // Отбиваем блок от стенок Canvas
    if (currentBlock.x + currentBlock.width > canvas.width || currentBlock.x < 0) {
        direction *= -1; // Меняем направление
    }
}

// --- Отрисовка всего на Canvas ---
function drawGame() {
    // 1. Очищаем Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Рисуем фоновое изображение
    if (background.complete && background.naturalWidth !== 0) {
        // Если изображение загружено, рисуем его
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    } else {
        // Если нет, рисуем просто фон
        ctx.fillStyle = '#4682b4'; // Синее небо
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 3. Рисуем уложенные блоки
    stackedBlocks.forEach(block => block.draw());

    // 4. Рисуем текущий движущийся блок (если есть)
    if (currentBlock) {
        currentBlock.draw();
    }
}

// --- Основной игровой цикл ---
function gameLoop() {
    update();
    drawGame();
    if (gameRunning) {
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}

// --- Обработка нажатия Пробела ---
function handleSpacebar(event) {
    if (!gameRunning) return;
    if (event.code === 'Space') {
        event.preventDefault(); // Предотвращаем прокрутку страницы

        // Останавливаем блок
        cancelAnimationFrame(animationFrameId);

        // Проверяем столкновение
        const lastStackedBlock = stackedBlocks.length > 0 ? stackedBlocks[stackedBlocks.length - 1] : null;
        let newBlockWidth = BLOCK_WIDTH;
        let newBlockX = currentBlock.x;

        if (lastStackedBlock) {
            // Если есть уже уложенные блоки
            const overlapStart = Math.max(currentBlock.x, lastStackedBlock.x);
            const overlapEnd = Math.min(currentBlock.x + currentBlock.width, lastStackedBlock.x + lastStackedBlock.width);

            newBlockWidth = overlapEnd - overlapStart;
            newBlockX = overlapStart;

            if (newBlockWidth <= 0) {
                // Блок полностью промахнулся
                gameOver();
                return;
            }
        } else {
            // Первый блок (на землю)
            if (currentBlock.x + currentBlock.width < 0 || currentBlock.x > canvas.width) {
                 // Если первый блок упал за пределы поля при опускании
                 gameOver();
                 return;
            }
            // Если первый блок уложен, то его ширина всегда BLOCK_WIDTH
            newBlockWidth = BLOCK_WIDTH;
            newBlockX = currentBlock.x;
        }

        // Создаем новый, правильно уложенный блок
        const newStackedBlock = new Block(newBlockX, currentBlock.y, newBlockWidth, BLOCK_HEIGHT, currentBlock.color);
        stackedBlocks.push(newStackedBlock);
        score++;
        scoreDisplay.textContent = score;

        // Смещаем все блоки вниз, если башня растет слишком высоко
        if (score > 5) { // Например, после 5 блоков начинаем двигать
            stackedBlocks.forEach(block => block.y += BLOCK_HEIGHT);
        }

        // Создаем следующий движущийся блок
        createNewMovingBlock();
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
    gameRunning = true;
    startButton.style.display = 'none';
    gameOverScreen.style.display = 'none'; // Скрываем экран окончания игры, если он был виден
    document.addEventListener('keydown', handleSpacebar); // Добавляем слушатель
    createNewMovingBlock(); // Создаем первый блок
    gameLoop(); // Запускаем игровой цикл
});

// --- Обработка кнопки "Играть снова" на экране Game Over ---
function restartGame() {
    initGame(); // Сброс всех настроек
    startButton.click(); // Имитируем нажатие кнопки "Начать игру"
}


// --- Инициализация при загрузке страницы ---
initGame();
// Добавляем слушатель события загрузки изображения
background.onload = drawGame;