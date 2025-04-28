// Game variables
const gameArea = document.querySelector('.game-area');
const player = document.getElementById('player');
const scoreElement = document.getElementById('score');
const tacosSavedElement = document.getElementById('tacos-saved');
const healthElement = document.getElementById('health');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const gameMessage = document.getElementById('game-message');

// Game state
const gameState = {
    inProgress: false,
    score: 0,
    tacosSaved: 0,
    health: 100,
    playerPosition: {
        x: gameArea.offsetWidth / 2,
        y: gameArea.offsetHeight - 90
    },
    playerSpeed: 5,
    keys: {},
    enemies: [],
    tacos: [],
    weapons: [],
    enemySpawnRate: 2000,
    tacoSpawnRate: 3000,
    lastAttackTime: 0,
    attackCooldown: 500, // milliseconds
    enemyDamage: 10,
    gameLoopId: null,
    enemySpawnId: null,
    tacoSpawnId: null
};

// SVG templates
const svgTemplates = {
    player: `<svg viewBox="0 0 50 70" xmlns="http://www.w3.org/2000/svg">
        <g>
            <!-- Body -->
            <rect x="15" y="25" width="20" height="30" fill="#4a6d7c" />
            <!-- Head -->
            <circle cx="25" cy="15" r="10" fill="#d3a17e" />
            <!-- Backpack -->
            <rect x="10" y="30" width="5" height="20" fill="#3d5561" />
            <!-- Flashlight -->
            <rect x="30" y="38" width="15" height="4" fill="#d9d9d9" />
            <!-- Hair -->
            <path d="M20 10 Q25 5 30 10" stroke="#382416" stroke-width="2" fill="none" />
            <!-- Eyes -->
            <circle cx="22" cy="13" r="1.5" fill="#201000" />
            <circle cx="28" cy="13" r="1.5" fill="#201000" />
            <!-- Mouth -->
            <path d="M23 18 Q25 20 27 18" stroke="#201000" stroke-width="1" fill="none" />
        </g>
    </svg>`,
    enemy: `<svg viewBox="0 0 40 60" xmlns="http://www.w3.org/2000/svg">
        <g>
            <!-- Body -->
            <rect x="12" y="20" width="16" height="25" fill="#677d68" />
            <!-- Head -->
            <circle cx="20" cy="12" r="8" fill="#94a596" />
            <!-- Fungus -->
            <path d="M15 8 Q20 2 25 8" stroke="#94a596" stroke-width="4" fill="#94a596" />
            <circle cx="15" cy="7" r="3" fill="#94a596" />
            <circle cx="25" cy="7" r="3" fill="#94a596" />
            <!-- Eyes -->
            <circle cx="17" cy="12" r="1.5" fill="#ff3333" />
            <circle cx="23" cy="12" r="1.5" fill="#ff3333" />
            <!-- Arms -->
            <rect x="5" y="25" width="7" height="4" fill="#677d68" />
            <rect x="28" y="25" width="7" height="4" fill="#677d68" />
            <!-- Legs -->
            <rect x="12" y="45" width="6" height="10" fill="#677d68" />
            <rect x="22" y="45" width="6" height="10" fill="#677d68" />
        </g>
    </svg>`,
    taco: `<svg viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
        <g>
            <!-- Taco Shell -->
            <path d="M5 20 Q15 5 25 20 L25 20 Q15 25 5 20 Z" fill="#f9cb9c" stroke="#e69138" stroke-width="1" />
            <!-- Lettuce -->
            <path d="M7 19 Q15 10 23 19" stroke="#6aa84f" stroke-width="2" stroke-linecap="round" />
            <path d="M8 17 Q15 12 22 17" stroke="#6aa84f" stroke-width="2" stroke-linecap="round" />
            <!-- Cheese -->
            <path d="M8 16 L22 16 L20 13 L10 13 Z" fill="#f1c232" />
            <!-- Meat -->
            <path d="M9 14 Q15 11 21 14" stroke="#783f04" stroke-width="3" stroke-linecap="round" />
            <!-- Taco Bell Logo -->
            <circle cx="15" cy="10" r="3" fill="#662d91" />
            <path d="M15 8 L15 12" stroke="#ffffff" stroke-width="0.5" />
            <path d="M13 10 L17 10" stroke="#ffffff" stroke-width="0.5" />
        </g>
    </svg>`
};

