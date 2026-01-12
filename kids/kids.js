
/* Builder Quest - Phase 1
   - One dashboard
   - Shared builder modal
   - Game Mode + App Mode
   - Save projects to localStorage
   - Track skills + time building (local)
*/

(function () {
  // -------------------------
  // Session / identity (stub)
  // Replace with your real session/user from kiranregmi.com
  // -------------------------
  const session = {
    kidName: "Pranav",
    kidId: "kid_local_1",
  };

  // -------------------------
  // Simple storage layer
  // Replace these with API calls later (POST/GET to your backend)
  // -------------------------
  const storageKey = (kidId) => `bq_v1_${kidId}`;
  const loadState = () => {
    try {
      const raw = localStorage.getItem(storageKey(session.kidId));
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return { ...defaultState(), ...parsed };
    } catch {
      return defaultState();
    }
  };
  const saveState = (state) => {
    localStorage.setItem(storageKey(session.kidId), JSON.stringify(state));
  };

  function defaultState() {
    return {
      level: 1,
      minutesBuilding: 0,
      skills: {}, // { skillId: { name, firstSeenAt } }
      projects: [], // [{id, type, name, script, createdAt, updatedAt, skillsUsed}]
      missionIndex: 0,
    };
  }

  // -------------------------
  // Missions (rotating)
  // -------------------------
  const missions = [
    "Make something move.",
    "Build an app with 2 buttons.",
    "Add a sound or color change.",
    "Make a score or counter.",
    "Change your project and save again.",
  ];

  // -------------------------
  // Skill definitions
  // -------------------------
  const skillDefs = {
    events: { name: "Events" },
    movement: { name: "Movement" },
    variables: { name: "Variables" },
    conditionals: { name: "Conditional Logic" },
    loops: { name: "Loops" },
    ui: { name: "UI Layout" },
    appFlow: { name: "App Flow" },
    creativity: { name: "Creativity" },
    persistence: { name: "Persistence" },
  };

  // -------------------------
  // Blocks (shared builder)
  // Keep small for Phase 1.
  // -------------------------
  const BLOCKS = {
    game: {
      events: [
        { id: "whenPlay", title: "When Play pressed", desc: "Start your game!", addsSkills: ["events"] },
      ],
      actions: [
        { id: "moveRight", title: "Move right", desc: "Character moves right", addsSkills: ["movement"] },
        { id: "moveLeft", title: "Move left", desc: "Character moves left", addsSkills: ["movement"] },
        { id: "jump", title: "Jump", desc: "Character jumps up", addsSkills: ["movement"] },
        { id: "scorePlus", title: "Score +1", desc: "Increase score", addsSkills: ["variables"] },
        { id: "colorChange", title: "Change color", desc: "Make it look different", addsSkills: ["creativity"] },
        { id: "playSound", title: "Play sound", desc: "Add sound feedback", addsSkills: ["creativity"] },
      ],
      logic: [
        { id: "repeat3", title: "Repeat 3 times", desc: "Do actions 3 times", addsSkills: ["loops"] },
        { id: "ifTouchWall", title: "If hits wall", desc: "Do something on wall hit", addsSkills: ["conditionals"] },
      ],
    },
    app: {
      events: [
        { id: "whenOpen", title: "When app opens", desc: "Start your app", addsSkills: ["events", "ui"] },
      ],
      actions: [
        { id: "addButton", title: "Add a button", desc: "Create a button", addsSkills: ["ui"] },
        { id: "addText", title: "Add text", desc: "Show text on screen", addsSkills: ["ui"] },
        { id: "counterPlus", title: "Counter +1", desc: "Increase a counter", addsSkills: ["variables"] },
        { id: "newScreen", title: "New screen", desc: "Add another screen", addsSkills: ["appFlow"] },
        { id: "goToScreen2", title: "Go to Screen 2", desc: "Switch screens", addsSkills: ["appFlow"] },
        { id: "playSound", title: "Play sound", desc: "Feedback sound", addsSkills: ["creativity"] },
      ],
      logic: [
        { id: "ifCounter5", title: "If counter = 5", desc: "Do something at 5", addsSkills: ["conditionals", "variables"] },
        { id: "repeat2", title: "Repeat 2 times", desc: "Do actions 2 times", addsSkills: ["loops"] },
      ],
    },
  };

  // -------------------------
  // DOM helpers
  // -------------------------
  const $ = (id) => document.getElementById(id);

  // Dashboard elements
  const kidNameChip = $("kidNameChip");
  const levelEl = $("level");
  const missionText = $("missionText");
  const creationsEl = $("creations");
  const emptyStateEl = $("emptyState");

  // Tiles
  const tileBuildGame = $("tileBuildGame");
  const tileBuildApp = $("tileBuildApp");
  const tileAskBot = $("tileAskBot");
  const tileBrainBoost = $("tileBrainBoost");

  // Builder modal
  const builderBackdrop = $("builderBackdrop");
  const builderTitle = $("builderTitle");
  const builderSub = $("builderSub");
  const closeBuilderBtn = $("closeBuilderBtn");
  const projectNameInput = $("projectName");

  const blockListEvents = $("blockListEvents");
  const blockListActions = $("blockListActions");
  const blockListLogic = $("blockListLogic");

  const scriptArea = $("scriptArea");
  const undoBlockBtn = $("undoBlockBtn");
  const clearScriptBtn = $("clearScriptBtn");

  const gameCanvas = $("gameCanvas");
  const appPreview = $("appPreview");
  const playBtn = $("playBtn");
  const stopBtn = $("stopBtn");
  const saveBtn = $("saveBtn");
  const runLog = $("runLog");

  // Creations
  const newProjectBtn = $("newProjectBtn");
  const clearAllBtn = $("clearAllBtn");

  // Helper bot modal
  const botBackdrop = $("botBackdrop");
  const closeBotBtn = $("closeBotBtn");
  const chat = $("chat");
  const chatInput = $("chatInput");
  const sendChatBtn = $("sendChatBtn");

  // Brain boost
  const brainBackdrop = $("brainBackdrop");
  const closeBrainBtn = $("closeBrainBtn");
  const boostQ = $("boostQ");
  const boostA = $("boostA");
  const checkBoostBtn = $("checkBoostBtn");
  const boostResult = $("boostResult");

  // Parent view
  const openParentViewBtn = $("openParentViewBtn");
  const parentBackdrop = $("parentBackdrop");
  const closeParentBtn = $("closeParentBtn");
  const pvProjects = $("pvProjects");
  const pvTime = $("pvTime");
  const pvSkills = $("pvSkills");
  const parentSkills = $("parentSkills");

  // -------------------------
  // State
  // -------------------------
  let state = loadState();

  let builderMode = "game"; // "game" | "app"
  let currentProjectId = null;
  let currentScript = []; // [{blockId, title, addsSkills}]
  let buildingTimer = null;
  let buildingStartMs = 0;

  // runtime
  let raf = null;

  // -------------------------
  // Init
  // -------------------------
  function init() {
    kidNameChip.textContent = `👋 Hi, ${session.kidName}`;
    updateMission();
    renderDashboard();

    tileBuildGame.addEventListener("click", () => openBuilder("game"));
    tileBuildApp.addEventListener("click", () => openBuilder("app"));
    tileAskBot.addEventListener("click", openBot);
    tileBrainBoost.addEventListener("click", openBrainBoost);

    newProjectBtn.addEventListener("click", () => openBuilder("game"));
    clearAllBtn.addEventListener("click", clearAllProjects);

    closeBuilderBtn.addEventListener("click", closeBuilder);
    builderBackdrop.addEventListener("click", (e) => {
      if (e.target === builderBackdrop) closeBuilder();
    });

    undoBlockBtn.addEventListener("click", undoLastBlock);
    clearScriptBtn.addEventListener("click", () => setScript([]));

    playBtn.addEventListener("click", runScript);
    stopBtn.addEventListener("click", stopRun);
    saveBtn.addEventListener("click", saveProject);

    closeBotBtn.addEventListener("click", closeBot);
    botBackdrop.addEventListener("click", (e) => { if (e.target === botBackdrop) closeBot(); });
    sendChatBtn.addEventListener("click", sendChat);
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendChat();
    });

    closeBrainBtn.addEventListener("click", closeBrainBoost);
    brainBackdrop.addEventListener("click", (e) => { if (e.target === brainBackdrop) closeBrainBoost(); });
    checkBoostBtn.addEventListener("click", checkBoost);

    openParentViewBtn.addEventListener("click", openParent);
    closeParentBtn.addEventListener("click", closeParent);
    parentBackdrop.addEventListener("click", (e) => { if (e.target === parentBackdrop) closeParent(); });
  }

  const logoutKidBtn = document.getElementById("logoutKidBtn");
