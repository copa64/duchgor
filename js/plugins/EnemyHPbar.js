/*:
 * @target MZ
 * @plugindesc v1.1 Pasek HP nad wrogami: kolory, płynna animacja i wartości HP.
 * @author Duch Gór
 *
 * @param BarWidth
 * @text Szerokość paska
 * @type number
 * @min 40
 * @default 120
 *
 * @param BarHeight
 * @text Wysokość paska
 * @type number
 * @min 4
 * @default 10
 *
 * @param OffsetY
 * @text Odstęp nad przeciwnikiem
 * @type number
 * @min -100
 * @max 200
 * @default 14
 *
 * @param SmoothSpeed
 * @text Szybkość animacji
 * @desc 1-100. Wyższa wartość = szybsze zmniejszanie/zwiększanie paska.
 * @type number
 * @min 1
 * @max 100
 * @default 12
 *
 * @help
 * EnemyHPBar.js
 *
 * Wyświetla nad każdym przeciwnikiem:
 * - zielony pasek przy HP > 50%
 * - żółty pasek przy HP > 25% i <= 50%
 * - czerwony pasek przy HP <= 25%
 * - aktualne HP w formacie: 430 / 600
 * - płynną animację zmiany długości paska
 *
 * Plik powinien nazywać się: EnemyHPBar.js
 */