// Key event listeners
document.addEventListener('keydown', (e) => {
    gameState.keys[e.key] = true;

    // Attack with spacebar
    if (e.key === ' ' && gameState.inProgress) {
        attackEnemy();
    }
});

document.addEventListener('keyup', (e) => {
    gameState.keys[e.key] = false;
});

// Start button event listener
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', restartGame);

// Initialize player position and add SVG
function initPlayerPosition() {
    player.style.left = `${gameState.playerPosition.x - 25}px`; // Adjust for player width
    player.style.bottom = '20px';
    player.innerHTML = svgTemplates.player;
}

// Game functions
function startGame() {
    if (gameState.inProgress) return;

    resetGameState();
    gameState.inProgress = true;
    startButton.style.display = 'none';
    restartButton.style.display = 'none';
    gameMessage.textContent = '';

    // Start game loops
    gameState.gameLoopId = setInterval(gameLoop, 16);
    gameState.enemySpawnId = setInterval(spawnEnemy, gameState.enemySpawnRate);
    gameState.tacoSpawnId = setInterval(spawnTaco, gameState.tacoSpawnRate);

    initPlayerPosition();
}

function restartGame() {
    clearAllGameElements();
    startGame();
}

function resetGameState() {
    gameState.score = 0;
    gameState.tacosSaved = 0;
    gameState.health = 100;
    gameState.playerPosition = {
        x: gameArea.offsetWidth / 2,
        y: gameArea.offsetHeight - 90
    };
    gameState.enemies = [];
    gameState.tacos = [];
    gameState.weapons = [];

    // Update UI
    scoreElement.textContent = gameState.score;
    tacosSavedElement.textContent = gameState.tacosSaved;
    healthElement.textContent = gameState.health;
}

function gameLoop() {
    movePlayer();
    moveEnemies();
    moveTacos();
    moveWeapons();
    checkCollisions();

    // Check game over condition
    if (gameState.health <= 0) {
        endGame();
    }
}

function movePlayer() {
    const areaRect = gameArea.getBoundingClientRect();
    const playerWidth = player.offsetWidth;

    if (gameState.keys['ArrowLeft']) {
        gameState.playerPosition.x = Math.max(
            playerWidth / 2,
            gameState.playerPosition.x - gameState.playerSpeed
        );
    }

    if (gameState.keys['ArrowRight']) {
        gameState.playerPosition.x = Math.min(
            areaRect.width - playerWidth / 2,
            gameState.playerPosition.x + gameState.playerSpeed
        );
    }

    // Update player position
    player.style.left = `${gameState.playerPosition.x - playerWidth / 2}px`;
}

function spawnEnemy() {
    const enemy = document.createElement('div');
    enemy.classList.add('enemy');

    const enemyWidth = 40;
    const randomX = Math.random() * (gameArea.offsetWidth - enemyWidth);

    enemy.style.left = `${randomX}px`;
    enemy.style.top = '0px';
    enemy.innerHTML = svgTemplates.enemy;

    gameArea.appendChild(enemy);

    gameState.enemies.push({
        element: enemy,
        x: randomX + (enemyWidth / 2),
        y: 0,
        speed: 1 + Math.random() * 2, // Random speed between 1-3
        width: enemyWidth,
        height: 60
    });
}

function spawnTaco() {
    const taco = document.createElement('div');
    taco.classList.add('taco');

    const tacoWidth = 30;
    const randomX = Math.random() * (gameArea.offsetWidth - tacoWidth);

    taco.style.left = `${randomX}px`;
    taco.style.top = '0px';
    taco.innerHTML = svgTemplates.taco;

    gameArea.appendChild(taco);

    gameState.tacos.push({
        element: taco,
        x: randomX + (tacoWidth / 2),
        y: 0,
        speed: 1 + Math.random() * 1.5, // Random speed between 1-2.5
        width: tacoWidth,
        height: 30
    });
}

function moveEnemies() {
    gameState.enemies.forEach((enemy, index) => {
        enemy.y += enemy.speed;
        enemy.element.style.top = `${enemy.y}px`;

        // Remove enemies that go off screen
        if (enemy.y > gameArea.offsetHeight) {
            gameArea.removeChild(enemy.element);
            gameState.enemies.splice(index, 1);
        }
    });
}

function moveTacos() {
    gameState.tacos.forEach((taco, index) => {
        taco.y += taco.speed;
        taco.element.style.top = `${taco.y}px`;

        // Remove tacos that go off screen
        if (taco.y > gameArea.offsetHeight) {
            gameArea.removeChild(taco.element);
            gameState.tacos.splice(index, 1);

            // Lose points for missed tacos
            updateScore(-5);
        }
    });
}

