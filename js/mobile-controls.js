/* Duch Gor - retro handheld touch controls for mobile browsers. */
(function() {
    "use strict";

    const isTouchDevice = ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);
    if (!isTouchDevice) return;

    // Replace RPG Maker MZ's built-in touch menu button with our own START button.
    if (typeof ConfigManager !== "undefined") {
        const originalApplyData = ConfigManager.applyData;
        ConfigManager.applyData = function(config) {
            originalApplyData.apply(this, arguments);
            this.touchUI = false;
        };
        ConfigManager.touchUI = false;
    }

    function createControls() {
        if (document.getElementById("mobileControls")) return;

        const root = document.createElement("div");
        root.id = "mobileControls";
        root.setAttribute("aria-label", "Mobile game controls");

        const dpad = document.createElement("div");
        dpad.id = "mcDpad";
        dpad.innerHTML =
            '<button id="mcUp" aria-label="Up"></button>' +
            '<button id="mcLeft" aria-label="Left"></button>' +
            '<div id="mcDpadCenter" aria-hidden="true"></div>' +
            '<button id="mcRight" aria-label="Right"></button>' +
            '<button id="mcDown" aria-label="Down"></button>';

        const actions = document.createElement("div");
        actions.id = "mcActions";
        actions.innerHTML =
            '<button id="mcB" aria-label="B">B</button>' +
            '<button id="mcA" aria-label="A">A</button>';

        const start = document.createElement("button");
        start.id = "mcStart";
        start.textContent = "START";
        start.setAttribute("aria-label", "Open menu");

        root.append(dpad, actions, start);
        document.body.appendChild(root);

        bindHeldButton("mcUp", "up");
        bindHeldButton("mcDown", "down");
        bindHeldButton("mcLeft", "left");
        bindHeldButton("mcRight", "right");
        bindHeldButton("mcA", "ok");
        bindHeldButton("mcB", "cancel");
        bindMenuButton("mcStart");

        root.addEventListener("contextmenu", e => e.preventDefault());
        updateLayout();
        window.addEventListener("resize", scheduleLayout, { passive: true });
        window.addEventListener("orientationchange", scheduleLayout, { passive: true });
        if (window.visualViewport) {
            window.visualViewport.addEventListener("resize", scheduleLayout, { passive: true });
        }
        setTimeout(updateLayout, 250);
        setTimeout(updateLayout, 900);
    }

    let layoutTimer = 0;
    function scheduleLayout() {
        clearTimeout(layoutTimer);
        layoutTimer = setTimeout(updateLayout, 80);
    }

    function updateLayout() {
        const root = document.getElementById("mobileControls");
        const canvas = document.getElementById("gameCanvas") || document.querySelector("canvas");
        if (!root || !canvas) return;

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const portrait = vh >= vw;
        const safeTop = window.visualViewport ? Math.max(0, window.visualViewport.offsetTop) : 0;

        if (portrait) {
            /*
             * RPG Maker normally centres the canvas vertically. On a phone this puts
             * the controls on top of it, so portrait gets its own balanced layout:
             * game slightly below the status bar, START below the game and controls
             * immediately underneath. No giant empty strip in the middle.
             */
            const before = canvas.getBoundingClientRect();
            const gameTop = Math.round(Math.max(safeTop + 58, vh * 0.075));
            canvas.style.top = gameTop + "px";
            canvas.style.bottom = "auto";

            const gameBottom = gameTop + before.height;
            const dpadSize = Math.min(184, Math.max(166, vw * 0.24));
            const button = Math.min(74, Math.max(58, vw * 0.18));

            const startTop = Math.round(Math.min(vh - dpadSize - 102, gameBottom + 42)) + 20;
            const controlsTop = Math.round(Math.min(vh - dpadSize - 28, startTop + 72));

            root.style.setProperty("--mc-portrait-start-y", startTop + "px");
            root.style.setProperty("--mc-portrait-y", controlsTop + "px");
            root.style.setProperty("--mc-portrait-button", Math.round(button) + "px");
            root.style.setProperty("--mc-portrait-dpad", Math.round(dpadSize) + "px");
        } else {
            // Return RPG Maker canvas to its normal vertical centring in landscape.
            canvas.style.top = "0px";
            canvas.style.bottom = "0px";

            // Let the browser/RPG Maker apply the restored position before measuring.
            requestAnimationFrame(() => updateLandscapeRails(root, canvas));
        }
    }

    function updateLandscapeRails(root, canvas) {
        if (window.innerHeight >= window.innerWidth) return;

        const r = canvas.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const dpadSize = Math.min(176, Math.max(150, vh * 0.23));
        const button = Math.min(70, Math.max(56, vh * 0.16));
        const actionsWidth = button * 1.95;

        const leftRail = Math.max(0, r.left);
        const rightRail = Math.max(0, vw - r.right);
        // Anchor the controls to the GAME canvas itself, not to the phone rails.
        // This guarantees that both groups move inward toward the game.
        const gameGap = 20;
        const leftX = Math.max(10, r.left - dpadSize - gameGap);
        const rightX = Math.min(vw - actionsWidth - 10, r.right + gameGap);
        const startWidth = 128;
        const startX = r.right + Math.max(10, (rightRail - startWidth) / 2);

        root.style.setProperty("--mc-left-x", Math.round(leftX) + "px");
        root.style.setProperty("--mc-right-x", Math.round(rightX) + "px");
        root.style.setProperty("--mc-start-x", Math.round(startX) + "px");
        root.style.setProperty("--mc-landscape-button", Math.round(button) + "px");
        root.style.setProperty("--mc-landscape-dpad", Math.round(dpadSize) + "px");
    }

    function setPressed(button, key, pressed) {
        if (typeof Input === "undefined" || !Input._currentState) return;
        Input._currentState[key] = pressed;
        button.classList.toggle("is-pressed", pressed);
    }

    function bindHeldButton(id, key) {
        const button = document.getElementById(id);
        let pointerId = null;

        function release(e) {
            if (pointerId === null || (e && e.pointerId !== pointerId)) return;
            setPressed(button, key, false);
            try { button.releasePointerCapture(pointerId); } catch (_) {}
            pointerId = null;
        }

        button.addEventListener("pointerdown", function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (pointerId !== null) return;
            pointerId = e.pointerId;
            try { button.setPointerCapture(pointerId); } catch (_) {}
            setPressed(button, key, true);
        }, { passive: false });
        button.addEventListener("pointerup", function(e) {
            e.preventDefault();
            e.stopPropagation();
            release(e);
        }, { passive: false });
        button.addEventListener("pointercancel", release, { passive: false });
        button.addEventListener("lostpointercapture", function() {
            if (pointerId !== null) {
                setPressed(button, key, false);
                pointerId = null;
            }
        });
    }

    function bindMenuButton(id) {
        const button = document.getElementById(id);
        button.addEventListener("pointerdown", function(e) {
            e.preventDefault();
            e.stopPropagation();
            button.classList.add("is-pressed");
            if (typeof Input !== "undefined" && Input.virtualClick) Input.virtualClick("menu");
        }, { passive: false });

        function release(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            button.classList.remove("is-pressed");
        }

        button.addEventListener("pointerup", release, { passive: false });
        button.addEventListener("pointercancel", release, { passive: false });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", createControls, { once: true });
    } else {
        createControls();
    }
})();
