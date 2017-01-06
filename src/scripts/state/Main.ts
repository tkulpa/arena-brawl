export class Main extends Phaser.State {
    private roundsNum: number;
    private const START_POS_EDGE_OFFSET: number = 50;
    private const DEFAULT_ANIMATION_PLAYER: string = "fly";
    private const PLAYER_SPRITESHEET: string = "ship";
    private const PLAYER_COLLISION_SIZE: number = 28;
    private const TEMP_ARENA_COLOR: number = 0xadd8e6;
    private players: Phaser.Group;
    private cursors: Phaser.CursorKeys;
    private arena: Phaser.Circle;
    init(roundsNum: number) {
        this.roundsNum = roundsNum || 2;
        this.players = new Phaser.Group(this.game);
        this.cursors = this.game.input.keyboard.createCursorKeys();
    }
    create() {
        this.setupArena();
        this.game.world.bringToTop(this.players);
        this.addPlayer("Player1");
        this.addPlayer("Player2");
        this.addPlayer("Player3");
        this.addPlayer("Player4");
        this.addPlayer("Player5");
        this.addPlayer("Player6");
        this.initPhysics();
        this.placePlayersAtStartingPos();
    }
    setupArena() {
        this.arena = new Phaser.Circle(450, 450, 900);
        // TODO: Replace temp graphic for arena
        let graphics = this.game.add.graphics(this.arena.x, this.arena.y);
        graphics.beginFill(this.TEMP_ARENA_COLOR, 1);
        graphics.drawCircle(0, 0, this.arena.diameter);
        // --
    }
    initPhysics() {
        let playerCollisionGroups = [];
        this.game.physics.startSystem(Phaser.Physics.P2JS);
        this.game.physics.p2.setImpactEvents(true);
        this.players.forEach(player => {
            this.game.physics.p2.enable(player, false);
            let playerCollisionGroup = this.game.physics.p2.createCollisionGroup();
            player.body.setCircle(this.PLAYER_COLLISION_SIZE);
            player.body.setCollisionGroup(playerCollisionGroup);
            playerCollisionGroups.push(playerCollisionGroup);
        }, this);

        this.players.forEach(p => p.body.collides(playerCollisionGroups, this.playersCollideCallback), this);
    }
    addPlayer(name: string) {
        let player = new Player(this.game, this.arena.x, this.arena.y, this.PLAYER_SPRITESHEET);
        player.name = name;
        player.scale.set(2);
        player.anchor.x = player.anchor.y = 0.5;
        player.smoothed = false;
        player.animations.add(this.DEFAULT_ANIMATION_PLAYER, [0, 1, 2, 3, 4, 5], 10, true);
        player.play(this.DEFAULT_ANIMATION_PLAYER);
        this.players.add(player);
    }
    placePlayersAtStartingPos() {
        let positions: number = this.players.length;
        let degreesOffset: number = 360 / positions;
        let angle: number;
        let player: Player;
        for (let i = 0; i < positions; ++i) {
            angle = i * degreesOffset;
            player = this.players.getChildAt(i) as Player;
            player.body.x = player.startingPosition.x = this.arena.x + (this.arena.radius - this.START_POS_EDGE_OFFSET) * Math.cos(angle * (Math.PI / 180));
            player.body.y = player.startingPosition.y = this.arena.y + (this.arena.radius - this.START_POS_EDGE_OFFSET) * Math.sin(angle * (Math.PI / 180));
            player.body.setZeroVelocity();
        }
    };
    update() {
        this.players.forEachAlive(player => {
            if (!this.arena.contains(player.centerX, player.centerY)) {
                this.playerDied(player);
            }
        });
        let player = <Player>this.players.getChildAt(0);
        if (this.cursors.left.isDown) {
            player.body.velocity.x -= 5;
        }
        else if (this.cursors.right.isDown) {
            player.body.velocity.x += 5;
        }

        if (this.cursors.up.isDown) {
            player.body.velocity.y -= 5;
        }
        else if (this.cursors.down.isDown) {
            player.body.velocity.y += 5;
        }
    }
    playerDied(player: Player) {
        player.kill();
        if (this.players.countLiving() === 1) {
            this.playerWon(this.players.getFirstAlive());
        }
    }
    playerWon(player: Player) {
        this.placePlayersAtStartingPos();
        this.players.callAll("revive", null);
    }
    playersCollideCallback(playerBody1: Phaser.Physics.P2.Body, playerBody2: Phaser.Physics.P2.Body) {
        (<Player>playerBody1.sprite).lastTouchedBy = <Player>playerBody2.sprite;
    }
}
