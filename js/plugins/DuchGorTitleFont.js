(() => {
    FontManager.load("TitleFont", "BlackOpsOne-Regular.ttf");

    Scene_Title.prototype.drawGameTitle = function() {
        const x = 20;
        const y = Graphics.height / 4;
        const maxWidth = Graphics.width - x * 2;

        const bitmap = this._gameTitleSprite.bitmap;

        bitmap.fontFace = "TitleFont";
        bitmap.fontSize = 96;
        bitmap.textColor = "#ffffff";
        bitmap.outlineColor = "rgba(0,0,0,0.9)";
        bitmap.outlineWidth = 6;

        bitmap.drawText(
            "Duch Gór",
            x,
            y,
            maxWidth,
            96,
            "center"
        );
    };
})();