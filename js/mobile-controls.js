/* Duch Gor - Game Boy style touch controls for mobile browsers. */
(function() {
    "use strict";

    const isTouchDevice = ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);
    if (!isTouchDevice) return;

    // Our START button replaces RPG Maker MZ's built-in touch menu button.
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
        window.addEventListener("resize", scheduleLayout, {passive:true});
        window.addEventListener("orientationchange", scheduleLayout, {passive:true});
        if (window.visualViewport) window.visualViewport.addEventListener("resize", scheduleLayout, {passive:true});
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

        if (portrait) {
            // Put the controller shortly below the game instead of near the home indicator.
            const dpadSize = Math.min(246, Math.max(210, vw * 0.31));
            const safeBottom = 28;
            const preferred = r.bottom + Math.max(42, vh * 0.045);
            const latest = vh - dpadSize - safeBottom;
            const y = Math.max(r.bottom + 24, Math.min(preferred, latest));
            root.style.setProperty("--mc-portrait-y", Math.round(y) + "px");
        } else {
            // Compute positions from the actual canvas edges. This guarantees that the
            // controller occupies the black side rails and never covers the game.
            const dpadSize = Math.min(226, Math.max(190, vh * 0.28));
            const actionWidth = Math.min(92, Math.max(72, vh * 0.082)) * 2.15;
            const gap = 16;

            const leftRail = Math.max(0, r.left);
            const rightRail = Math.max(0, vw - r.right);

            const leftX = Math.max(10, (leftRail - dpadSize) / 2);
            const rightX = r.right + Math.max(gap, (rightRail - actionWidth) / 2);
            const startWidth = 126;
            const startX = r.right + Math.max(gap, (rightRail - startWidth) / 2);

            root.style.setProperty("--mc-left-x", Math.round(leftX) + "px");
            root.style.setProperty("--mc-right-x", Math.round(rightX) + "px");
            root.style.setProperty("--mc-start-x", Math.round(startX) + "px");
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
            e.preventDefault(); e.stopPropagation();
            if (pointerId !== null) return;
            pointerId = e.pointerId;
            try { button.setPointerCapture(pointerId); } catch (_) {}
            setPressed(button, key, true);
        }, {passive:false});
        button.addEventListener("pointerup", function(e) { e.preventDefault(); e.stopPropagation(); release(e); }, {passive:false});
        button.addEventListener("pointercancel", release, {passive:false});
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
            e.preventDefault(); e.stopPropagation();
            button.classList.add("is-pressed");
            if (typeof Input !== "undefined" && Input.virtualClick) Input.virtualClick("menu");
        }, {passive:false});
        function release(e) {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            button.classList.remove("is-pressed");
        }
        button.addEventListener("pointerup", release, {passive:false});
        button.addEventListener("pointercancel", release, {passive:false});
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", createControls, {once:true});
    } else {
        createControls();
    }
})();