if (logoutKidBtn) {
  logoutKidBtn.addEventListener("click", () => {
    ["token", "role", "email"].forEach(k => localStorage.removeItem(k));
    window.location.href = "/kids/login.html";
  });
}


  // -------------------------
  // Missions / level
  // -------------------------
  function updateMission() {
    missionText.textContent = missions[state.missionIndex % missions.length];
    levelEl.textContent = state.level;
  }

  function levelUpIfNeeded() {
    // Simple honest leveling:
    // Level increases with skills unlocked + projects saved.
    const skillsCount = Object.keys(state.skills).length;
    const projectsCount = state.projects.length;
    const targetLevel = 1 + Math.floor((skillsCount + projectsCount) / 3);

    if (targetLevel > state.level) {
      state.level = targetLevel;
      saveState(state);
      updateMission();
    }
  }

  // -------------------------
  // Dashboard rendering
  // -------------------------
  function renderDashboard() {
    updateMission();

    const projects = [...state.projects].sort((a,b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
    creationsEl.innerHTML = "";

    if (projects.length === 0) {
      emptyStateEl.classList.remove("hidden");
    } else {
      emptyStateEl.classList.add("hidden");
      for (const p of projects) {
        creationsEl.appendChild(projectCard(p));
      }
    }
  }

  function projectCard(p) {
    const div = document.createElement("div");
    div.className = "card";

    const typeTag = p.type === "game" ? "🎮 Game" : "📱 App";
    const updated = new Date(p.updatedAt || p.createdAt).toLocaleString();

    div.innerHTML = `
      <div class="cardTop">
        <div class="cardTitle">${escapeHtml(p.name || (p.type === "game" ? "My Game" : "My App"))}</div>
        <div class="tag">${typeTag}</div>
      </div>
      <div class="cardMeta">
        ${(p.skillsUsed || []).slice(0,4).map(s => `<span class="pill ${s === "Creativity" ? "green" : ""}">${escapeHtml(s)}</span>`).join("")}
        <span class="pill">🕒 ${escapeHtml(updated)}</span>
      </div>
      <div class="cardBtns">
        <button class="btn ghost" data-act="open">Open</button>
        <button class="btn ghost" data-act="delete">Delete</button>
        <button class="btn" data-act="showdad">Show Dad</button>
      </div>
    `;

    div.querySelector('[data-act="open"]').addEventListener("click", () => openExistingProject(p.id));
    div.querySelector('[data-act="delete"]').addEventListener("click", () => deleteProject(p.id));
    div.querySelector('[data-act="showdad"]').addEventListener("click", () => alert("Show Dad: In Phase 2 we’ll generate a shareable preview link (private)."));

    return div;
  }

  // -------------------------
  // Builder open/close
  // -------------------------
  function openBuilder(mode) {
    builderMode = mode;
    currentProjectId = null;
    setScript([]);
    setRunLog("");

    projectNameInput.value = "";
    builderTitle.textContent = mode === "game" ? "🎮 Build a Game" : "📱 Build an App";
    builderSub.textContent = mode === "game" ? "Add blocks. Press Play. Make a game!" : "Add blocks. Press Play. Make an app!";

    // Toggle previews
    if (mode === "game") {
      gameCanvas.classList.remove("hidden");
      appPreview.classList.add("hidden");
    } else {
      gameCanvas.classList.add("hidden");
      appPreview.classList.remove("hidden");
    }

    renderBlockLibrary(mode);
    renderScript();

    builderBackdrop.classList.remove("hidden");
    startBuildingTimer();
  }

  function openExistingProject(projectId) {
    const p = state.projects.find(x => x.id === projectId);
    if (!p) return;

    builderMode = p.type;
    currentProjectId = p.id;

    projectNameInput.value = p.name || "";
    setScript((p.script || []).map(si => ({
      blockId: si.blockId,
      title: si.title,
      addsSkills: si.addsSkills || [],
    })));

    builderTitle.textContent = p.type === "game" ? "🎮 Build a Game" : "📱 Build an App";
    builderSub.textContent = "Edit blocks, then Play and Save.";

    // Toggle previews
    if (p.type === "game") {
      gameCanvas.classList.remove("hidden");
      appPreview.classList.add("hidden");
    } else {
      gameCanvas.classList.add("hidden");
      appPreview.classList.remove("hidden");
    }

    renderBlockLibrary(p.type);
    renderScript();
    setRunLog("");

    builderBackdrop.classList.remove("hidden");
    startBuildingTimer();
  }

  function closeBuilder() {
    stopRun();
    stopBuildingTimer();
    builderBackdrop.classList.add("hidden");
  }

  // -------------------------
  // Block library / script
  // -------------------------
  function renderBlockLibrary(mode) {
    blockListEvents.innerHTML = "";
    blockListActions.innerHTML = "";
    blockListLogic.innerHTML = "";

    const blocks = BLOCKS[mode];

    blocks.events.forEach(b => blockListEvents.appendChild(blockButton(b)));
    blocks.actions.forEach(b => blockListActions.appendChild(blockButton(b)));
    blocks.logic.forEach(b => blockListLogic.appendChild(blockButton(b)));
  }

  function blockButton(b) {
    const btn = document.createElement("button");
    btn.className = "blockBtn";
    btn.type = "button";
    btn.innerHTML = `${escapeHtml(b.title)}<small>${escapeHtml(b.desc)}</small>`;
    btn.addEventListener("click", () => addBlockToScript(b));
    return btn;
  }

  function addBlockToScript(block) {
    const item = { blockId: block.id, title: block.title, addsSkills: block.addsSkills || [] };
    currentScript = [...currentScript, item];
    renderScript();
  }

  function setScript(newScript) {
    currentScript = newScript;
    renderScript();
  }

  function undoLastBlock() {
    if (currentScript.length === 0) return;
    currentScript = currentScript.slice(0, -1);
    renderScript();
  }

  function renderScript() {
    scriptArea.innerHTML = "";
    if (currentScript.length === 0) {
      const e = document.createElement("div");
      e.className = "tiny";
      e.textContent = "No blocks yet. Click blocks on the left to add them.";
      scriptArea.appendChild(e);
      return;
    }

    currentScript.forEach((s, idx) => {
      const row = document.createElement("div");
      row.className = "scriptItem";
      row.innerHTML = `<div><b>${idx + 1}.</b> ${escapeHtml(s.title)}</div><button class="x" type="button">✖</button>`;
      row.querySelector(".x").addEventListener("click", () => {
        currentScript = currentScript.filter((_, i) => i !== idx);
        renderScript();
      });
      scriptArea.appendChild(row);
    });
  }

  // -------------------------
  // Run / Preview engines
  // -------------------------
  function runScript() {
    stopRun();
    setRunLog("Running...");

    // Track skills used in this run
    const runSkills = extractSkillsFromScript(currentScript);
    unlockSkills(runSkills);

    // Encourage persistence (edits)
    // Rough: if many blocks used, count as persistence
    if (currentScript.length >= 6) unlockSkills(["persistence"]);

    if (builderMode === "game") {
      runGame(currentScript);
    } else {
      runApp(currentScript);
    }

    // Mission rotates after a play (simple)
    state.missionIndex = (state.missionIndex + 1) % missions.length;
    saveState(state);
    updateMission();
    levelUpIfNeeded();
  }

  function stopRun() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;

    // Clear game/app preview to stable state
    const ctx = gameCanvas.getContext("2d");
    ctx.clearRect(0,0,gameCanvas.width, gameCanvas.height);
    appPreview.innerHTML = "";
    setRunLog("");
  }

  function runGame(script) {
    const ctx = gameCanvas.getContext("2d");
    const W = gameCanvas.width, H = gameCanvas.height;

    // Simple “character”
    const player = { x: 30, y: 200, w: 28, h: 28, vy: 0, color: "#ffffff" };
    let score = 0;

    // Pre-parse blocks (tiny interpreter)
    const steps = compileGameSteps(script);

    let stepIndex = 0;
    let wallHit = false;

    function tick() {
      // physics
      player.vy += 0.6; // gravity
      player.y += player.vy;
      if (player.y > 200) { player.y = 200; player.vy = 0; }

      // walls
      if (player.x + player.w > W - 10) { wallHit = true; player.x = W - 10 - player.w; }
      if (player.x < 10) { wallHit = true; player.x = 10; }

      // execute one step per frame (simple + fun)
      if (stepIndex < steps.length) {
        const st = steps[stepIndex];
        if (st.type === "move") player.x += st.dx;
        if (st.type === "jump" && player.vy === 0) player.vy = -10;
        if (st.type === "score") score += 1;
        if (st.type === "color") player.color = st.color;
        if (st.type === "sound") beep();
        if (st.type === "ifWall" && wallHit) { score += 1; wallHit = false; }
        stepIndex++;
      }

      // draw
      ctx.clearRect(0,0,W,H);
      // ground
      ctx.fillStyle = "rgba(255,255,255,.12)";
      ctx.fillRect(0, 235, W, 4);

      // player
      ctx.fillStyle = player.color;
      ctx.fillRect(player.x, player.y, player.w, player.h);

      // score
      ctx.fillStyle = "rgba(233,238,252,.9)";
      ctx.font = "14px system-ui";
      ctx.fillText(`Score: ${score}`, 10, 18);

      raf = requestAnimationFrame(tick);
    }

    setRunLog("Game running! (Tip: Add Score +1 or Repeat blocks.)");
    tick();
  }

  function compileGameSteps(script) {
    // Minimal “repeat” support:
    const out = [];
    for (let i = 0; i < script.length; i++) {
      const id = script[i].blockId;
      if (id === "repeat3") {
        // repeat next 2 actions 3 times (simple for kids)
        const next = script.slice(i + 1, i + 3);
        for (let r = 0; r < 3; r++) next.forEach(n => out.push(mapGameBlockToStep(n.blockId)));
        i += 2;
      } else {
        out.push(mapGameBlockToStep(id));
      }
    }
    return out.filter(Boolean);
  }

  function mapGameBlockToStep(id) {
    if (id === "moveRight") return { type:"move", dx: 3 };
    if (id === "moveLeft") return { type:"move", dx: -3 };
    if (id === "jump") return { type:"jump" };
    if (id === "scorePlus") return { type:"score" };
    if (id === "colorChange") return { type:"color", color: randomNiceColor() };
    if (id === "playSound") return { type:"sound" };
    if (id === "ifTouchWall") return { type:"ifWall" };
    // events are ignored at runtime for Phase 1
    return null;
  }

  function runApp(script) {
    // Very simple app engine: screens + UI elements
    let counter = 0;
    let hasScreen2 = false;

    // “compile”
    const hasNewScreen = script.some(s => s.blockId === "newScreen");
    if (hasNewScreen) { hasScreen2 = true; }

    // create base UI
    appPreview.innerHTML = "";
    const wrapper = document.createElement("div");
    wrapper.style.display = "grid";
    wrapper.style.gap = "10px";

    const title = document.createElement("div");
    title.style.fontWeight = "900";
    title.textContent = "My App";
    wrapper.appendChild(title);

    const screen = document.createElement("div");
    screen.style.border = "1px solid rgba(255,255,255,.12)";
    screen.style.borderRadius = "16px";
    screen.style.padding = "10px";
    screen.style.background = "rgba(0,0,0,.18)";
    wrapper.appendChild(screen);

    const info = document.createElement("div");
    info.style.color = "rgba(233,238,252,.75)";
    info.style.fontSize = "12px";
    info.textContent = hasScreen2 ? "Screen 1 (can go to Screen 2)" : "Screen 1";
    wrapper.appendChild(info);

    // add elements based on blocks
    const wantsText = script.some(s => s.blockId === "addText");
    const wantsButton = script.some(s => s.blockId === "addButton");
    const wantsCounter = script.some(s => s.blockId === "counterPlus");
    const wantsSound = script.some(s => s.blockId === "playSound");
    const wantsGo2 = script.some(s => s.blockId === "goToScreen2");

    if (wantsText) {
      const t = document.createElement("div");
      t.textContent = "Hello! I built this app 😄";
      t.style.fontWeight = "800";
      screen.appendChild(t);
    }

    const counterRow = document.createElement("div");
    counterRow.style.display = "flex";
    counterRow.style.alignItems = "center";
    counterRow.style.justifyContent = "space-between";
    counterRow.style.gap = "10px";
    counterRow.style.marginTop = "10px";

    const counterLabel = document.createElement("div");
    counterLabel.style.fontWeight = "900";
    counterLabel.textContent = "Counter:";
    const counterValue = document.createElement("div");
    counterValue.style.fontWeight = "900";
    counterValue.textContent = String(counter);

    counterRow.appendChild(counterLabel);
    counterRow.appendChild(counterValue);

    if (wantsCounter) screen.appendChild(counterRow);

    if (wantsButton) {
      const btnRow = document.createElement("div");
      btnRow.style.display = "flex";
      btnRow.style.gap = "10px";
      btnRow.style.marginTop = "12px";

      const b1 = document.createElement("button");
      b1.textContent = "Click me";
      b1.className = "btn";
      b1.style.borderRadius = "14px";
      b1.style.padding = "10px 12px";

      b1.addEventListener("click", () => {
        if (wantsCounter) {
          counter++;
          counterValue.textContent = String(counter);
        }
        if (wantsSound) beep();
        if (script.some(s => s.blockId === "ifCounter5") && counter === 5) {
          alert("Nice! Counter hit 5 🎉");
        }
      });

      btnRow.appendChild(b1);

      if (hasScreen2 && wantsGo2) {
        const b2 = document.createElement("button");
        b2.textContent = "Go to Screen 2";
        b2.className = "btn ghost";
        b2.style.borderRadius = "14px";
        b2.style.padding = "10px 12px";
        b2.addEventListener("click", () => {
          info.textContent = "Screen 2";
          screen.innerHTML = "";
          const s2 = document.createElement("div");
          s2.style.fontWeight = "900";
          s2.textContent = "Welcome to Screen 2 🚀";
          screen.appendChild(s2);
          if (wantsSound) beep();
        });
        btnRow.appendChild(b2);
      }

      screen.appendChild(btnRow);
    }

    appPreview.appendChild(wrapper);
    setRunLog("App running! (Tip: Add Counter +1 and If counter = 5.)");
  }

  // -------------------------
  // Save / delete projects
  // -------------------------
  function saveProject() {
    const name = (projectNameInput.value || "").trim();
    const safeName = name.length ? name : (builderMode === "game" ? "My Game" : "My App");

    // unlock creativity if named
    if (name.length) unlockSkills(["creativity"]);

    const skillsUsed = extractSkillsFromScript(currentScript).map(sid => skillDefs[sid]?.name).filter(Boolean);

    const now = Date.now();
    const payload = {
      id: currentProjectId || cryptoId(),
      type: builderMode,
      name: safeName,
      script: currentScript.map(s => ({ blockId: s.blockId, title: s.title, addsSkills: s.addsSkills })),
      skillsUsed: unique(skillsUsed),
      createdAt: currentProjectId ? (state.projects.find(p => p.id === currentProjectId)?.createdAt ?? now) : now,
      updatedAt: now,
    };

    if (currentProjectId) {
      state.projects = state.projects.map(p => (p.id === currentProjectId ? payload : p));
    } else {
      state.projects = [payload, ...state.projects];
      currentProjectId = payload.id;
    }

    saveState(state);
    levelUpIfNeeded();
    renderDashboard();
    setRunLog("Saved ✅");
  }

  function deleteProject(id) {
    state.projects = state.projects.filter(p => p.id !== id);
    saveState(state);
    renderDashboard();
  }

  function clearAllProjects() {
    if (!confirm("Clear ALL creations?")) return;
    state.projects = [];
    state.skills = {};
    state.level = 1;
    state.minutesBuilding = 0;
    saveState(state);
    renderDashboard();
    updateMission();
  }

  // -------------------------
  // Skills / time tracking
  // -------------------------
  function unlockSkills(skillIds) {
    const now = Date.now();
    let changed = false;

    for (const sid of skillIds) {
      if (!sid) continue;
      if (!state.skills[sid]) {
        state.skills[sid] = { name: skillDefs[sid]?.name || sid, firstSeenAt: now };
        changed = true;
      }
    }

    if (changed) {
      saveState(state);
    }
  }

  function extractSkillsFromScript(script) {
    const ids = [];
    for (const s of script) {
      (s.addsSkills || []).forEach(x => ids.push(x));
    }
    return unique(ids);
  }

  function startBuildingTimer() {
    buildingStartMs = Date.now();
    if (buildingTimer) clearInterval(buildingTimer);
    buildingTimer = setInterval(() => {
      const mins = Math.floor((Date.now() - buildingStartMs) / 60000);
      // only add when minutes tick
      // we add on close to reduce spam
    }, 2000);
  }

  function stopBuildingTimer() {
    if (!buildingStartMs) return;
    const elapsedMs = Date.now() - buildingStartMs;
    const addMins = Math.max(0, Math.floor(elapsedMs / 60000));
    if (addMins > 0) {
      state.minutesBuilding += addMins;
      saveState(state);
    }
    buildingStartMs = 0;
    if (buildingTimer) clearInterval(buildingTimer);
    buildingTimer = null;
  }

  // -------------------------
  // Helper bot (Phase 1 local)
  // -------------------------
  function openBot() {
    botBackdrop.classList.remove("hidden");
    if (chat.childElementCount === 0) {
      botSay("Ask me how to do one small thing. I’ll give a short hint.");
      botSay("Example: “How do I make score go up?”");
    }
    setTimeout(() => chatInput.focus(), 50);
  }
  function closeBot() { botBackdrop.classList.add("hidden"); }

  function sendChat() {
    const q = (chatInput.value || "").trim();
    if (!q) return;
    userSay(q);
    chatInput.value = "";

    // Tiny heuristic helper:
    const lower = q.toLowerCase();
    if (lower.includes("score") || lower.includes("counter")) {
      botSay("Try adding the block “Score +1” (or “Counter +1”). Then press Play and Save.");
      botSay("If you want a challenge: make it add 1 every time you click a button.");
      return;
    }
    if (lower.includes("jump")) {
      botSay("Add the “Jump” block. Press Play. If it doesn’t feel right, add “Repeat” too.");
      return;
    }
    if (lower.includes("screen")) {
      botSay("For apps: add “New screen” and then “Go to Screen 2”. Press Play to test it.");
      return;
    }
    if (lower.includes("stuck") || lower.includes("help")) {
      botSay("Pick ONE goal: move, score, or sound. Add 2–4 blocks only, then press Play.");
      return;
    }
    botSay("Try adding 2 blocks, press Play, and see what changes. Then tell me what happened.");
  }

  function userSay(text) {
    const div = document.createElement("div");
    div.className = "msg";
    div.innerHTML = `<div class="who">You</div><div class="txt">${escapeHtml(text)}</div>`;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  }
  function botSay(text) {
    const div = document.createElement("div");
    div.className = "msg";
    div.innerHTML = `<div class="who">Helper</div><div class="txt">${escapeHtml(text)}</div>`;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  }

/// -------------------------
// Brain Boost (Structured)
// -------------------------

let currentBoost = null;

function closeBrainBoost() {
  brainBackdrop.classList.add("hidden");
  boostResult.textContent = "";
  boostA.value = "";
}

function openBrainBoost() {
  brainBackdrop.classList.remove("hidden");
  generateBoostByLevel();
  setTimeout(() => boostA.focus(), 50);
}

function generateBoostByLevel() {
  boostResult.textContent = "";
  boostA.value = "";

  const level = state.level || 1;

  if (level <= 3) {
    currentBoost = simpleAddition();
  } else if (level <= 6) {
    currentBoost = mixedAdditionSubtraction();
  } else if (level <= 10) {
    currentBoost = multiplication();
  } else {
    currentBoost = logicPattern();
  }

  boostQ.textContent = currentBoost.q;
}

function checkBoost() {
  if (!currentBoost) {
    boostResult.textContent = "⚠️ Loading question… try again.";
    generateBoostByLevel();
    return;
  }

  const v = Number(boostA.value.trim());

  if (v === currentBoost.a) {
    boostResult.textContent = "✅ Correct! Nice thinking.";
    unlockSkills(["variables", "conditionals"]);
    state.missionIndex++;
    saveState(state);
    levelUpIfNeeded();
    setTimeout(generateBoostByLevel, 900);
  } else {
    boostResult.textContent = "❌ Not quite — try again!";
  }
}


/* ---------- Boost Types ---------- */

function simpleAddition() {
  const a = rand(5, 20);
  const b = rand(5, 20);
  return {
    q: `What is ${a} + ${b}?`,
    a: a + b
  };
}

function mixedAdditionSubtraction() {
  const a = rand(10, 30);
  const b = rand(1, a);
  const isAdd = Math.random() > 0.5;
  return isAdd
    ? { q: `What is ${a} + ${b}?`, a: a + b }
    : { q: `What is ${a} − ${b}?`, a: a - b };
}

function multiplication() {
  const a = rand(2, 9);
  const b = rand(2, 9);
  return {
    q: `What is ${a} × ${b}?`,
    a: a * b
  };
}

function logicPattern() {
  const start = rand(2, 10);
  const step = rand(2, 5);
  const seq = [start, start + step, start + step * 2];
  return {
    q: `What comes next? ${seq.join(", ")}, ?`,
    a: start + step * 3
  };
}

/* ---------- Utils ---------- */

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


  // -------------------------
  // Parent view
  // -------------------------
  function openParent() {
    pvProjects.textContent = String(state.projects.length);
    pvTime.textContent = `${state.minutesBuilding}m`;
    pvSkills.textContent = String(Object.keys(state.skills).length);

    const skills = Object.values(state.skills)
      .sort((a,b) => (a.firstSeenAt || 0) - (b.firstSeenAt || 0))
      .map(s => s.name);

    parentSkills.innerHTML = skills.length
      ? `<div style="font-weight:900;margin-bottom:8px;">Unlocked Skills</div>
         <div style="display:flex;flex-wrap:wrap;gap:8px;">
           ${skills.map(s => `<span class="pill green">${escapeHtml(s)}</span>`).join("")}
         </div>`
      : `<div class="tiny">No skills unlocked yet. After he plays & saves, they appear here.</div>`;

    parentBackdrop.classList.remove("hidden");
  }
  function closeParent() { parentBackdrop.classList.add("hidden"); }

  // -------------------------
  // Utilities
  // -------------------------
  function setRunLog(text) {
    runLog.textContent = text || "";
  }

  function cryptoId() {
    // simple id without dependencies
    return "p_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
  }

  function unique(arr) {
    return [...new Set(arr)];
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function randomNiceColor() {
    const colors = ["#ffffff", "#7c5cff", "#2ee59d", "#ffcf5a", "#ff5c7a"];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  function beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 740;
      g.gain.value = 0.06;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      setTimeout(() => { o.stop(); ctx.close(); }, 90);
    } catch { /* ignore */ }
  }

  // -------------------------
  // Boot
  // -------------------------
  init();
})();
