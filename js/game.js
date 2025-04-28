// Game variables
const gameArea = document.querySelector('.game-area');
const player = document.getElementById('player');
const scoreElement = document.getElementById('score');
const tacosSavedElement = document.getElementById('tacos-saved');
const healthElement = document.getElementById('health');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const gameMessage = document.getElementById('game-message');
const factionMeter = document.getElementById('faction-meter');
const ellieSelectBtn = document.getElementById('ellie-select');
const abbySelectBtn = document.getElementById('abby-select');

// Season 2 locations
const locations = ['jackson', 'seattle', 'santa-barbara'];

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
    collectibles: [false, false, false, false, false],
    enemySpawnRate: 2000,
    tacoSpawnRate: 3000,
    specialTacoRate: 15000,
    lastAttackTime: 0,
    attackCooldown: 500, // milliseconds
    enemyDamage: 10,
    currentCharacter: 'ellie', // ellie or abby
    factionAlignment: 50, // 0-100, 0 = FEDRA, 100 = Fireflies
    currentLocation: 0,
    locationChangeTime: 30000, // ms before location changes
    locationTimer: null,
    gameLoopId: null,
    enemySpawnId: null,
    tacoSpawnId: null,
    specialTacoId: null,
    difficulty: 1
};

// Enemy types with references to Season 2
const enemyTypes = [
    { type: 'runner', chance: 60, scale: 1, speed: 1, health: 1, damage: 10, points: 10 },
    { type: 'clicker', chance: 25, scale: 1.1, speed: 0.7, health: 2, damage: 15, points: 15 },
    { type: 'bloater', chance: 10, scale: 1.5, speed: 0.5, health: 3, damage: 20, points: 20 },
    { type: 'rat-king', chance: 5, scale: 2, speed: 0.4, health: 5, damage: 30, points: 50 }
];

