import { RoundStartTimer } from '../classes/roundStartTimer';
import { GameTimer } from '../classes/gameTimer';
import { Player } from '../classes/player';
import { Arena } from '../classes/arena';
import { WeaponManager } from '../classes/Weapons/weaponManager';
import { CONFIG } from '../config';
import { Scoreboard } from '../classes/scoreboard';

const TEMP_ARENA_COLOR: number = 0xadd8e6;

// FIXME: Arena should be responsive
export class Main extends Phaser.State {
    private rounds: number;
    private currentRound: number;
    private players: Phaser.Group;
    private static numberOfPlayers: number = 0;
    private controlledPlayer: Player;
    private cursors: Phaser.CursorKeys;
    private arena: Arena;
    private roundStartTimer: RoundStartTimer;
    private gameTimer: GameTimer;
    private space: Phaser.Key;
    private weaponManager: WeaponManager;
    private scoreboard: Scoreboard;
    private onRoundEnd: Phaser.Signal;

    public init(rounds: number) {
        this.scoreboard = new Scoreboard(this.game);
        this.rounds = rounds || 3;
        this.currentRound = 1;
        this.onRoundEnd = new Phaser.Signal();
        this.players = new Phaser.Group(this.game);
        this.cursors = this.game.input.keyboard.createCursorKeys();
        this.arena = new Arena(this.game, this.world.centerX, this.world.centerY, this.world.height - 100);
        this.gameTimer = new GameTimer(this.game, this.arena, this.world.centerX, 35);
        this.roundStartTimer = new RoundStartTimer(this.game, this.players);
        this.game.time.add(this.roundStartTimer);
        this.game.time.add(this.gameTimer);
        this.space = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        this.weaponManager = new WeaponManager(this.game);
        this.roundStartTimer.onRoundStart.add(this.gameTimer.start, this.gameTimer);
    }
    public create() {
        this.addPlayer('Tome', '#F00F00');
        this.addPlayer('Dirda', '#F0000F');
        this.addPlayer('Bube', '#FF0F0F');
        this.addPlayer('Wojte', '#FFF000');
        this.addPlayer('Karole', '#FF00F0');
        this.addPlayer('Pawele', '#FF00FF');
        this.onRoundEnd.add(() => {
            setTimeout(() => {
                this.nextRound();
            }, 2000);
        }, this);
        this.initPhysics();

        this.controlledPlayer = <Player>this.players.getChildAt(0);
        this.arena.assignStartPositionsToPlayers(this.players);
        this.roundStartTimer.start();
        this.roundStartTimer.startRoundCountdown();
        this.game.world.bringToTop(this.players);
        this.scoreboard.drawScoreboard();
    }
    private initPhysics(): void {
        let playerCollisionGroups = [];
        this.game.physics.startSystem(Phaser.Physics.P2JS);
        this.game.physics.p2.setImpactEvents(true);
        this.players.forEach(player => {
            this.game.physics.p2.enable(player, false);
            let playerCollisionGroup = this.game.physics.p2.createCollisionGroup();
            player.body.setCircle(CONFIG.PLAYER_COLLISION_SIZE);
            player.body.setCollisionGroup(playerCollisionGroup);
            playerCollisionGroups.push(playerCollisionGroup);
        }, this);

        this.players.forEach(p => p.body.collides(playerCollisionGroups, this.playersCollideCallback), this);
    }
    private addPlayer(name: string, playerColor: string) {
        let player = new Player(this.game, this.arena.x, this.arena.y, name, playerColor, Main.numberOfPlayers++);
        player.events.onKilled.add(this.roundEnd, this, 1);
        this.players.add(player);
        this.scoreboard.addPlayerToScoreboard(name, playerColor);
    }

    public update() {
        this.players.forEachAlive(player => {
            if (!player.fellOffArena && !this.arena.collision.contains(player.body.x, player.body.y)) {
                player.kill();
            }
        }, this);
        if (this.space.isDown) {
            this.weaponManager.use(this.controlledPlayer);
        }
        if (!this.controlledPlayer.locked) {
            if (this.cursors.left.isDown) {
                this.controlledPlayer.body.velocity.x -= 5;
                this.controlledPlayer.body.angle = 90;
            } else if (this.cursors.right.isDown) {
                this.controlledPlayer.body.velocity.x += 5;
                this.controlledPlayer.body.angle = -90;
            }

            if (this.cursors.up.isDown) {
                this.controlledPlayer.body.velocity.y -= 5;
                this.controlledPlayer.body.angle = 180;
            } else if (this.cursors.down.isDown) {
                this.controlledPlayer.body.velocity.y += 5;
                this.controlledPlayer.body.angle = 0;
            }
        }
    }

    private roundEnd(): void {
        if (this.players.countLiving() === 1) {
            let roundSurvivor: Player = this.players.getFirstAlive();
            this.arena.showRoundWinner(roundSurvivor.name);
            this.scoreboard.updateInfo(roundSurvivor.playerIndex);

            if (this.currentRound >= this.rounds) {
                // TODO: Finish game and redirect to score screen;
                this.showGameResults();
            }
            else {
                this.killAll();
                this.onRoundEnd.dispatch();
            }
        }
    }
    private killAll() {
        this.players.callAll('kill', null);
    }
    private nextRound(): void {
        ++this.currentRound;
        this.arena.reset();
        this.gameTimer.reset();
        this.arena.destroyWinnerText();
        this.roundStartTimer.startRoundCountdown();
        this.players.callAll('revive', null);

    }
    private playersCollideCallback(playerBody1: Phaser.Physics.P2.Body, playerBody2: Phaser.Physics.P2.Body) {
        (<Player>playerBody1.sprite).lastTouchedBy = <Player>playerBody2.sprite;
    }
    private showGameResults() {
    }
}
