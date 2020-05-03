const timeout = async ms => new Promise(res => setTimeout(res, ms));

function shuffle(array) {
    let counter = array.length;

    while (counter > 0) {
        let index = Math.floor(Math.random() * counter);
        --counter;
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
    userClicked: false,
    winner: null,
    init(scope) {
        GAME.scope = scope;
        GAME.initNumberOfPlayers();
        GAME.initPlayers();
        GAME.initBoard();
        GAME.initDice();
        GAME.initClickableElements();
        GAME.disableKeys();
        GAME.showBoard();
        GAME.initialized = true;
        GAME.play();
    },
    initNumberOfPlayers() {
        let numberOfPlayers = 1;
        // do {
        //     numberOfPlayers = parseInt(prompt('Podaj lczbę graczy (od 1 do 4):') || '0') || 0;
        // } while (numberOfPlayers < 1 || numberOfPlayers > GAME.maxNumberOfPlayers);
        GAME.numberOfPlayers = numberOfPlayers;
    },
    initPlayers() {
        let color, name;
        // let translated = new Map(
        //     [[1, 'czerwony'], [2, 'zielony'], [3, 'niebieski'], [4, 'żółty']]
        // );
        //
        // for (let i = 0; i < GAME.numberOfPlayers; i++) {
        //     do {
        //         name = prompt(`Imię gracza ${i + 1}:`);
        //     } while (!name);
        //
        //     let keys = Array.from(translated.keys()), colorChoice;
        //     do {
        //         if (keys.length === 1) {
        //             colorChoice = keys[0];
        //             continue;
        //         }
        //
        //         let choices = [];
        //
        //         translated.forEach(function (translatedColor, choice) {
        //             choices.push(`${choice}: ${translatedColor}`);
        //         });
        //
        //         colorChoice = parseInt(
        //             prompt(
        //                 `Kolor gracza ${name} (${choices.join('| ')}):`,
        //                 GAME.playerColors.keys()[i + 1]
        //             )
        //         ) || 0;
        //     } while (keys.indexOf(colorChoice) === -1);
        //
        //     translated.delete(colorChoice);
        //     color = GAME.playerColors.get(colorChoice);
        //     GAME.registerPlayer({color, name});
        // }

        color = 'red';
        GAME.registerPlayer({color, name: 'Łukasz'});
        GAME.registerComputerPlayer(color);
        GAME.initCurrentPlayer();
    },
    registerPlayer({color, isComputer = false, name}) {
        GAME.players.set(color, {color, isComputer, name, pawns: {home: 4, ended: 0, playing: 0}});
        GAME.playersOrder.push(color);
    },
    registerComputerPlayer(color) {
        if (GAME.numberOfPlayers === 1) {
            const opposite = new Map([['red', 'blue'], ['blue', 'red'], ['green', 'yellow'], ['yellow', 'green']]);
            GAME.registerPlayer({color: opposite.get(color), isComputer: true, name: 'Komputer'});
            ++GAME.numberOfPlayers;
        }
    },
    initCurrentPlayer() {
        shuffle(GAME.playersOrder);
        let player = GAME.players.get(GAME.playersOrder[0]);
        player.isComputer ? player = GAME.players.get(GAME.playersOrder[1]) : player;
        GAME.currentPlayer = player;
        GAME.updateCurrentPlayerDisplay();
    },
    initBoard() {
        for (let i = 0; i < GAME.numberOfPlayers; i++) {
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
            disable() {
                GAME.dice.element.style.pointerEvents = 'none';
                GAME.dice.element.classList.remove('pulsate');
            },
            enable() {
                GAME.dice.element.style.pointerEvents = 'all';
                GAME.dice.element.classList.add('pulsate');
            },
            max() {
                return GAME.dice.MAX === GAME.dice.result
            },
            async roll() {
                const result = Math.max(Math.round(Math.random() * GAME.dice.MAX), GAME.dice.MIN);
                GAME.dice.result = result;
                GAME.dice.element.className = 'dice';
                GAME.dice.element.classList.add(`d${result}`);
                GAME.dice.disable();
                return GAME.playSound('dice');
            }
        };
        GAME.dice.element.addEventListener('click', GAME.dice.roll);
    },
    initClickableElements() {
        GAME.scope.addEventListener('click', (event) => {
            GAME.userClicked = event.target;
        });
    },
    disableKeys() {
        window.addEventListener('keydown', function (event) {
            const R = 82;
            const disabledKeys = [R];

            if (event.ctrlKey || event.metaKey) { // CTRL || CMD
                if (disabledKeys.indexOf(event.keyCode) > -1) {
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                }
            }
        })
    },
    showBoard() {
        GAME.scope.getElementsByTagName('main')[0].classList.remove('hidden');
    },
    play: async () => {
        if (!GAME.initialized) return new Promise(() => null);

        let player = GAME.currentPlayer;
        alert(`Gra rozpoczęta - zaczyna ${player.name}`);

        do {
            do {
                await GAME.move();
            } while (GAME.dice.max())
            GAME.checkIfPlayerWins();
            GAME.nextPlayer();
        } while (!GAME.winner);

        GAME.playSound('applause').then(() => alert(`BRAWO! Wygrał(a) ${GAME.winner.name}`));

        return new Promise(() => null);
    },
    move: async function () {
        if (GAME.currentPlayer.isComputer) {
            await timeout(800);
            await GAME.dice.roll();
        } else {
            GAME.dice.enable();
            await GAME.waitForUserClick(GAME.dice.element);
        }

        await GAME.movePawn();

        return timeout(2000);
    },
    async waitForUserClick(target) {
        while (false === GAME.userClicked || false === GAME.userClicked.isSameNode(target)) await timeout(50);
        GAME.userClicked = false;
    },
    async movePawn() {
        const player = GAME.currentPlayer;

        switch (player.pawns.playing) {
            case 0: {
                return GAME.dice.max() ? await GAME.moveFirstPawn(player) : await GAME.playSound('no');
            }
            case 1: {
                GAME.dice.max() ? await GAME.choosePawn(player) : await GAME.moveTheOnlyPlayingPawn(player);
            }
        }
    },
    async moveFirstPawn(player) {
        const color = player.color;
        const currentPawnClass = `pawns-${color}-1`;
        const homeField = GAME.scope.getElementById(`home-${color}-1`);
        return this.moveHomePawn(player, homeField, currentPawnClass);
    },
    moveHomePawn: async function (player, homeField, currentPawnClass) {
        const color = player.color;
        const startField = GAME.scope.querySelector(`.${color}.start`);
        homeField.classList.remove(currentPawnClass);
        startField.classList.add(currentPawnClass);
        --player.pawns.home;
        ++player.pawns.playing;
        await GAME.playSound('start');
        return GAME.playSound('yes');
    },
    async moveTheOnlyPlayingPawn(player) {
        const color = player.color;
        const currentPawnClass = `pawns-${color}-1`;
        const currentField = GAME.scope.querySelector(`[data-${color}].${currentPawnClass}`);
        const currentPosition = parseInt(currentField.dataset[color]);
        const newPosition = currentPosition + GAME.dice.result;
        const newField = GAME.scope.querySelector(`[data-${color}="${newPosition}"]`);
        currentField.classList.remove(currentPawnClass);
        newField.classList.add(currentPawnClass);
        return GAME.playSound('move');
    },
    async choosePawn(player) {
        await GAME.waitForUserClick();


    },
    async playSound(sound) {
        if (!GAME.initialized) return;

        const idSuffix = sound.charAt(0).toUpperCase() + sound.slice(1);
        const audio = GAME.scope.getElementById(`audio${idSuffix}`);

        return audio.play();
    },
    checkIfPlayerWins() {
        if (GAME.currentPlayer.pawns.ended === GAME.pawnsPerPlayer) {
            GAME.winner = GAME.currentPlayer;
        }
    },
    nextPlayer() {
        if (GAME.winner) return;

        let position = GAME.playersOrder.indexOf(GAME.currentPlayer.color);
        position + 1 < GAME.numberOfPlayers ? ++position : position = 0;
        const newColor = GAME.playersOrder[position];
        GAME.currentPlayer = GAME.players.get(newColor);
        GAME.updateCurrentPlayerDisplay();
    },
    updateCurrentPlayerDisplay() {
        const player = GAME.currentPlayer;
        const element = GAME.scope.getElementById('currentPlayer');
        element.textContent = player.name;
        element.className = 'player';
        element.classList.add(player.color);
    }
};