// SVG templates
const svgTemplates = {
    ellie: `<svg viewBox="0 0 50 70" xmlns="http://www.w3.org/2000/svg">
        <g>
            <!-- Body -->
            <rect x="15" y="25" width="20" height="30" fill="#4a6d7c" />
            <!-- Head -->
            <circle cx="25" cy="15" r="10" fill="#d3a17e" />
            <!-- Hair -->
            <path d="M18 12 Q25 5 32 12" stroke="#35241a" stroke-width="5" fill="none" />
            <!-- Eyes -->
            <circle cx="22" cy="13" r="1.5" fill="#201000" />
            <circle cx="28" cy="13" r="1.5" fill="#201000" />
            <!-- Mouth -->
            <path d="M23 18 Q25 20 27 18" stroke="#201000" stroke-width="1" fill="none" />
            <!-- Scar -->
            <path d="M22 9 L24 11" stroke="#883333" stroke-width="0.8" />
            <!-- Guitar -->
            <rect x="32" y="35" width="10" height="15" rx="2" fill="#8B4513" />
        </g>
    </svg>`,
    abby: `<svg viewBox="0 0 50 70" xmlns="http://www.w3.org/2000/svg">
        <g>
            <!-- Body -->
            <rect x="15" y="25" width="20" height="30" fill="#5a5a46" />
            <!-- Head -->
            <circle cx="25" cy="15" r="9" fill="#e6c8a8" />
            <!-- Hair (short) -->
            <path d="M20 9 Q25 6 30 9" stroke="#c0a080" stroke-width="3" fill="#c0a080" />
            <!-- Eyes -->
            <circle cx="22" cy="13" r="1.5" fill="#201000" />
            <circle cx="28" cy="13" r="1.5" fill="#201000" />
            <!-- Mouth -->
            <path d="M22 18 Q25 17 28 18" stroke="#201000" stroke-width="1" fill="none" />
            <!-- Muscles -->
            <rect x="10" y="30" width="5" height="10" rx="2" fill="#5a5a46" />
            <rect x="35" y="30" width="5" height="10" rx="2" fill="#5a5a46" />
        </g>
    </svg>`,
    runner: `<svg viewBox="0 0 40 60" xmlns="http://www.w3.org/2000/svg">
        <g>
            <!-- Body -->
            <rect x="12" y="20" width="16" height="25" fill="#677d68" />
            <!-- Head -->
            <circle cx="20" cy="12" r="8" fill="#94a596" />
            <!-- Infected features -->
            <path d="M17 14 Q20 20 23 14" stroke="#677d68" stroke-width="2" fill="none" />
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
    clicker: `<svg viewBox="0 0 40 60" xmlns="http://www.w3.org/2000/svg">
        <g>
            <!-- Body -->
            <rect x="12" y="20" width="16" height="25" fill="#677d68" />
            <!-- Head -->
            <circle cx="20" cy="12" r="8" fill="#94a596" />
            <!-- Fungus -->
            <path d="M15 8 Q20 2 25 8" stroke="#94a596" stroke-width="4" fill="#94a596" />
            <circle cx="15" cy="7" r="3" fill="#94a596" />
            <circle cx="25" cy="7" r="3" fill="#94a596" />
            <!-- No eyes - covered in fungus -->
            <path d="M16 12 Q20 10 24 12" stroke="#677d68" stroke-width="3" fill="#677d68" />
            <!-- Arms -->
            <rect x="5" y="25" width="7" height="4" fill="#677d68" />
            <rect x="28" y="25" width="7" height="4" fill="#677d68" />
            <!-- Legs -->
            <rect x="12" y="45" width="6" height="10" fill="#677d68" />
            <rect x="22" y="45" width="6" height="10" fill="#677d68" />
        </g>
    </svg>`,
    bloater: `<svg viewBox="0 0 40 60" xmlns="http://www.w3.org/2000/svg">
        <g>
            <!-- Body -->
            <rect x="10" y="15" width="20" height="30" rx="5" fill="#565d4e" />
            <!-- Head -->
            <circle cx="20" cy="10" r="7" fill="#7b8574" />
            <!-- Fungus growths all over -->
            <circle cx="13" cy="8" r="3" fill="#7b8574" />
            <circle cx="27" cy="8" r="3" fill="#7b8574" />
            <circle cx="20" cy="5" r="3" fill="#7b8574" />
            <circle cx="10" cy="20" r="4" fill="#7b8574" />
            <circle cx="30" cy="20" r="4" fill="#7b8574" />
            <circle cx="15" cy="30" r="3" fill="#7b8574" />
            <circle cx="25" cy="30" r="3" fill="#7b8574" />
            <!-- No facial features visible -->
            <!-- Legs -->
            <rect x="12" y="45" width="7" height="10" fill="#565d4e" />
            <rect x="21" y="45" width="7" height="10" fill="#565d4e" />
        </g>
    </svg>`,
    ratKing: `<svg viewBox="0 0 50 70" xmlns="http://www.w3.org/2000/svg">
        <g>
            <!-- Massive deformed body -->
            <path d="M10 20 Q25 15 40 20 Q45 35 40 50 Q25 55 10 50 Q5 35 10 20 Z" fill="#3d4237" />
            <!-- Multiple heads fused together -->
            <circle cx="17" cy="15" r="6" fill="#626a59" />
            <circle cx="25" cy="10" r="7" fill="#626a59" />
            <circle cx="33" cy="15" r="6" fill="#626a59" />
            <!-- Fungal growths -->
            <circle cx="15" cy="12" r="3" fill="#7b8574" />
            <circle cx="25" cy="7" r="4" fill="#7b8574" />
            <circle cx="35" cy="12" r="3" fill="#7b8574" />
            <circle cx="10" cy="25" r="5" fill="#7b8574" />
            <circle cx="40" cy="25" r="5" fill="#7b8574" />
            <circle cx="20" cy="40" r="4" fill="#7b8574" />
            <circle cx="30" cy="40" r="4" fill="#7b8574" />
            <!-- Limbs sticking out randomly -->
            <rect x="5" y="30" width="8" height="4" rx="2" fill="#3d4237" />
            <rect x="37" y="30" width="8" height="4" rx="2" fill="#3d4237" />
            <rect x="15" cy="45" width="6" height="10" rx="2" fill="#3d4237" />
            <rect x="30" cy="45" width="6" height="10" rx="2" fill="#3d4237" />
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
    </svg>`,
    specialTaco: `<svg viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
        <g>
            <!-- Taco Shell -->
            <path d="M5 20 Q15 5 25 20 L25 20 Q15 25 5 20 Z" fill="#ffdb99" stroke="#ffab40" stroke-width="1" />
            <!-- Lettuce -->
            <path d="M7 19 Q15 10 23 19" stroke="#8bc34a" stroke-width="2" stroke-linecap="round" />
            <path d="M8 17 Q15 12 22 17" stroke="#8bc34a" stroke-width="2" stroke-linecap="round" />
            <!-- Cheese -->
            <path d="M8 16 L22 16 L20 13 L10 13 Z" fill="#ffd700" />
            <!-- Special Meat -->
            <path d="M9 14 Q15 11 21 14" stroke="#a52a2a" stroke-width="3" stroke-linecap="round" />
            <!-- Taco Bell Logo with star -->
            <circle cx="15" cy="10" r="3" fill="#9c27b0" />
            <path d="M15 7 L16 10 L19 10 L16.5 12 L17.5 15 L15 13 L12.5 15 L13.5 12 L11 10 L14 10 Z" fill="#ffffff" />
        </g>
    </svg>`,
    collectible: `<svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <g>
            <circle cx="10" cy="10" r="8" fill="#4fc4cf" fill-opacity="0.3" stroke="#4fc4cf" />
            <path d="M6 10 L9 13 L14 7" stroke="white" stroke-width="2" fill="none" />
        </g>
    </svg>`
};

// Season 2 collectibles - trading cards
const collectibles = [
    { name: 'Cordyceps Diagram', found: false },
    { name: 'Firefly Pendant', found: false },
    { name: 'Dinosaur Toy', found: false },
    { name: 'Ellie\'s Switchblade', found: false },
    { name: 'Abby\'s Coin', found: false }
];

// Key event listeners
document.addEventListener('keydown', (e) => {
    gameState.keys[e.key] = true;

    // Attack with spacebar
    if (e.key === ' ' && gameState.inProgress) {
        attackEnemy();
        // Prevent default scrolling behavior
        e.preventDefault();
    }

    // Also prevent default for arrow keys to avoid page scrolling
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    gameState.keys[e.key] = false;

    // Also prevent default for space and arrow keys on key up
    if (e.key === ' ' || ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
    }
});

// Character selection buttons
ellieSelectBtn.addEventListener('click', () => {
    selectCharacter('ellie');
});

abbySelectBtn.addEventListener('click', () => {
    selectCharacter('abby');
});

function selectCharacter(character) {
    gameState.currentCharacter = character;

    // Update UI
    if (character === 'ellie') {
        ellieSelectBtn.classList.add('active');
        abbySelectBtn.classList.remove('active');
    } else {
        ellieSelectBtn.classList.remove('active');
        abbySelectBtn.classList.add('active');
    }

    if (player) {
        player.innerHTML = svgTemplates[character];
    }
}

// Start button event listener
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', restartGame);

// Initialize player position and add SVG
function initPlayerPosition() {
    player.style.left = `${gameState.playerPosition.x - 25}px`; // Adjust for player width
    player.style.bottom = '20px';
    player.innerHTML = svgTemplates[gameState.currentCharacter];
}

// Game functions
function startGame() {
    if (gameState.inProgress) return;

    resetGameState();
    gameState.inProgress = true;
    startButton.style.display = 'none';
    restartButton.style.display = 'none';
    gameMessage.textContent = '';

    // Start location rotation
    setLocation(0);
    gameState.locationTimer = setInterval(rotateLocation, gameState.locationChangeTime);

    // Start game loops
    gameState.gameLoopId = setInterval(gameLoop, 16);
    gameState.enemySpawnId = setInterval(spawnEnemy, gameState.enemySpawnRate);
    gameState.tacoSpawnId = setInterval(spawnTaco, gameState.tacoSpawnRate);
    gameState.specialTacoId = setInterval(spawnSpecialTaco, gameState.specialTacoRate);

    initPlayerPosition();
}

function rotateLocation() {
    const nextLocation = (gameState.currentLocation + 1) % locations.length;
    setLocation(nextLocation);

    // Increase difficulty with each location change
    gameState.difficulty += 0.5;

    // Show location message
    const locationName = locations[nextLocation].replace('-', ' ');
    gameMessage.textContent = `Traveling to ${locationName.charAt(0).toUpperCase() + locationName.slice(1)}...`;
    setTimeout(() => {
        if (gameState.inProgress) {
            gameMessage.textContent = '';
        }
    }, 2000);
}

function setLocation(index) {
    gameState.currentLocation = index;

    // Remove all location classes
    gameArea.classList.remove(...locations);

    // Add the current location class
    gameArea.classList.add(locations[index]);
}

function restartGame() {
    clearAllGameElements();
    startGame();
}

function resetGameState() {
    gameState.score = 0;
    gameState.tacosSaved = 0;
    gameState.health = 100;
    gameState.factionAlignment = 50;
    gameState.playerPosition = {
        x: gameArea.offsetWidth / 2,
        y: gameArea.offsetHeight - 90
    };
    gameState.enemies = [];
    gameState.tacos = [];
    gameState.weapons = [];
    gameState.collectibles = [false, false, false, false, false];
    gameState.difficulty = 1;

    // Update UI
    scoreElement.textContent = gameState.score;
    tacosSavedElement.textContent = gameState.tacosSaved;
    healthElement.textContent = gameState.health;
    updateFactionMeter();
}

function updateFactionMeter() {
    factionMeter.style.width = `${gameState.factionAlignment}%`;
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
    // Select enemy type based on probability
    const roll = Math.random() * 100;
    let enemyType = enemyTypes[0];
    let cumulative = 0;

    for (const type of enemyTypes) {
        cumulative += type.chance;
        if (roll < cumulative) {
            enemyType = type;
            break;
        }
    }

    const enemy = document.createElement('div');
    enemy.classList.add('enemy');
    enemy.classList.add(enemyType.type);

    const enemyWidth = 40 * enemyType.scale;
    const randomX = Math.random() * (gameArea.offsetWidth - enemyWidth);

    enemy.style.left = `${randomX}px`;
    enemy.style.top = '0px';
    enemy.innerHTML = svgTemplates[enemyType.type];

    gameArea.appendChild(enemy);

    // Adjust speed based on difficulty
    const adjustedSpeed = enemyType.speed * (1 + (gameState.difficulty - 1) * 0.2);

    gameState.enemies.push({
        element: enemy,
        x: randomX + (enemyWidth / 2),
        y: 0,
        speed: adjustedSpeed + Math.random() * 1.5,
        width: enemyWidth,
        height: 60 * enemyType.scale,
        type: enemyType.type,
        health: enemyType.health,
        damage: enemyType.damage,
        points: enemyType.points
    });

    // Random chance to add a collectible with the enemy
    if (Math.random() < 0.05) {
        spawnCollectible(randomX + enemyWidth/2);
    }
}

function spawnCollectible(x) {
    // Find an uncollected item
    let uncollectedIndices = [];
    for (let i = 0; i < gameState.collectibles.length; i++) {
        if (!gameState.collectibles[i]) {
            uncollectedIndices.push(i);
        }
    }

    if (uncollectedIndices.length === 0) return;

    const randomIndex = uncollectedIndices[Math.floor(Math.random() * uncollectedIndices.length)];

    const collectible = document.createElement('div');
    collectible.classList.add('collectible');

    collectible.style.left = `${x - 10}px`;
    collectible.style.top = '0px';
    collectible.innerHTML = svgTemplates.collectible;

    gameArea.appendChild(collectible);

    gameState.tacos.push({
        element: collectible,
        x: x,
        y: 0,
        speed: 1 + Math.random(),
        width: 20,
        height: 20,
        isCollectible: true,
        collectibleIndex: randomIndex
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
        speed: 1 + Math.random() * 1.5,
        width: tacoWidth,
        height: 30,
        isSpecial: false
    });
}

function spawnSpecialTaco() {
    const taco = document.createElement('div');
    taco.classList.add('taco');
    taco.classList.add('special');

    const tacoWidth = 30;
    const randomX = Math.random() * (gameArea.offsetWidth - tacoWidth);

    taco.style.left = `${randomX}px`;
    taco.style.top = '0px';
    taco.innerHTML = svgTemplates.specialTaco;

    gameArea.appendChild(taco);

    gameState.tacos.push({
        element: taco,
        x: randomX + (tacoWidth / 2),
        y: 0,
        speed: 0.8 + Math.random(),
        width: tacoWidth,
        height: 30,
        isSpecial: true
    });
}

function moveEnemies() {
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        const enemy = gameState.enemies[i];
        enemy.y += enemy.speed;
        enemy.element.style.top = `${enemy.y}px`;

        // Remove enemies that go off screen
        if (enemy.y > gameArea.offsetHeight) {
            gameArea.removeChild(enemy.element);
            gameState.enemies.splice(i, 1);
        }
    }
}

function moveTacos() {
    for (let i = gameState.tacos.length - 1; i >= 0; i--) {
        const taco = gameState.tacos[i];
        taco.y += taco.speed;
        taco.element.style.top = `${taco.y}px`;

        // Remove tacos that go off screen
        if (taco.y > gameArea.offsetHeight) {
            gameArea.removeChild(taco.element);
            gameState.tacos.splice(i, 1);

            // Lose points for missed tacos (but not collectibles)
            if (!taco.isCollectible) {
                updateScore(-5);
                // Shift faction alignment toward FEDRA for wasting resources
                updateFactionAlignment(-2);
            }
        }
    }
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

    // Abby's weapons are stronger but slower
    const weaponSpeed = gameState.currentCharacter === 'abby' ? 6 : 8;
    const weaponDamage = gameState.currentCharacter === 'abby' ? 2 : 1;

    gameState.weapons.push({
        element: weapon,
        x: weaponX + (weaponWidth / 2),
        y: weaponY,
        width: weaponWidth,
        height: 5,
        speed: weaponSpeed,
        damage: weaponDamage
    });
}

function moveWeapons() {
    for (let i = gameState.weapons.length - 1; i >= 0; i--) {
        const weapon = gameState.weapons[i];
        weapon.y -= weapon.speed; // Moving up
        weapon.element.style.bottom = `${gameArea.offsetHeight - weapon.y}px`;

        // Remove weapons that go off screen
        if (weapon.y < 0) {
            gameArea.removeChild(weapon.element);
            gameState.weapons.splice(i, 1);
        }
    }
}

function checkCollisions() {
    // Check weapon-enemy collisions
    for (let i = gameState.weapons.length - 1; i >= 0; i--) {
        const weapon = gameState.weapons[i];
        let weaponHit = false;

        for (let j = gameState.enemies.length - 1; j >= 0; j--) {
            const enemy = gameState.enemies[j];

            if (detectCollision(weapon, enemy)) {
                enemy.health -= weapon.damage;
                weaponHit = true;

                if (enemy.health <= 0) {
                    // Remove enemy if health drops to 0
                    gameArea.removeChild(enemy.element);

                    // Award points based on enemy type
                    updateScore(enemy.points);

                    // Shift faction alignment toward Fireflies for fighting infected
                    updateFactionAlignment(3);

                    gameState.enemies.splice(j, 1);
                }
                break;
            }
        }

        if (weaponHit) {
            // Remove the weapon when it hits
            gameArea.removeChild(weapon.element);
            gameState.weapons.splice(i, 1);
        }
    }

    // Check player-enemy collisions
    const playerObj = {
        x: gameState.playerPosition.x,
        y: gameState.playerPosition.y,
        width: player.offsetWidth,
        height: player.offsetHeight
    };

    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        const enemy = gameState.enemies[i];

        if (detectCollision(playerObj, enemy)) {
            // Damage player and remove enemy
            updateHealth(-enemy.damage);
            gameArea.removeChild(enemy.element);
            gameState.enemies.splice(i, 1);

            // Play damage animation
            player.style.filter = "brightness(0.5) sepia(1) hue-rotate(-50deg) saturate(6)";
            setTimeout(() => {
                player.style.filter = "";
            }, 200);
        }
    }

    // Check player-taco collisions
    for (let i = gameState.tacos.length - 1; i >= 0; i--) {
        const taco = gameState.tacos[i];

        if (detectCollision(playerObj, taco)) {
            // Remove the taco or collectible
            gameArea.removeChild(taco.element);

            if (taco.isCollectible) {
                // Handle collectible
                gameState.collectibles[taco.collectibleIndex] = true;
                updateScore(50);

                // Show collectible message
                const collectibleName = collectibles[taco.collectibleIndex].name;
                gameMessage.textContent = `Found: ${collectibleName}!`;
                setTimeout(() => {
                    if (gameState.inProgress) {
                        gameMessage.textContent = '';
                    }
                }, 2000);

                // Shift faction alignment based on collectible
                updateFactionAlignment(5);
            } else if (taco.isSpecial) {
                // Collect special taco
                gameState.tacosSaved += 3;
                tacosSavedElement.textContent = gameState.tacosSaved;

                // Increase score
                updateScore(50);

                // Heal player more
                updateHealth(15);

                // Special effect based on character
                if (gameState.currentCharacter === 'ellie') {
                    // Ellie gets temporary invincibility
                    player.style.filter = "drop-shadow(0 0 10px gold)";
                    setTimeout(() => {
                        player.style.filter = "";
                    }, 3000);
                } else {
                    // Abby gets to clear enemies
                    clearEnemies();
                }
            } else {
                // Collect regular taco
                gameState.tacosSaved++;
                tacosSavedElement.textContent = gameState.tacosSaved;

                // Increase score
                updateScore(20);

                // Heal player
                updateHealth(5);
            }

            gameState.tacos.splice(i, 1);
        }
    }
}

function clearEnemies() {
    gameState.enemies.forEach(enemy => {
        gameArea.removeChild(enemy.element);
    });
    gameState.enemies = [];
}

function detectCollision(obj1, obj2) {
    // Increase the effective size of hitboxes by adding a buffer
    const hitboxBuffer = 10;
    return (
        Math.abs(obj1.x - obj2.x) < (obj1.width + obj2.width) / 2 + hitboxBuffer &&
        Math.abs(obj1.y - obj2.y) < (obj1.height + obj2.height) / 2 + hitboxBuffer
    );
}

function updateScore(points) {
    gameState.score += points;
    scoreElement.textContent = gameState.score;
}

function updateHealth(amount) {
    // Abby has more health capacity
    const maxHealth = gameState.currentCharacter === 'abby' ? 120 : 100;
    gameState.health = Math.min(maxHealth, Math.max(0, gameState.health + amount));
    healthElement.textContent = gameState.health;
}

function updateFactionAlignment(change) {
    gameState.factionAlignment = Math.min(100, Math.max(0, gameState.factionAlignment + change));
    updateFactionMeter();

    // Story events based on faction alignment
    if (gameState.factionAlignment <= 20) {
        // FEDRA-aligned ending path
    } else if (gameState.factionAlignment >= 80) {
        // Fireflies-aligned ending path
    }
}

function endGame() {
    gameState.inProgress = false;
    clearInterval(gameState.gameLoopId);
    clearInterval(gameState.enemySpawnId);
    clearInterval(gameState.tacoSpawnId);
    clearInterval(gameState.specialTacoId);
    clearInterval(gameState.locationTimer);

    // Different game over messages based on faction alignment
    let endingMessage = "";

    if (gameState.factionAlignment < 30) {
        endingMessage = "FEDRA found your Taco Bell stash. Game Over!";
    } else if (gameState.factionAlignment > 70) {
        endingMessage = "The Fireflies will use your tacos to save humanity!";
    } else {
        endingMessage = "You're caught in the crossfire between factions!";
    }

    gameMessage.textContent = `${endingMessage} Final Score: ${gameState.score}`;
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