(() => {
    "use strict";

    const pluginName = "EnemyHPBar";
    const parameters = PluginManager.parameters(pluginName);

    const readNumber = (name, fallback) => {
        const raw = parameters[name];
        const value =
            raw !== undefined && raw !== ""
                ? Number(raw)
                : fallback;

        return Number.isFinite(value) ? value : fallback;
    };

    const BAR_WIDTH = Math.max(
        40,
        readNumber("BarWidth", 120)
    );

    const BAR_HEIGHT = Math.max(
        4,
        readNumber("BarHeight", 10)
    );

    const OFFSET_Y =
        readNumber("OffsetY", 14);

    const SMOOTH_SPEED = Math.min(
        1,
        Math.max(
            0.01,
            readNumber("SmoothSpeed", 12) / 100
        )
    );

    const TEXT_HEIGHT = 24;
    const GAP = 4;

    const HUD_HEIGHT =
        TEXT_HEIGHT +
        GAP +
        BAR_HEIGHT +
        2;

    const COLOR_GREEN = "#39d353";
    const COLOR_YELLOW = "#f2c94c";
    const COLOR_RED = "#e74c3c";

    const COLOR_BAR_BACKGROUND = "#202020";
    const COLOR_BORDER = "#ffffff";

    const COLOR_TEXT = "#ffffff";
    const COLOR_TEXT_OUTLINE =
        "rgba(0, 0, 0, 0.9)";


    // ============================================================
    // INIT
    // ============================================================

    const _Sprite_Enemy_initMembers =
        Sprite_Enemy.prototype.initMembers;

    Sprite_Enemy.prototype.initMembers = function() {

        _Sprite_Enemy_initMembers.call(this);

        this.createEnemyHpBar();
    };


    // ============================================================
    // SET BATTLER
    // ============================================================

    const _Sprite_Enemy_setBattler =
        Sprite_Enemy.prototype.setBattler;

    Sprite_Enemy.prototype.setBattler = function(battler) {

        _Sprite_Enemy_setBattler.call(
            this,
            battler
        );

        if (battler) {

            this._enemyHpBarDisplayedRate =
                this.enemyHpRate();

            this._enemyHpBarLastHp = null;
            this._enemyHpBarLastMhp = null;
            this._enemyHpBarLastRate = null;

            this.refreshEnemyHpBar(true);
        }
    };


    // ============================================================
    // UPDATE
    // ============================================================

    const _Sprite_Enemy_update =
        Sprite_Enemy.prototype.update;

    Sprite_Enemy.prototype.update = function() {

        _Sprite_Enemy_update.call(this);

        this.updateEnemyHpBar();
    };


    // ============================================================
    // CREATE HP BAR
    // ============================================================

    Sprite_Enemy.prototype.createEnemyHpBar = function() {

        const bitmap =
            new Bitmap(
                BAR_WIDTH,
                HUD_HEIGHT
            );

        bitmap.fontSize = 14;

        bitmap.textColor =
            COLOR_TEXT;

        bitmap.outlineColor =
            COLOR_TEXT_OUTLINE;

        bitmap.outlineWidth = 4;


        this._enemyHpBarSprite =
            new Sprite(bitmap);

        this._enemyHpBarSprite.anchor.x =
            0.5;

        this._enemyHpBarSprite.anchor.y =
            1;

        this._enemyHpBarSprite.x =
            0;

        this._enemyHpBarSprite.visible =
            false;


        this._enemyHpBarDisplayedRate =
            1;

        this._enemyHpBarLastHp =
            null;

        this._enemyHpBarLastMhp =
            null;

        this._enemyHpBarLastRate =
            null;


        this.addChild(
            this._enemyHpBarSprite
        );
    };


    // ============================================================
    // HP RATE
    // ============================================================

    Sprite_Enemy.prototype.enemyHpRate = function() {

        if (!this._enemy) {
            return 0;
        }

        const mhp =
            Math.max(
                1,
                Number(
                    this._enemy.mhp || 1
                )
            );

        const hp =
            Math.max(
                0,
                Number(
                    this._enemy.hp || 0
                )
            );

        return Math.min(
            1,
            hp / mhp
        );
    };


    // ============================================================
    // COLOR
    // ============================================================

    Sprite_Enemy.prototype.enemyHpBarColor =
        function(rate) {

            if (rate > 0.5) {

                return COLOR_GREEN;

            } else if (rate > 0.25) {

                return COLOR_YELLOW;

            } else {

                return COLOR_RED;
            }
        };


    // ============================================================
    // UPDATE HP BAR
    // ============================================================

    Sprite_Enemy.prototype.updateEnemyHpBar =
        function() {

            if (
                !this._enemyHpBarSprite ||
                !this._enemy
            ) {
                return;
            }


            const appeared =
                typeof this._enemy.isAppeared ===
                    "function"
                    ? this._enemy.isAppeared()
                    : true;


            this._enemyHpBarSprite.visible =
                appeared;


            // Automatycznie nad grafiką przeciwnika
            this._enemyHpBarSprite.y =
                -this.height -
                OFFSET_Y;


            if (!appeared) {
                return;
            }


            const targetRate =
                this.enemyHpRate();


            const difference =
                targetRate -
                this._enemyHpBarDisplayedRate;


            // Płynne przesuwanie długości paska
            if (
                Math.abs(difference) <
                0.001
            ) {

                this._enemyHpBarDisplayedRate =
                    targetRate;

            } else {

                this._enemyHpBarDisplayedRate +=
                    difference *
                    SMOOTH_SPEED;
            }


            // zabezpieczenie 0-100%
            this._enemyHpBarDisplayedRate =
                Math.max(
                    0,
                    Math.min(
                        1,
                        this._enemyHpBarDisplayedRate
                    )
                );


            this.refreshEnemyHpBar(false);
        };


    // ============================================================
    // DRAW HP BAR
    // ============================================================

    Sprite_Enemy.prototype.refreshEnemyHpBar =
        function(force) {

            if (
                !this._enemyHpBarSprite ||
                !this._enemy
            ) {
                return;
            }


            const hp =
                Math.max(
                    0,
                    Math.round(
                        Number(
                            this._enemy.hp || 0
                        )
                    )
                );


            const mhp =
                Math.max(
                    1,
                    Math.round(
                        Number(
                            this._enemy.mhp || 1
                        )
                    )
                );


            const displayedRate =
                this._enemyHpBarDisplayedRate;


            const hpChanged =
                hp !==
                this._enemyHpBarLastHp;


            const mhpChanged =
                mhp !==
                this._enemyHpBarLastMhp;


            const rateChanged =
                this._enemyHpBarLastRate ===
                    null ||
                Math.abs(
                    displayedRate -
                    this._enemyHpBarLastRate
                ) >= 0.0005;


            // Nie rysujemy ponownie, jeśli nic się nie zmieniło
            if (
                !force &&
                !hpChanged &&
                !mhpChanged &&
                !rateChanged
            ) {
                return;
            }


            this._enemyHpBarLastHp =
                hp;

            this._enemyHpBarLastMhp =
                mhp;

            this._enemyHpBarLastRate =
                displayedRate;


            const bitmap =
                this._enemyHpBarSprite.bitmap;


            const barY =
                TEXT_HEIGHT +
                GAP;


            const innerX = 2;
            const innerY =
                barY + 2;


            const innerWidth =
                Math.max(
                    0,
                    BAR_WIDTH - 4
                );


            const innerHeight =
                Math.max(
                    1,
                    BAR_HEIGHT - 4
                );


            const fillWidth =
                Math.round(
                    innerWidth *
                    displayedRate
                );


            // Kolor odpowiada prawdziwemu,
            // aktualnemu HP
            const actualRate =
                Math.min(
                    1,
                    hp / mhp
                );


            const fillColor =
                this.enemyHpBarColor(
                    actualRate
                );


            bitmap.clear();


            // ====================================================
            // HP TEXT
            // ====================================================

            bitmap.fontSize = 18;

            bitmap.textColor =
                COLOR_TEXT;

            bitmap.outlineColor =
                COLOR_TEXT_OUTLINE;

            bitmap.outlineWidth =
                4;


            bitmap.drawText(

                `${hp} / ${mhp}`,

                0,

                0,

                BAR_WIDTH,

                TEXT_HEIGHT,

                "center"
            );


            // ====================================================
            // BAR BORDER
            // ====================================================

            bitmap.fillRect(

                0,

                barY,

                BAR_WIDTH,

                BAR_HEIGHT,

                COLOR_BORDER
            );


            // ====================================================
            // BAR BACKGROUND
            // ====================================================

            bitmap.fillRect(

                1,

                barY + 1,

                BAR_WIDTH - 2,

                BAR_HEIGHT - 2,

                COLOR_BAR_BACKGROUND
            );


            // ====================================================
            // HP FILL
            // ====================================================

            if (fillWidth > 0) {

                bitmap.fillRect(

                    innerX,

                    innerY,

                    fillWidth,

                    innerHeight,

                    fillColor
                );
            }
        };

})();