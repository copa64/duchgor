/* Game Boy-style touch controls for mobile browsers only. */
(function() {
    "use strict";

    const isTouchDevice = ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);
    if (!isTouchDevice) return;

    // Hide RPG Maker MZ's small built-in touch/menu button. Our HTML controls replace it.
    // Force touchUI off after the saved configuration is applied as well.
    if (typeof ConfigManager !== "undefined") {
        const originalApplyData = ConfigManager.applyData;
        ConfigManager.applyData = function(config) {
            originalApplyData.apply(this, arguments);
            this.touchUI = false;
        };
    }

    function createControls() {
        if (document.getElementById("mobileControls")) return;

        const root = document.createElement("div");
        root.id = "mobileControls";
        root.setAttribute("aria-label", "Mobile game controls");

        const dpad = document.createElement("div");
        dpad.id = "mcDpad";
        dpad.className = "mc-group";
        dpad.innerHTML = '' +
            '<button id="mcUp" aria-label="Up">▲</button>' +
            '<button id="mcLeft" aria-label="Left">◀</button>' +
            '<div id="mcDpadCenter" aria-hidden="true"></div>' +
            '<button id="mcRight" aria-label="Right">▶</button>' +
            '<button id="mcDown" aria-label="Down">▼</button>';

        const actions = document.createElement("div");
        actions.id = "mcActions";
        actions.className = "mc-group";
        actions.innerHTML = '' +
            '<button id="mcB" aria-label="B">B</button>' +
            '<button id="mcA" aria-label="A">A</button>';

        const start = document.createElement("button");
        start.id = "mcStart";
        start.textContent = "START";
        start.setAttribute("aria-label", "Open menu");

        root.appendChild(dpad);
        root.appendChild(actions);
        root.appendChild(start);
        document.body.appendChild(root);

        bindHeldButton("mcUp", "up");
        bindHeldButton("mcDown", "down");
        bindHeldButton("mcLeft", "left");
        bindHeldButton("mcRight", "right");
        bindHeldButton("mcA", "ok");
        bindHeldButton("mcB", "cancel");
        bindMenuButton("mcStart");

        // Prevent browser gestures/scrolling while touching the controller.
        root.addEventListener("contextmenu", function(e) { e.preventDefault(); });
    }

    function setPressed(button, key, pressed) {
        if (typeof Input === "undefined" || !Input._currentState) return;
        Input._currentState[key] = pressed;
        button.classList.toggle("is-pressed", pressed);
    }

    function bindHeldButton(id, key) {
        const button = document.getElementById(id);
        let activePointerId = null;

        const release = function(e) {
            if (activePointerId === null || (e && e.pointerId !== activePointerId)) return;
            setPressed(button, key, false);
            try { button.releasePointerCapture(activePointerId); } catch (_) {}
            activePointerId = null;
        };

        button.addEventListener("pointerdown", function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (activePointerId !== null) return;
            activePointerId = e.pointerId;
            try { button.setPointerCapture(activePointerId); } catch (_) {}
            setPressed(button, key, true);
        }, {passive:false});

        button.addEventListener("pointerup", function(e) { e.preventDefault(); e.stopPropagation(); release(e); }, {passive:false});
        button.addEventListener("pointercancel", release, {passive:false});
        button.addEventListener("lostpointercapture", function() {
            if (activePointerId !== null) {
                setPressed(button, key, false);
                activePointerId = null;
            }
        });
    }

    function bindMenuButton(id) {
        const button = document.getElementById(id);
        button.addEventListener("pointerdown", function(e) {
            e.preventDefault();
            e.stopPropagation();
            button.classList.add("is-pressed");
            if (typeof Input !== "undefined" && Input.virtualClick) {
                Input.virtualClick("menu");
            }
        }, {passive:false});
        const release = function(e) {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            button.classList.remove("is-pressed");
        };
        button.addEventListener("pointerup", release, {passive:false});
        button.addEventListener("pointercancel", release, {passive:false});
    }

    // Build after the game scripts and DOM are ready.
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", createControls, {once:true});
    } else {
        createControls();
    }
})();