function attackEnemy() {
    const now = Date.now();
    if (now - gameState.lastAttackTime < gameState.attackCooldown) {
        return; // Still in cooldown
    }

    gameState.lastAttackTime = now;

    const weapon = document.createElement('div');
    weapon.classList.add('weapon');

    const weaponWidth = 20;
    const weaponX = gameState.playerPosition.x - (weaponWidth / 2);
    const weaponY = gameArea.offsetHeight - 90;

    weapon.style.left = `${weaponX}px`;
    weapon.style.bottom = '90px';

    gameArea.appendChild(weapon);

    gameState.weapons.push({
        element: weapon,
        x: weaponX + (weaponWidth / 2),
        y: weaponY,
        width: weaponWidth,
        height: 5,
        speed: 7
    });
}

function moveWeapons() {
    gameState.weapons.forEach((weapon, index) => {
        weapon.y -= weapon.speed; // Moving up
        weapon.element.style.bottom = `${gameArea.offsetHeight - weapon.y}px`;

        // Remove weapons that go off screen
        if (weapon.y < 0) {
            gameArea.removeChild(weapon.element);
            gameState.weapons.splice(index, 1);
        }
    });
}

function checkCollisions() {
    // Check weapon-enemy collisions
    gameState.weapons.forEach((weapon, weaponIndex) => {
        gameState.enemies.forEach((enemy, enemyIndex) => {
            if (detectCollision(weapon, enemy)) {
                // Remove both weapon and enemy
                gameArea.removeChild(weapon.element);
                gameArea.removeChild(enemy.element);
                gameState.weapons.splice(weaponIndex, 1);
                gameState.enemies.splice(enemyIndex, 1);

                // Increase score
                updateScore(10);
            }
        });
    });

    // Check player-enemy collisions
    gameState.enemies.forEach((enemy, index) => {
        const playerObj = {
            x: gameState.playerPosition.x,
            y: gameState.playerPosition.y,
            width: player.offsetWidth,
            height: player.offsetHeight
        };

        if (detectCollision(playerObj, enemy)) {
            // Damage player and remove enemy
            updateHealth(-gameState.enemyDamage);
            gameArea.removeChild(enemy.element);
            gameState.enemies.splice(index, 1);
        }
    });

    // Check player-taco collisions
    gameState.tacos.forEach((taco, index) => {
        const playerObj = {
            x: gameState.playerPosition.x,
            y: gameState.playerPosition.y,
            width: player.offsetWidth,
            height: player.offsetHeight
        };

        if (detectCollision(playerObj, taco)) {
            // Collect taco
            gameArea.removeChild(taco.element);
            gameState.tacos.splice(index, 1);
            gameState.tacosSaved++;
            tacosSavedElement.textContent = gameState.tacosSaved;

            // Increase score
            updateScore(20);

            // Heal player
            updateHealth(5);
        }
    });
}

function detectCollision(obj1, obj2) {
    return (
        Math.abs(obj1.x - obj2.x) < (obj1.width + obj2.width) / 2 &&
        Math.abs(obj1.y - obj2.y) < (obj1.height + obj2.height) / 2
    );
}

function updateScore(points) {
    gameState.score += points;
    scoreElement.textContent = gameState.score;
}

function updateHealth(amount) {
    gameState.health = Math.min(100, Math.max(0, gameState.health + amount));
    healthElement.textContent = gameState.health;
}

function endGame() {
    gameState.inProgress = false;
    clearInterval(gameState.gameLoopId);
    clearInterval(gameState.enemySpawnId);
    clearInterval(gameState.tacoSpawnId);

    gameMessage.textContent = `Game Over! Final Score: ${gameState.score}`;
    gameMessage.classList.add('game-over');

    restartButton.style.display = 'inline-block';
}

function clearAllGameElements() {
    // Remove all enemies
    gameState.enemies.forEach(enemy => {
        gameArea.removeChild(enemy.element);
    });

    // Remove all tacos
    gameState.tacos.forEach(taco => {
        gameArea.removeChild(taco.element);
    });

    // Remove all weapons
    gameState.weapons.forEach(weapon => {
        gameArea.removeChild(weapon.element);
    });

    gameState.enemies = [];
    gameState.tacos = [];
    gameState.weapons = [];

    gameMessage.classList.remove('game-over');
}

// Initialize the game
initPlayerPosition();
