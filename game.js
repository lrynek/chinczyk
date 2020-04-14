function shuffle(array) {
    let counter = array.length;

    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        let index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        let temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
}

let GAME = {
    board: new Map,
    currentPlayer: '',
    dice: null,
    initialized: false,
    maxNumberOfPlayers: 4,
    numberOfPlayers: 4,
    pawnsPerPlayer: 4,
    playerColors: new Map([[1, 'red'], [2, 'green'], [3, 'blue'], [4, 'yellow']]),
    players: new Map,
    playersOrder: [],
    scope: null,
    winner: null,
    init(scope) {
        GAME.scope = scope;

        this.initNumberOfPlayers();
        this.initPlayers();
        this.initBoard();
        this.initDice();
        this.showBoard();

        GAME.initialized = true;

        this.play();
    },
    initNumberOfPlayers() {
        let numberOfPlayers;
        do {
            numberOfPlayers = parseInt(prompt('Podaj lczbę graczy (od 1 do 4):') || '0') || 0;
        } while (numberOfPlayers < 1 || numberOfPlayers > GAME.maxNumberOfPlayers);
        GAME.numberOfPlayers = numberOfPlayers;
    },
    initPlayers() {
        let color, name;
        let translated = new Map(
            [[1, 'czerwony'], [2, 'zielony'], [3, 'niebieski'], [4, 'żółty']]
        );

        for (let i = 0; i < GAME.numberOfPlayers; i++) {
            do {
                name = prompt(`Imię gracza ${i + 1}:`);
            } while (!name);

            let keys = Array.from(translated.keys()), colorChoice;
            do {
                if (keys.length === 1) {
                    colorChoice = keys[0];
                    continue;
                }

                let choices = [];

                translated.forEach(function (translatedColor, choice) {
                    choices.push(`${choice}: ${translatedColor}`);
                });

                colorChoice = parseInt(
                    prompt(
                        `Kolor gracza ${name} (${choices.join('| ')}):`,
                        GAME.playerColors.keys()[i + 1]
                    )
                ) || 0;
            } while (keys.indexOf(colorChoice) === -1);

            translated.delete(colorChoice);
            color = GAME.playerColors.get(colorChoice);
            this.registerPlayer({color, name});
        }

        this.registerComputerPlayer(color);
        this.initCurrentPlayer();
    },
    registerPlayer({color, isComputer = false, name}) {
        GAME.players.set(color, {color, isComputer, name});
        GAME.playersOrder.push(color);
    },
    registerComputerPlayer(color) {
        if (GAME.numberOfPlayers === 1) {
            const opposite = new Map([['red', 'blue'], ['blue', 'red'], ['green', 'yellow'], ['yellow', 'green']]);
            this.registerPlayer({color: opposite.get(color), isComputer: true, name: 'Komputer'});
            ++GAME.numberOfPlayers;
        }
    },
    initCurrentPlayer() {
        shuffle(GAME.playersOrder);
        GAME.currentPlayer = GAME.players.get(GAME.playersOrder[0]);
        this.updateCurrentPlayerDisplay();
    },
    initBoard() {
        for (let i = 0; i < GAME.maxNumberOfPlayers; i++) {
            for (let j = 0; j < GAME.pawnsPerPlayer; j++) {
                const n = j + 1;
                const color = Array.from(GAME.players.keys())[i];
                const homeId = `home-${color}-${n}`;
                GAME.board.set(`end-${color}-${n}`, {color: null, count: 0});

                if (i < GAME.numberOfPlayers) {
                    const homeField = GAME.scope.getElementById(homeId);
                    const className = `pawns-${color}-1`;
                    homeField.classList.add(className);
                    GAME.board.set(homeId, {color: color, count: 1});
                } else {
                    GAME.board.set(homeId, {color: null, count: 0});
                }
            }
        }

        for (let n = 1; n <= 40; n++) {
            GAME.board.set(`field-${n}`, {color: null, count: 0});
        }
    },
    initDice() {
        GAME.dice = {
            MIN: 1,
            MAX: 6,
            element: GAME.scope.getElementById('dice'),
            result: 1,
            max() {
                return GAME.dice.MAX === GAME.dice.result
            },
            roll() {
                GAME.playSound('dice');
                const result = Math.max(Math.round(Math.random() * GAME.dice.MAX), GAME.dice.MIN);
                GAME.dice.result = result;
                GAME.dice.element.className = 'dice';
                GAME.dice.element.classList.add(`d${result}`);
                // GAME.disableDice();
            }
        };
        GAME.dice.element.addEventListener('click', GAME.dice.roll);
    },
    showBoard() {
        GAME.scope.getElementsByTagName('main')[0].classList.remove('hidden');
    },
    play() {
        if (!GAME.initialized) return;

        let player = GAME.currentPlayer;
        alert(`Gra rozpoczęta - zaczyna ${player.name}`);

        while (!GAME.winner) {
            this.enableDice();
            this.movePawn();

            GAME.winner = player;
        }

        //
        // this.playSound('applause');
        // setTimeout(function () {
        //     alert(`BRAWO! Wygrał(a) ${GAME.winner.name}`);
        // }, 5000);
    },
    enableDice() {
        GAME.dice.element.style.pointerEvents = 'all';
        GAME.dice.element.classList.add('pulsate');
    },
    disableDice() {
        GAME.dice.element.style.pointerEvents = 'none';
        GAME.dice.element.classList.remove('pulsate');
    },
    playSound(sound) {
        if (!GAME.initialized) return;

        const idSuffix = sound.charAt(0).toUpperCase() + sound.slice(1);
        const audio = GAME.scope.getElementById(`audio${idSuffix}`);
        audio && audio.play();
    },
    updateCurrentPlayerDisplay() {
        const player = GAME.currentPlayer;
        const element = GAME.scope.getElementById('currentPlayer');
        element.textContent = player.name;
        element.className = 'player';
        element.classList.add(player.color);
    },
    movePawn() {
        const callback = function () {
            if (GAME.dice.max()) {
                GAME.playSound('start');
                GAME.playSound('yes');
            }
        };
        GAME.dice.element.addEventListener('click', callback);
    }
};
