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

        const r = canvas.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const portrait = vh >= vw;
        const safeTop = window.visualViewport ? Math.max(0, window.visualViewport.offsetTop) : 0;

        if (portrait) {
            // Move the game almost under the safe area and keep controls higher.
            const gameTop = Math.round(safeTop + 10);
            canvas.style.top = gameTop + "px";
            canvas.style.bottom = "auto";

            const dpadSize = Math.min(184, Math.max(158, vw * 0.235));
            const controlsTop = Math.max(r.bottom + 26, Math.round(vh * 0.705));

            root.style.setProperty("--mc-portrait-y", controlsTop + "px");
            root.style.setProperty("--mc-portrait-start-y", Math.max(gameTop + 8, controlsTop - 64) + "px");
            root.style.setProperty("--mc-portrait-button", Math.round(Math.min(74, Math.max(58, vw * 0.18))) + "px");
            root.style.setProperty("--mc-portrait-dpad", Math.round(dpadSize) + "px");
        } else {
            // Restore canvas centering in landscape.
            canvas.style.top = "0px";
            canvas.style.bottom = "0px";

            // Keep controls inside the black side rails only.
            const dpadSize = Math.min(170, Math.max(144, vh * 0.21));
            const button = Math.min(70, Math.max(56, vh * 0.16));
            const actionsWidth = Math.round(button * 1.95);

            const leftRail = Math.max(0, r.left);
            const rightRail = Math.max(0, vw - r.right);

            const leftX = Math.max(10, Math.round((leftRail - dpadSize) / 2));
            const rightX = Math.round(r.right + Math.max(10, (rightRail - actionsWidth) / 2));
            const rightRailStartX = Math.round(r.right + Math.max(10, (rightRail - 126) / 2));

            root.style.setProperty("--mc-left-x", leftX + "px");
            root.style.setProperty("--mc-right-x", rightX + "px");
            root.style.setProperty("--mc-start-x", rightRailStartX + "px");
            root.style.setProperty("--mc-landscape-button", Math.round(button) + "px");
            root.style.setProperty("--mc-landscape-dpad", Math.round(dpadSize) + "px");
        }
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
