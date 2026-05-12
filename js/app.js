    // ========================================
    // DATA LAYER
        // ========================================
        
        const VERSION = '4.2';
        
        // Data storage
       let tools = [];
        let tasks = [];
        let habits = [];
        let habitLogs = {};
        let taskLogs = {};
        let sessionLogs = [];
        let activeSession = null;
        let sessionTimerInterval = null;
        let selectedSessionDuration = 60;
        let pendingSessionEndMode = 'complete';
        let projects = [];
        let tabOrder = [];
        let settings = {};
        let streakData = {};
        let recoverGems = 0;
        let gemCleanStreak = 0;
        let gemLastCleanDay = null;
        let _pendingHabitCompletion = null;
        let pointsConfig = { habits: 50, sessions: 50, tasks: 0 };
        let weeklySessionTargets = {
    weekdaysSessions: 9,
    weekendSessions: 4,
    weekdayDefinition: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
};
        let dailySessionOverrides = {};
        let weekOverrides = {};
        let _movePickerSession = null;
        let todayPointsState = { sessionPoints: 0, habitPoints: 0, totalPoints: 0 };
        let sessionEndSound = 'bellChime';
        let dayCutoffTime = localStorage.getItem('lifescore_day_cutoff_v4') || '03:00';
        let habitReminderInterval = null;
        let lastHabitReminderKey = '';
        let lastTaskReminderKey = '';
        let habitAnalyticsChart = null;
        let scoreTrendChart = null;
        let habitFilters = {
            nameSearch: '',
            nameSort: 'none',
            timeSort: 'none',
            timeBuckets: [],
            projects: [],
            types: []
        };
        let habitColumnWidths = {
            habit: 550,
            day: 140
        };
        let activeHabitResize = null;
        let currentWeekOffset = 0;
        let _projProgressWeekOffset = 0;
        let todayViewMode = localStorage.getItem('lifescore_today_view_mode_v4') || 'list';
        let notes = [];
let currentNoteId = null;
let currentNoteLabel = null;

        let currentFilter = 'all';
        let currentProject = null;
        let taskProjectFilter = 'all';
        let currentHabitProject = null;
        let selectedProjectIcon = '📁';
let selectedProjectColor = '#1967d2';
        let showCompleted = false;
        let showSkipped = false;
        let editingId = null;
        let editingType = null;
        let currentHabitId = null;
        let currentHabitDate = null;

        const tabDefs = {
    today:   { icon: '📅', label: 'Today',     id: 'todayTab'   },
    habits:  { icon: '🎯', label: 'Habits',    id: 'habitsTab'  },
    scoring: { icon: '📈', label: 'Analytics', id: 'scoringTab' },
    island:  { icon: '🏝️', label: 'Island',    id: 'islandTab'  },
};

        // World Progression System
        const XP_PER_LEVEL = 700;
        const WORLD_ISLANDS = [
            { level: 1,  name: 'Sandy Shores',        icon: '🌴', color: '#F59E0B', bg: 'linear-gradient(135deg,#f59e0b,#d97706)' },
            { level: 10, name: 'Verdant Vale',         icon: '🌿', color: '#10B981', bg: 'linear-gradient(135deg,#10b981,#059669)' },
            { level: 20, name: 'Ember Reef',           icon: '🌋', color: '#EF4444', bg: 'linear-gradient(135deg,#ef4444,#b91c1c)' },
            { level: 30, name: 'Frostfang Isle',       icon: '❄️', color: '#60A5FA', bg: 'linear-gradient(135deg,#60a5fa,#2563eb)' },
            { level: 40, name: 'Stormbreaker Cay',     icon: '⚡', color: '#A78BFA', bg: 'linear-gradient(135deg,#a78bfa,#7c3aed)' },
            { level: 50, name: 'Moonmist Atoll',       icon: '🌙', color: '#818CF8', bg: 'linear-gradient(135deg,#818cf8,#4338ca)' },
            { level: 60, name: 'Sunforge Archipelago', icon: '☀️', color: '#FBBF24', bg: 'linear-gradient(135deg,#fbbf24,#d97706)' },
            { level: 70, name: 'Crystal Haven',        icon: '💎', color: '#22D3EE', bg: 'linear-gradient(135deg,#22d3ee,#0891b2)' },
            { level: 80, name: 'Shadowfen',            icon: '🌑', color: '#9CA3AF', bg: 'linear-gradient(135deg,#6b7280,#1f2937)' },
            { level: 90, name: 'Celestara Prime',      icon: '✨', color: '#C4B5FD', bg: 'linear-gradient(135deg,#c4b5fd,#7c3aed)' },
        ];

        let worldProgress = { unlockedIslands: [0] };
// ========================================
        // HELPER FUNCTIONS
        // ========================================
        
        // Get local date string (YYYY-MM-DD) - NOT UTC
        function getStatusColor(status) {
    switch(status) {
        case 'active': return '#1E8E3E';
        case 'planning': return '#1967d2';
        case 'on-hold': return '#F9AB00';
        case 'completed': return '#5F6368';
        case 'archived': return '#9AA0A6';
        default: return '#1967d2';
    }
}
        function getLocalDateStr(date = new Date(), applyCutoff = false) {
            const d = new Date(date);
            if (applyCutoff) {
                const [cutoffHour, cutoffMinute] = (dayCutoffTime || '03:00').split(':').map(n => parseInt(n, 10) || 0);
                if (d.getHours() < cutoffHour || (d.getHours() === cutoffHour && d.getMinutes() < cutoffMinute)) {
                    d.setDate(d.getDate() - 1);
                }
            }
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        // ========================================
        // INITIALIZATION
        // ========================================
        
        function init() {
            loadData();
            loadIslandData();
            loadWorldProgress();
            migrateData();
            recomputeAllStreaks();
            autoSkipPastHabits();
            checkWorldIslandUnlocks(false);
            applySettings();
            renderTabs();
            updateProjectSelects();
            setupDaySelectors();
            setupIconPicker();
            setupColorPicker();
            setupDragAndDrop();
            initializeHabitReminderSystem();
            populateHabitFilterProjects();
            document.addEventListener('click', handleHabitFilterOutsideClick);
            document.addEventListener('click', () => {
                const menu = document.getElementById('fabAddMenu');
                if (menu) menu.style.display = 'none';
            });
            document.querySelectorAll('.modal').forEach(modal => {
                let mouseDownTarget = null;
                modal.addEventListener('mousedown', (e) => { mouseDownTarget = e.target; });
                modal.addEventListener('click', (e) => {
                    if (e.target === modal && mouseDownTarget === modal) modal.classList.remove('active');
                    mouseDownTarget = null;
                });
            });
            document.addEventListener('mousemove', handleHabitColumnResizeMove);
            document.addEventListener('mouseup', stopHabitColumnResize);
            
            const lastTab = localStorage.getItem('lifescore_current_tab_v4') || 'today';
            switchTab(tabDefs[lastTab] ? lastTab : 'today');
            if (activeSession) {
    renderActiveSessionView();
    startSessionTimer();
}
            if (settings.gamificationEnabled) {
    calculateScores();
            const today = new Date();
}

            
            const today = new Date();
            const last30Days = new Date(today);
            last30Days.setDate(last30Days.getDate() - 30);
            document.getElementById('chartStartDate').value = last30Days.toISOString().split('T')[0];
            document.getElementById('chartEndDate').value = today.toISOString().split('T')[0];

            // Init cloud sync after UI is ready
            setTimeout(() => initCloudSync(), 800);
            // Re-evaluate time-based highlights every 60s
            setInterval(updateTimelineHighlights, 60000);
        }

        function loadStoredJson(key, fallback) {
            try {
                const raw = localStorage.getItem(key);
                return raw ? JSON.parse(raw) : fallback;
            } catch (e) {
                console.warn(`Ignoring unreadable saved data for ${key}`, e);
                return fallback;
            }
        }

        function asArray(value) {
            return Array.isArray(value) ? value.filter(item => item && typeof item === 'object') : [];
        }

        function asObject(value) {
            return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
        }

        function loadData() {
            habits = asArray(loadStoredJson('lifescore_habits_v4', []));
            habitLogs = asObject(loadStoredJson('lifescore_habit_logs_v4', {}));
            sessionLogs = asArray(loadStoredJson('lifescore_session_logs_v4', []));
            streakData = asObject(loadStoredJson('lifescore_streaks_v4', {}));
            const _gs = loadStoredJson('lifescore_gems_v4', {});
            recoverGems = typeof _gs.count === 'number' ? _gs.count : 0;
            gemCleanStreak = typeof _gs.cleanStreak === 'number' ? _gs.cleanStreak : 0;
            gemLastCleanDay = _gs.lastCleanDay || null;
            activeSession = sessionLogs.find(s => !s.completed && (s.stopwatch || (s.endTime && s.endTime > Date.now()))) || null;
            // Load projects — normalize legacy complex objects to simple {id, name}
            const _rawProjects = loadStoredJson('lifescore_projects_v4', null);
            if (_rawProjects && Array.isArray(_rawProjects) && _rawProjects.length > 0) {
                projects = _rawProjects.map(p => ({
                    id: p.id,
                    name: p.name,
                    ...(p.weeklyTargetHours > 0 ? { weeklyTargetHours: p.weeklyTargetHours } : {}),
                    ...(p.scheduledSessions && p.scheduledSessions.length ? { scheduledSessions: p.scheduledSessions } : {}),
                    ...(p.updatedAt ? { updatedAt: p.updatedAt } : {})
                }));
            } else {
                projects = [];
            }
            saveProjects();
            tools = asArray(loadStoredJson('lifescore_tools_v4', []));
            tabOrder = loadStoredJson('lifescore_tab_order_v4', []);
            tabOrder = Array.isArray(tabOrder) ? tabOrder : [];
            // Remove any stale keys not in current tabDefs
            tabOrder = tabOrder.filter(key => tabDefs[key]);
            // Ensure every tab in tabDefs is present
            Object.keys(tabDefs).forEach(key => {
                if (!tabOrder.includes(key)) tabOrder.push(key);
            });
            saveTabOrder();
            const savedPointsConfig = localStorage.getItem('lifescore_points_config_v4');
            if (savedPointsConfig) {
                const parsedPoints = asObject(loadStoredJson('lifescore_points_config_v4', {}));
                pointsConfig = {
                    habits: Number.isFinite(parsedPoints?.habits) ? parsedPoints.habits : 50,
                    sessions: Number.isFinite(parsedPoints?.sessions) ? parsedPoints.sessions : 50,
                    tasks: Number.isFinite(parsedPoints?.tasks) ? parsedPoints.tasks : 0
                };
            } else {
                pointsConfig = { habits: 50, sessions: 50, tasks: 0 };
                localStorage.setItem('lifescore_points_config_v4', JSON.stringify(pointsConfig));
            }
            const savedWeeklySessions = localStorage.getItem('lifescore_weekly_sessions_v4');
            if (savedWeeklySessions) {
                const parsedWeekly = asObject(loadStoredJson('lifescore_weekly_sessions_v4', {}));
                weeklySessionTargets = {
                    weekdaysSessions: Number.isFinite(parsedWeekly?.weekdaysSessions) ? parsedWeekly.weekdaysSessions : 8,
                    weekendSessions: Number.isFinite(parsedWeekly?.weekendSessions) ? parsedWeekly.weekendSessions : 0,
                    weekdayDefinition: Array.isArray(parsedWeekly?.weekdayDefinition) && parsedWeekly.weekdayDefinition.length
                        ? parsedWeekly.weekdayDefinition
                        : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
                };
            } else {
                weeklySessionTargets = {
    weekdaysSessions: 9,
    weekendSessions: 4,
    weekdayDefinition: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
};
                localStorage.setItem('lifescore_weekly_sessions_v4', JSON.stringify(weeklySessionTargets));
            }
            const savedSessionEndSound = localStorage.getItem('lifescore_session_end_sound_v4');
            sessionEndSound = savedSessionEndSound || 'bellChime';
            const savedHabitColumnWidths = localStorage.getItem('lifescore_habit_column_widths_v4');
            if (savedHabitColumnWidths) {
                try {
                    const parsedWidths = JSON.parse(savedHabitColumnWidths);
                    habitColumnWidths = { ...habitColumnWidths, ...parsedWidths };
                } catch (e) {}
            }
            const savedSettings = localStorage.getItem('lifescore_settings_v4');
            try {
                settings = normalizeSettings(savedSettings ? JSON.parse(savedSettings) : {});
            } catch (e) {
                settings = normalizeSettings({});
            }
            weekOverrides = asObject(loadStoredJson('lifescore_weekoverrides_v4', {}));
        }

        function normalizeSettings(parsed = {}) {
            return {
                appName: parsed.appName || 'LifeScore',
                theme: parsed.theme || 'light',
                weekStartsOn: parsed.weekStartsOn !== undefined ? parsed.weekStartsOn : 1,
                dayEndTime: parsed.dayEndTime !== undefined ? parsed.dayEndTime : 3,
                gamificationEnabled: parsed.gamificationEnabled !== undefined ? parsed.gamificationEnabled : true,
                scoring: {
                    tasks: { totalPool: parsed.scoring?.tasks?.totalPool || 50 },
                    habits: { totalPool: parsed.scoring?.habits?.totalPool || 50 },
                    sessions: { completionPoints: parsed.scoring?.sessions?.completionPoints || 5 },
                    bonus: { taskPoints: parsed.scoring?.bonus?.taskPoints || 2 },
                    bonusPoints: parsed.scoring?.bonusPoints || 3
                }
            };
        }

        function migrateData() {
            let migrated = false;
            
            // Migrate tasks
            tasks = tasks.map(task => {
                let changed = false;
                if (task.notes || task.description) {
                    const details = [task.description, task.notes].filter(Boolean).join('\n\n');
                    changed = true;
                    task = {
                        ...task,
                        details: details,
                        notes: undefined,
                        description: undefined
                    };
                }
                if (task.skipped === undefined) {
                    task.skipped = false;
                    changed = true;
                }
                if (task.reminderTime === undefined) {
                    task.reminderTime = null;
                    changed = true;
                }
                if (changed) migrated = true;
                return task;
            });

            // Migrate habits - REMOVE PRIORITY, ADD WEIGHT
            let totalWeight = 0;
            habits = habits.map(habit => {
                let changed = false;
                
                if (habit.notes) {
                    habit.details = habit.notes;
                    habit.notes = undefined;
                    changed = true;
                }
                
                if (habit.measurable && !habit.period) {
    habit.period = 'daily';
    changed = true;
}
                
                // Remove priority, add weight
                if (habit.priority !== undefined) {
                    delete habit.priority;
                    changed = true;
                }
                
                if (habit.weight === undefined) {
                    habit.weight = 0;
                    changed = true;
                }
                if (!habit.habitType && habit.type) {
                    habit.habitType = habit.type;
                    changed = true;
                }
                if (!Number.isFinite(habit.targetValue) && Number.isFinite(habit.target_value)) {
                    habit.targetValue = habit.target_value;
                    changed = true;
                }

                if (!habit.startTrackingDate) {
                    habit.startTrackingDate = getLocalDateStr();
                    changed = true;
                }

                if (habit.reminderTime === undefined) {
                    habit.reminderTime = null;
                    changed = true;
                }
                
                totalWeight += habit.weight;
                
                if (changed) migrated = true;
                return habit;
            });
            
            // Normalize weights if needed
            if (habits.length > 0 && totalWeight === 0) {
                const equalWeight = Math.floor(100 / habits.length);
                let remainder = 100 - (equalWeight * habits.length);
                habits = habits.map((habit, index) => {
                    habit.weight = equalWeight + (index === 0 ? remainder : 0);
                    return habit;
                });
                migrated = true;
            } else if (totalWeight !== 100 && totalWeight > 0) {
                // Normalize to 100
                habits = habits.map(habit => {
                    habit.weight = Math.round((habit.weight / totalWeight) * 100);
                    return habit;
                });
                migrated = true;
            }

            // Migrate habitLogs
            for (let habitId in habitLogs) {
                if (!habitLogs[habitId] || typeof habitLogs[habitId] !== 'object') {
                    delete habitLogs[habitId];
                    migrated = true;
                    continue;
                }
                for (let dateStr in habitLogs[habitId]) {
                    const log = habitLogs[habitId][dateStr];
                    if (typeof log === 'boolean') {
                        habitLogs[habitId][dateStr] = {
                            state: log ? 'done' : 'blank',
                            completed: log,
                            value: log ? 1 : 0
                        };
                        migrated = true;
                    } else if (log && typeof log === 'object' && log.value === undefined) {
                        log.value = 1;
                        migrated = true;
                    } else if (!log || typeof log !== 'object') {
                        delete habitLogs[habitId][dateStr];
                        migrated = true;
                        continue;
                    }

                    if (log && typeof log === 'object' && !log.state) {
                        if (log.completed === true) log.state = 'done';
                        else if (log.completed === false && (log.value || 0) === 0) log.state = 'failed';
                        else log.state = 'blank';
                        migrated = true;
                    }
                }
            }

            // Ensure scoring settings exist
            const normalizedSettings = normalizeSettings(settings);
            if (JSON.stringify(settings) !== JSON.stringify(normalizedSettings)) {
                settings = normalizedSettings;
                migrated = true;
            }

            // Migrate projects to add session fields
            projects = projects.map(project => {
                let changed = false;
                if (project.isSession === undefined) {
                    project.isSession = false;
                    changed = true;
                }
                if (project.sessionDuration === undefined) {
                    project.sessionDuration = 90;
                    changed = true;
                }
                if (project.sessionPoints === undefined) {
                    project.sessionPoints = 5;
                    changed = true;
                }
                if (changed) migrated = true;
                return project;
            });

            if (migrated) {
                saveProjects();
            }
            if (migrated) {
                saveTasks();
                saveHabits();
                saveHabitLogs();
                localStorage.setItem('lifescore_settings_v4', JSON.stringify(settings));
            }
        }

        function applySettings() {
    // Ensure all settings exist with defaults
    if (!settings.appName) settings.appName = 'LifeScore';
    if (!settings.theme) settings.theme = 'light';
    if (settings.gamificationEnabled === undefined) settings.gamificationEnabled = true;
    if (settings.weekStartsOn === undefined) settings.weekStartsOn = 0;
    
    // Apply to UI
    document.getElementById('appName').textContent = settings.appName;
    document.documentElement.setAttribute('data-theme', settings.theme);
    document.getElementById('themeBtn').textContent = settings.theme === 'dark' ? '☀️' : '🌙';

    const gamificationElements = document.querySelectorAll('#weekPointsSection, .points-badge');
    gamificationElements.forEach(el => {
        el.style.display = settings.gamificationEnabled ? 'block' : 'none';
    });

    updateTotalScoringBase();
    if (typeof tabOrder !== 'undefined' && tabOrder.length) renderTabs();
}

        function updateTotalScoringBase() {
    const habitsInput = document.getElementById('settingPointsHabits');
    const sessionsInput = document.getElementById('settingPointsSessions');
    const tasksInput = document.getElementById('settingPointsTasks');
    const total = (parseInt(habitsInput?.value) || 0) +
                 (parseInt(sessionsInput?.value) || 0) +
                 (parseInt(tasksInput?.value) || 0);
    
    const el = document.getElementById('totalScoringBase');
    if (el) el.textContent = total;
}

        function getPointsAllocationTotal() { return 100; }
        function updatePointsAllocationTotal() {}

        function getSessionDayKey(date) {
    const keys = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return keys[date.getDay()];
}

        function getTodaySessionTarget(dateStr, dateObj = new Date()) {
    const dayName = getSessionDayKey(dateObj);
    const configuredWeekdays = Array.isArray(weeklySessionTargets.weekdayDefinition) ? weeklySessionTargets.weekdayDefinition : [];
    const isWeekday = configuredWeekdays.includes(dayName);
    const baseTarget = isWeekday
        ? (Number.isFinite(weeklySessionTargets.weekdaysSessions) ? weeklySessionTargets.weekdaysSessions : 9)
        : (Number.isFinite(weeklySessionTargets.weekendSessions) ? weeklySessionTargets.weekendSessions : 4);
    const override = dailySessionOverrides[dateStr];
    return Number.isFinite(override) ? override : baseTarget;
}

        function roundToTwo(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

      function calculateSessionPoints(completedSessions, plannedSessions, sessionPointsTotal) {
    if (!plannedSessions || plannedSessions <= 0) return 0;
    
    // Get today's completed sessions with actual durations
    const today = getLocalDateStr(new Date(), true);
    const todaySessions = sessionLogs.filter(s => s.date === today && s.completed);
    
    // Calculate points based on actual minutes worked
    let totalMinutes = 0;
    todaySessions.forEach(session => {
        const workedMin = Math.round((session.endTime - session.startTime) / 60000);
        const creditMin = Math.floor(workedMin / 15) * 15;
        // Only count sessions 15+ minutes, floored to 15-min blocks
        if (creditMin >= 15) {
            totalMinutes += creditMin;
        }
    });
    
    // Expected total minutes (assuming 60 min per session)
    const expectedMinutes = plannedSessions * 60;
    
    // Calculate proportional points
    const precise = (totalMinutes / expectedMinutes) * sessionPointsTotal;
    return roundToTwo(Math.min(precise, sessionPointsTotal)); // Cap at max points
}

        function calculateHabitPoints(completedWeight, habitPointsTotal) {
    const precise = (completedWeight / 100) * habitPointsTotal;
    return roundToTwo(precise);
}

        function getTotalPoints() {
    todayPointsState.totalPoints = roundToTwo(todayPointsState.sessionPoints + todayPointsState.habitPoints);
    return Math.floor(todayPointsState.totalPoints);
}

        function calcSessionXP(session) {
    const workedMin = Math.round((session.endTime - session.startTime) / 60000);
    const multiplier = session.xpMultiplier || 1;
    return Math.round(workedMin * 0.25 * multiplier * 10) / 10;
}
function getHabitXP(habit) {
    return ({ easy: 5, medium: 10, hard: 20 })[habit.difficulty || 'medium'] || 10;
}
function getTodayXP(dateStr) {
    const sessionXP = sessionLogs
        .filter(s => s.date === dateStr && s.completed && !s.interrupted)
        .reduce((sum, s) => sum + calcSessionXP(s), 0);
    const habitXP = habits.reduce((sum, habit) => {
        const log = habitLogs[habit.id]?.[dateStr];
        return sum + (getHabitLogState(log) === 'done' ? getHabitXP(habit) : 0);
    }, 0);
    return sessionXP + habitXP;
}
function getTotalXP() {
    const sessionXP = sessionLogs
        .filter(s => s.completed && !s.interrupted)
        .reduce((sum, s) => sum + calcSessionXP(s), 0);
    const habitXP = habits.reduce((sum, habit) => {
        const logs = habitLogs[habit.id] || {};
        const doneCount = Object.values(logs).filter(l => getHabitLogState(l) === 'done').length;
        return sum + doneCount * getHabitXP(habit);
    }, 0);
    return sessionXP + habitXP;
}
/* ============================================================
   WORLD PROGRESSION SYSTEM
   ============================================================ */
function loadWorldProgress() {
    try {
        const raw = localStorage.getItem('lifescore_world_v4');
        if (raw) {
            const parsed = JSON.parse(raw);
            worldProgress = { unlockedIslands: [0], ...parsed };
        }
    } catch(e) {}
    if (!Array.isArray(worldProgress.unlockedIslands)) worldProgress.unlockedIslands = [0];
    if (!worldProgress.unlockedIslands.includes(0)) worldProgress.unlockedIslands.unshift(0);
    // Re-validate: strip any islands unlocked at the wrong XP scale
    const currentLevel = getUserLevel();
    worldProgress.unlockedIslands = worldProgress.unlockedIslands.filter(
        i => i === 0 || (WORLD_ISLANDS[i] && WORLD_ISLANDS[i].level <= currentLevel)
    );
    saveWorldProgress();
}
function saveWorldProgress() {
    localStorage.setItem('lifescore_world_v4', JSON.stringify(worldProgress));
}
function getUserLevel() {
    return Math.max(1, Math.floor(getTotalXP() / XP_PER_LEVEL) + 1);
}
function getCurrentWorldIslandIdx() {
    let idx = 0;
    for (let i = WORLD_ISLANDS.length - 1; i >= 0; i--) {
        if (worldProgress.unlockedIslands.includes(i)) { idx = i; break; }
    }
    return idx;
}
function updateLevelBadge() {
    const el = document.getElementById('islandLevelBadgeText');
    if (!el) return;
    try {
        const lvl = getIslandLevelInfo();
        el.textContent = `${lvl.icon} Lv.${lvl.level} · ${lvl.name}`;
    } catch(e) {}
}
let _islandUnlockQueue = [];
let _islandUnlockShowing = false;
function checkWorldIslandUnlocks(showPopup) {
    const level = getUserLevel();
    let didUnlock = false;
    for (let i = 1; i < WORLD_ISLANDS.length; i++) {
        if (!worldProgress.unlockedIslands.includes(i) && level >= WORLD_ISLANDS[i].level) {
            worldProgress.unlockedIslands.push(i);
            didUnlock = true;
            if (showPopup) _islandUnlockQueue.push(i);
        }
    }
    if (didUnlock) saveWorldProgress();
    if (showPopup && _islandUnlockQueue.length > 0 && !_islandUnlockShowing) {
        _drainIslandUnlockQueue();
    }
}
function _drainIslandUnlockQueue() {
    if (_islandUnlockQueue.length === 0) { _islandUnlockShowing = false; return; }
    _islandUnlockShowing = true;
    const idx = _islandUnlockQueue.shift();
    showIslandUnlockPopup(WORLD_ISLANDS[idx], idx);
}
function showIslandUnlockPopup(island, idx) {
    const popup = document.getElementById('islandUnlockPopup');
    if (!popup) return;
    document.getElementById('iupIcon').textContent = island.icon;
    document.getElementById('iupName').textContent = island.name;
    const btn = document.getElementById('iupBtn');
    if (btn) btn.style.background = island.bg;
    popup.style.display = 'flex';
    launchConfetti();
    if (typeof playMilestoneSound === 'function') playMilestoneSound();
}
function closeIslandUnlockPopup() {
    const popup = document.getElementById('islandUnlockPopup');
    if (popup) popup.style.display = 'none';
    updateLevelBadge();
    if (_islandUnlockQueue.length > 0) {
        setTimeout(_drainIslandUnlockQueue, 400);
    } else {
        _islandUnlockShowing = false;
    }
}
function openIslandLevelModal() {
    const modal = document.getElementById('islandLevelModal');
    if (!modal) return;
    modal.style.display = 'flex';

    const cur = getIslandLevelInfo();
    const spent = islandData.xpSpent;
    const nextLvl = ISLAND_LEVELS.find(l => l.threshold > spent);

    const nameEl = document.getElementById('ilmCurrentName');
    if (nameEl) nameEl.textContent = `${cur.icon} Lv.${cur.level} · ${cur.name}`;

    const labelEl = document.getElementById('ilmProgressLabel');
    const pctEl   = document.getElementById('ilmProgressPct');
    const fillEl  = document.getElementById('ilmProgressFill');
    const hintEl  = document.getElementById('ilmProgressHint');

    if (nextLvl) {
        const range = nextLvl.threshold - cur.threshold;
        const done  = spent - cur.threshold;
        const pct   = range > 0 ? Math.min(100, Math.round((done / range) * 100)) : 100;
        if (labelEl) labelEl.textContent = `${spent} XP spent · ${nextLvl.threshold} XP to reach Lv.${nextLvl.level}`;
        if (pctEl)   pctEl.textContent   = pct + '%';
        if (fillEl)  fillEl.style.width  = pct + '%';
        const xpLeft = nextLvl.threshold - spent;
        if (hintEl)  hintEl.textContent  = `${xpLeft} more XP to reach ${nextLvl.name}`;
    } else {
        if (labelEl) labelEl.textContent = `${spent} XP spent · Island fully mastered!`;
        if (pctEl)   pctEl.textContent   = '100%';
        if (fillEl)  fillEl.style.width  = '100%';
        if (hintEl)  hintEl.textContent  = '🎉 You have reached Paradise!';
    }

    const listEl = document.getElementById('ilmLevelsList');
    if (!listEl) return;
    listEl.innerHTML = ISLAND_LEVELS.map(l => {
        const isAchieved = spent >= l.threshold;
        const isCurrent  = l.level === cur.level;
        const unlockTags = (l.unlocks || [])
            .map(u => `<span class="ilm-unlock-tag">${u}</span>`)
            .join('');
        const rowClass = isCurrent ? 'ilm-level-current' : !isAchieved ? 'ilm-level-locked' : '';
        const badge = isCurrent
            ? '<span class="ilm-badge-current">Current</span>'
            : isAchieved
                ? '<span class="ilm-badge-done">✓</span>'
                : `<span class="ilm-badge-locked">🔒</span>`;
        const xpLabel = l.threshold === 0 ? 'Starting level' : `${l.threshold} XP spent`;
        return `
        <div class="ilm-level-row ${rowClass}">
            <div class="ilm-level-icon-wrap ${isAchieved ? 'ilm-icon-achieved' : ''}">${l.icon}</div>
            <div class="ilm-level-info">
                <div class="ilm-level-name">Lv.${l.level} · ${l.name}</div>
                <div class="ilm-level-xp">${xpLabel}</div>
                ${unlockTags ? `<div class="ilm-unlocks">${unlockTags}</div>` : ''}
            </div>
            <div class="ilm-level-badge">${badge}</div>
        </div>`;
    }).join('');
}

function closeIslandLevelModal() {
    const modal = document.getElementById('islandLevelModal');
    if (modal) modal.style.display = 'none';
}

function openWorldMap() {
    renderWorldMap();
    document.getElementById('worldMapModal').style.display = 'flex';
}
function closeWorldMap() {
    document.getElementById('worldMapModal').style.display = 'none';
}
function renderWorldMap() {
    const level = getUserLevel();
    const currentIdx = getCurrentWorldIslandIdx();
    const currentIsland = WORLD_ISLANDS[currentIdx];

    const subtitleEl = document.getElementById('wmmSubtitle');
    if (subtitleEl) subtitleEl.textContent = `Level ${level} · ${currentIsland.name}`;

    // Progress to next island
    const nextUnlockIdx = WORLD_ISLANDS.findIndex((isl, i) => !worldProgress.unlockedIslands.includes(i));
    const progressEl = document.getElementById('wmmProgressLabel');
    const pctEl = document.getElementById('wmmProgressPct');
    const fillEl = document.getElementById('wmmProgressFill');
    const hintEl = document.getElementById('wmmProgressHint');

    if (nextUnlockIdx !== -1) {
        const nextIsland = WORLD_ISLANDS[nextUnlockIdx];
        const prevLevel = WORLD_ISLANDS[nextUnlockIdx - 1]?.level || 1;
        const span = nextIsland.level - prevLevel;
        const done = level - prevLevel;
        const pct = Math.min(100, Math.max(0, (done / span) * 100));
        if (progressEl) progressEl.innerHTML = `Progress to <strong style="color:${nextIsland.color}">${nextIsland.icon} ${nextIsland.name}</strong>`;
        if (pctEl) pctEl.textContent = pct.toFixed(0) + '%';
        if (fillEl) { fillEl.style.width = pct + '%'; fillEl.style.background = `linear-gradient(90deg, ${nextIsland.color}99, ${nextIsland.color})`; }
        const levelsLeft = Math.max(0, nextIsland.level - level);
        if (hintEl) hintEl.textContent = levelsLeft > 0 ? `${levelsLeft} level${levelsLeft > 1 ? 's' : ''} until ${nextIsland.name}` : 'Almost there!';
    } else {
        if (progressEl) progressEl.textContent = 'All islands unlocked!';
        if (pctEl) pctEl.textContent = '100%';
        if (fillEl) { fillEl.style.width = '100%'; fillEl.style.background = 'linear-gradient(90deg,#a78bfa,#c4b5fd)'; }
        if (hintEl) hintEl.textContent = '🎉 You have reached the end of the world!';
    }

    // Island list
    const listEl = document.getElementById('wmmIslandsList');
    if (!listEl) return;
    listEl.innerHTML = WORLD_ISLANDS.map((isl, i) => {
        const isCurrent = i === currentIdx;
        const isUnlocked = worldProgress.unlockedIslands.includes(i);
        const isLocked = !isUnlocked;
        let cardClass = isCurrent ? 'wic-current' : isUnlocked ? 'wic-unlocked' : 'wic-locked';
        let badgeHtml = isCurrent
            ? `<span class="wmm-badge wmm-badge-current">Current</span>`
            : isUnlocked
                ? `<span class="wmm-badge wmm-badge-unlocked">✓ Unlocked</span>`
                : `<span class="wmm-badge wmm-badge-locked">🔒 Lv.${isl.level}</span>`;
        const iconWrapStyle = isCurrent
            ? `background:${isl.bg}; box-shadow:0 4px 12px ${isl.color}55;`
            : isUnlocked
                ? `background:${isl.bg}; opacity:0.75;`
                : `background:rgba(255,255,255,0.05);`;
        const nameClass = isLocked ? 'dim' : '';
        const iconContent = isLocked ? '🔒' : isl.icon;
        const currentGlow = isCurrent ? `box-shadow: 0 0 0 2px ${isl.color}55, 0 6px 20px ${isl.color}22;` : '';
        return `
        <div class="wmm-island-card ${cardClass}" style="${currentGlow}">
            ${isCurrent ? `<div style="position:absolute;inset:0;border-radius:16px;background:${isl.bg};opacity:0.1;pointer-events:none;"></div>` : ''}
            <div class="wmm-island-icon-wrap" style="${iconWrapStyle}">${isLocked ? '🔒' : isl.icon}</div>
            <div class="wmm-island-info">
                <div class="wmm-island-name ${nameClass}">${isl.name}</div>
                <div class="wmm-island-level-label">${isl.level === 1 ? 'Starting island' : `Unlocks at Level ${isl.level}`}</div>
            </div>
            ${badgeHtml}
        </div>`;
    }).join('');
}

function refreshTotalXPDisplay() {
    const el = document.getElementById('totalXpDisplay');
    const islandSpent = typeof islandData !== 'undefined' ? islandData.xpSpent || 0 : 0;
    if (el) el.textContent = `Total XP: ${Math.max(0, getTotalXP() - islandSpent).toFixed(1)}`;
    updateLevelBadge();
    checkWorldIslandUnlocks(true);
}

        let _logMissedProjectId = null, _logMissedStart = null, _logMissedEnd = null, _logMissedMaxH = 1;

        function openLogMissedModal(projectId, startTimeStr, endTimeStr) {
            const project = projects.find(p => p.id === projectId);
            if (!project) return;
            const [sh, sm] = startTimeStr.split(':').map(Number);
            const [eh, em] = endTimeStr.split(':').map(Number);
            const durMins = (eh * 60 + em) - (sh * 60 + sm);
            _logMissedProjectId = projectId;
            _logMissedStart = startTimeStr;
            _logMissedEnd = endTimeStr;
            _logMissedMaxH = durMins / 60;
            const timeEl = document.getElementById('logMissedTimeInfo');
            if (timeEl) timeEl.textContent = `${startTimeStr}–${endTimeStr} (${durMins} min)`;
            const selectEl = document.getElementById('logMissedProjectSelect');
            if (selectEl) {
                selectEl.innerHTML = projects.map(p =>
                    `<option value="${p.id}"${p.id === projectId ? ' selected' : ''}>${escapeHtml(p.name)}</option>`
                ).join('');
            }
            const hoursEl = document.getElementById('logMissedHours');
            if (hoursEl) { hoursEl.value = (durMins / 60).toFixed(2); hoursEl.max = _logMissedMaxH; }
            const noteEl = document.getElementById('logMissedNote');
            if (noteEl) noteEl.value = '';
            document.getElementById('logMissedModal').classList.add('active');
        }

        function saveLogMissedSession() {
            const hoursEl = document.getElementById('logMissedHours');
            const noteEl = document.getElementById('logMissedNote');
            const hours = parseFloat(hoursEl?.value);
            if (hours == null || isNaN(hours) || hours < 0) return alert('Please enter a valid number of hours');
            const selectEl = document.getElementById('logMissedProjectSelect');
            const projectId = selectEl && selectEl.value ? parseInt(selectEl.value) : _logMissedProjectId;
            const project = projects.find(p => p.id === projectId);
            if (!project) return;
            const focusQuality = parseFloat(document.getElementById('logMissedFocusQuality')?.value || '0.8');
            const [sh, sm] = _logMissedStart.split(':').map(Number);
            const todayStr = getLocalDateStr(new Date(), true);
            const startTs = new Date(todayStr + 'T00:00:00').getTime() + (sh * 60 + sm) * 60000;
            const workedMin = Math.round(hours * 60);
            const endTs = startTs + workedMin * 60000;
            const session = {
                id: Date.now(), date: todayStr,
                projectId: project.id, projectName: project.name,
                duration: workedMin, startTime: startTs, endTime: endTs,
                stopwatch: false, activeTasks: [], tasksCompleted: [],
                notes: noteEl?.value.trim() || '',
                completed: true, interrupted: false, source: 'manual',
                focusQuality, xpMultiplier: focusQuality
            };
            if (settings.gamificationEnabled) {
                const rtid = `session_${session.id}`;
                if (!taskLogs[rtid]) taskLogs[rtid] = {};
                taskLogs[rtid][todayStr] = { completed: true, points: settings.scoring?.sessions?.completionPoints || 5 };
                saveTaskLogs();
            }
            sessionLogs.push(session);
            saveSessionLogs();
            document.getElementById('logMissedModal').classList.remove('active');
            renderTodayView();
            if (settings.gamificationEnabled) { calculateScores(); renderSessionAnalytics(); }
            const xp = calcSessionXP(session);
            if (xp > 0) showXpGainPopup(xp);
        }

        function openStartSessionModal() {
    const projectSelect = document.getElementById('sessionProjectSelect');
    const noMsg = document.getElementById('sessionNoProjectsMsg');
    const startBtn = document.getElementById('startSessionBtn');
    const hasProjects = projects.length > 0;
    projectSelect.innerHTML = '<option value="">Select project</option>' +
        projects.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
    projectSelect.style.display = hasProjects ? '' : 'none';
    if (noMsg) noMsg.style.display = hasProjects ? 'none' : '';
    if (startBtn) startBtn.style.display = hasProjects ? '' : 'none';
    selectedSessionDuration = 60;
    selectSessionDuration(60);
    document.getElementById('startSessionModal').classList.add('active');
}

        function closeStartSessionModal() {
    document.getElementById('startSessionModal').classList.remove('active');
}

        function selectSessionDuration(minutes) {
    selectedSessionDuration = minutes;
    document.querySelectorAll('.session-duration-btn').forEach(btn => {
        const btnDuration = parseInt(btn.dataset.duration);
        const isSelected = (btnDuration === minutes) || (minutes === 0 && btnDuration === 0);
        btn.style.background = isSelected ? 'var(--accent-color)' : 'var(--bg-tertiary)';
        btn.style.color = isSelected ? '#fff' : 'var(--text-primary)';
        btn.style.border = isSelected ? '2px solid var(--accent-color)' : '2px solid var(--border-color)';
        // tint child text for selected card
        btn.querySelectorAll('.session-type-name, .session-type-meta').forEach(el => {
            el.style.color = isSelected ? '#fff' : '';
        });
    });
}
function openLogPastSessionModal() {
    const modal = document.getElementById('logPastSessionModal');
    const projectSelect = document.getElementById('pastSessionProjectSelect');
    projectSelect.innerHTML = '<option value="">Select Project...</option>' +
        projects.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
    
    // Set default to 1 hour ago
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    document.getElementById('pastSessionStartTime').value = oneHourAgo.toISOString().slice(0, 16);
    document.getElementById('pastSessionDuration').value = '60';
    document.getElementById('pastSessionNotes').value = '';
    
    modal.classList.add('active');
}

function closeLogPastSessionModal() {
    document.getElementById('logPastSessionModal').classList.remove('active');
}
let currentEditingSessionId = null;

function viewSessionDetails(sessionId) {
    const session = sessionLogs.find(s => s.id === sessionId);
    if (!session) return;
    
    currentEditingSessionId = sessionId;
    
    const workedMin = Math.round((session.endTime - session.startTime) / 60000);
    const startTime = new Date(session.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const endTime = new Date(session.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    const xp = calcSessionXP(session).toFixed(1);

    document.getElementById('sessionDetailTitle').textContent = session.projectName || 'Session';
    document.getElementById('sessionDetailProject').textContent = session.projectName || 'Unknown';
    document.getElementById('sessionDetailDuration').textContent = `${workedMin} minutes (${session.duration}m planned)`;
    document.getElementById('sessionDetailTime').textContent = `${startTime} - ${endTime}`;
    document.getElementById('sessionDetailPoints').textContent = `${xp} XP`;
    document.getElementById('sessionDetailNotes').textContent = session.notes || 'No notes recorded';
    
    // Show completed tasks
    const tasksEl = document.getElementById('sessionDetailTasks');
    if (session.tasksCompleted && session.tasksCompleted.length > 0) {
        const tasksList = session.tasksCompleted.map(taskId => {
            const task = tasks.find(t => t.id === taskId);
            return task ? `<div style="padding: 6px 10px; background: var(--bg-tertiary); border-radius: 4px; font-size: 14px;">✓ ${escapeHtml(task.text)}</div>` : '';
        }).filter(Boolean).join('');
        tasksEl.innerHTML = tasksList || '<div style="color: var(--text-secondary); font-size: 14px;">No tasks completed</div>';
    } else {
        tasksEl.innerHTML = '<div style="color: var(--text-secondary); font-size: 14px;">No tasks completed</div>';
    }
    
    document.getElementById('sessionDetailModal').classList.add('active');
}

function closeSessionDetailModal() {
    document.getElementById('sessionDetailModal').classList.remove('active');
}
function openEditSessionModal() {
    if (!currentEditingSessionId) return;
    
    const session = sessionLogs.find(s => s.id === currentEditingSessionId);
    if (!session) return;
    
    const modal = document.getElementById('editSessionModal');
    const projectSelect = document.getElementById('editSessionProjectSelect');
    
    projectSelect.innerHTML = '<option value="">Select Project...</option>' +
        projects.map(p => `<option value="${p.id}" ${p.id === session.projectId ? 'selected' : ''}>${escapeHtml(p.name)}</option>`).join('');
    
    // Pre-fill with current session data
    const workedMin = Math.round((session.endTime - session.startTime) / 60000);
    document.getElementById('editSessionDuration').value = workedMin;
    document.getElementById('editSessionStartTime').value = new Date(session.startTime).toISOString().slice(0, 16);
    document.getElementById('editSessionNotes').value = session.notes || '';
    
    // Close detail modal and open edit modal
    closeSessionDetailModal();
    modal.classList.add('active');
}

function closeEditSessionModal() {
    document.getElementById('editSessionModal').classList.remove('active');
}

function saveEditedSession() {
    if (!currentEditingSessionId) return;
    
    const projectId = parseInt(document.getElementById('editSessionProjectSelect').value);
    const duration = parseInt(document.getElementById('editSessionDuration').value);
    const startTimeStr = document.getElementById('editSessionStartTime').value;
    const notes = document.getElementById('editSessionNotes').value.trim();
    
    if (!projectId) {
        alert('Please select a project.');
        return;
    }
    if (!duration || duration < 1) {
        alert('Please enter a valid duration.');
        return;
    }
    if (!startTimeStr) {
        alert('Please select a start time.');
        return;
    }
    
    const project = projects.find(p => p.id === projectId);
    if (!project) {
        alert('Selected project not found.');
        return;
    }
    
    const session = sessionLogs.find(s => s.id === currentEditingSessionId);
    if (!session) return;
    
    const startTime = new Date(startTimeStr).getTime();
    const endTime = startTime + (duration * 60 * 1000);
    const dateStr = getLocalDateStr(new Date(startTime), true);
    
    // Update session
    session.projectId = project.id;
    session.projectName = project.name;
    session.startTime = startTime;
    session.endTime = endTime;
    session.date = dateStr;
    session.notes = notes;
    
    saveSessionLogs();
    closeEditSessionModal();
    renderTodayView();
    renderSessionAnalytics();
    alert('Session updated successfully!');
}

function deleteSession() {
    if (!currentEditingSessionId) return;
    
    if (!confirm('Are you sure you want to delete this session? This cannot be undone.')) {
        return;
    }
    
    const index = sessionLogs.findIndex(s => s.id === currentEditingSessionId);
    if (index > -1) {
        sessionLogs.splice(index, 1);
        saveSessionLogs();
        closeSessionDetailModal();
        renderTodayView();
        renderScoringBreakdown(getLocalDateStr(new Date(), true));
        renderSessionAnalytics();
    }
}

function savePastSession() {
    const projectId = parseInt(document.getElementById('pastSessionProjectSelect').value);
    const duration = parseInt(document.getElementById('pastSessionDuration').value);
    const startTimeStr = document.getElementById('pastSessionStartTime').value;
    const notes = document.getElementById('pastSessionNotes').value.trim();
    
    if (!projectId) {
        alert('Please select a project.');
        return;
    }
    if (!duration || duration < 1) {
        alert('Please enter a valid duration.');
        return;
    }
    if (!startTimeStr) {
        alert('Please select a start time.');
        return;
    }
    
    const project = projects.find(p => p.id === projectId);
    if (!project) {
        alert('Selected project not found.');
        return;
    }
    
    const startTime = new Date(startTimeStr).getTime();
    const endTime = startTime + (duration * 60 * 1000);
    const dateStr = getLocalDateStr(new Date(startTime), true);
    
    const focusQuality = parseFloat(document.getElementById('pastSessionFocusQuality')?.value || '0.8');
    const session = {
        id: startTime,
        date: dateStr,
        projectId: project.id,
        projectName: project.name,
        duration: duration,
        startTime: startTime,
        endTime: endTime,
        activeTasks: [],
        tasksCompleted: [],
        notes: notes,
        completed: true,
        interrupted: null,
        focusQuality, xpMultiplier: focusQuality
    };

    sessionLogs.push(session);
    saveSessionLogs();
    closeLogPastSessionModal();
    renderTodayView();
    renderScoringBreakdown(getLocalDateStr(new Date(), true));
    renderSessionAnalytics();
    alert('Past session logged successfully!');
}

        function startSession() {
    if (activeSession) {
        alert('A session is already active.');
        return;
    }

    const projectSelect = document.getElementById('sessionProjectSelect');
    const projectId = parseInt(projectSelect.value);
    if (!projectId) {
        alert('Please choose a project.');
        return;
    }

    const project = projects.find(p => p.id === projectId);
    if (!project) {
        alert('Selected project not found.');
        return;
    }

    const activeTasks = tasks
        .filter(task => task.project === projectId)
        .map(task => task.id);

    const start = Date.now();
    const isStopwatch = selectedSessionDuration === 0;
    const end = isStopwatch ? null : start + (selectedSessionDuration * 60 * 1000);
    const dateStr = getLocalDateStr(new Date(start), true);

    const session = {
        id: start,
        date: dateStr,
        projectId: project.id,
        projectName: project.name,
        duration: selectedSessionDuration,
        startTime: start,
        endTime: end,
        stopwatch: isStopwatch,
        activeTasks: activeTasks,
        tasksCompleted: [],
        notes: '',
        completed: false,
        interrupted: null
    };

    sessionLogs.push(session);
    saveSessionLogs();
    activeSession = session;
    closeStartSessionModal();
    renderActiveSessionView();
    startSessionTimer();
}

        function startSessionTimer() {
    if (sessionTimerInterval) clearInterval(sessionTimerInterval);
    sessionTimerInterval = setInterval(() => {
        if (!activeSession) {
            clearInterval(sessionTimerInterval);
            sessionTimerInterval = null;
            return;
        }
        if (activeSession.stopwatch) {
            const elapsedMs = Date.now() - activeSession.startTime;
            updateActiveSessionTimerDisplay(elapsedMs, true);
            return;
        }
        const remainingMs = activeSession.endTime - Date.now();
        if (remainingMs <= 0) {
            updateActiveSessionTimerDisplay(0);
            if (sessionTimerInterval) {
                clearInterval(sessionTimerInterval);
                sessionTimerInterval = null;
            }
            pendingSessionEndMode = 'complete';
            showSessionEndPopup();
            return;
        }
        updateActiveSessionTimerDisplay(remainingMs);
    }, 1000);
}

        function updateActiveSessionTimerDisplay(ms, countingUp) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hh = Math.floor(totalSeconds / 3600);
    const mm = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const ss = String(totalSeconds % 60).padStart(2, '0');
    const timeStr = hh > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;

    const timerEl = document.getElementById('activeSessionTimer');
    if (!timerEl) return;
    timerEl.textContent = timeStr;
    if (countingUp) timerEl.style.color = 'var(--accent-color)';
    else timerEl.style.color = '';

    const xpEl = document.getElementById('activeSessionLiveXP');
    const elapsedMin = activeSession ? Math.floor((Date.now() - activeSession.startTime) / 60000) : 0;
    const xpVal = (elapsedMin * 0.25).toFixed(1);
    if (xpEl && activeSession) xpEl.textContent = xpVal;

    // Mirror into mobile slim bar
    const mobileTimer = document.getElementById('mobileHandleTimer');
    if (mobileTimer) mobileTimer.textContent = timeStr;
    const mobileXP = document.getElementById('mobileHandleXP');
    if (mobileXP && activeSession) mobileXP.textContent = `${xpVal} XP`;
}

        function playSessionEndSound() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const playTone = (freq, start, duration, type = 'sine', volume = 0.12) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration + 0.02);
    };

    switch (sessionEndSound) {
        case 'bellChime':
            playTone(880, now, 0.35, 'sine', 0.14);
            playTone(1320, now + 0.08, 0.45, 'triangle', 0.1);
            break;
        case 'softPing':
            playTone(1046, now, 0.22, 'sine', 0.1);
            break;
        case 'digitalBeep':
            playTone(880, now, 0.12, 'square', 0.11);
            playTone(880, now + 0.18, 0.12, 'square', 0.11);
            break;
        case 'gentleTone':
            playTone(659, now, 0.5, 'sine', 0.09);
            break;
        case 'windChime':
            playTone(784, now, 0.3, 'triangle', 0.08);
            playTone(988, now + 0.09, 0.3, 'triangle', 0.08);
            playTone(1175, now + 0.18, 0.35, 'triangle', 0.08);
            break;
        case 'notificationSound':
            playTone(740, now, 0.14, 'sine', 0.1);
            playTone(988, now + 0.16, 0.18, 'sine', 0.1);
            break;
        case 'ding':
            playTone(1200, now, 0.25, 'triangle', 0.12);
            break;
        case 'softAlarm':
            playTone(700, now, 0.18, 'sine', 0.1);
            playTone(700, now + 0.22, 0.18, 'sine', 0.1);
            playTone(700, now + 0.44, 0.18, 'sine', 0.1);
            break;
        case 'popSound':
            playTone(420, now, 0.08, 'triangle', 0.1);
            playTone(220, now + 0.05, 0.08, 'triangle', 0.08);
            break;
        case 'clickSound':
            playTone(1800, now, 0.04, 'square', 0.08);
            break;
        default:
            playTone(1046, now, 0.22, 'sine', 0.1);
            break;
    }

    setTimeout(() => ctx.close(), 1500);
}

function playNotificationSound() {
    playSessionEndSound();
}

function initializeHabitReminderSystem() {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
    }
    if (habitReminderInterval) clearInterval(habitReminderInterval);
    checkHabitReminders();
    habitReminderInterval = setInterval(checkHabitReminders, 60000);
}

function checkHabitReminders() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${hh}:${mm}`;
    const todayStr = getLocalDateStr(now);
    const day = now.getDay();
    const dueHabits = habits.filter(h => {
        if (!h.reminderTime || h.reminderTime !== currentTime) return false;
        const days = h.customDays || [0,1,2,3,4,5,6];
        return days.includes(day);
    });
    if (!dueHabits.length) return;
    const key = `${todayStr}-${currentTime}`;
    if (lastHabitReminderKey === key) return;
    lastHabitReminderKey = key;
    playNotificationSound();
    dueHabits.forEach(habit => {
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification(`Time for ${habit.name}!`);
        }
    });

    const dueTasks = tasks.filter(task => {
        if (!task.reminderTime || task.reminderTime !== currentTime) return false;
        if (task.completed || task.skipped) return false;
        if (!task.dueDate) return true;
        return task.dueDate === todayStr;
    });
    if (dueTasks.length) {
        const taskKey = `task-${todayStr}-${currentTime}`;
        if (lastTaskReminderKey !== taskKey) {
            lastTaskReminderKey = taskKey;
            playNotificationSound();
            dueTasks.forEach(task => {
                if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                    new Notification(`Reminder: ${task.text || task.title || 'Task'}`);
                }
            });
        }
    }
}
let sessionMinimized = false;

function toggleActiveSessionMinimize() {
    sessionMinimized = !sessionMinimized;
    const view = document.getElementById('activeSessionView');
    const content = document.getElementById('activeSessionContent');
    const btn = document.getElementById('sessionMinimizeBtn');
    
    if (sessionMinimized) {
        // Minimized state
        content.style.display = 'none';
        view.style.width = 'auto';
        view.style.maxHeight = 'none';
        view.style.padding = '10px 14px';
        btn.textContent = '▲';
        btn.title = 'Maximize';
    } else {
        // Maximized state
        content.style.display = 'block';
        view.style.width = 'min(420px, calc(100vw - 40px))';
        view.style.maxHeight = '70vh';
        view.style.padding = '14px';
        btn.textContent = '▼';
        btn.title = 'Minimize';
    }
}

        function renderActiveSessionView() {
    const container = document.getElementById('activeSessionView');
    const projectEl = document.getElementById('activeSessionProjectName');
    const notesEl = document.getElementById('activeSessionNotes');
    if (!container || !projectEl || !notesEl) return;

    if (!activeSession) {
        container.style.display = 'none';
        document.body.classList.remove('session-active');
        const popup = document.getElementById('sessionEndPopup');
        if (popup) popup.classList.remove('active');
        return;
    }

    document.body.classList.add('session-active');
    container.style.display = 'block';
    projectEl.textContent = activeSession.projectName;
    const blockEl = document.getElementById('activeSessionScheduledBlock');
    if (blockEl) {
        if (activeSession._scheduledBlock) { blockEl.textContent = '📅 ' + activeSession._scheduledBlock; blockEl.style.display = ''; }
        else blockEl.style.display = 'none';
    }
    const msgEl = document.getElementById('activeSessionMotivationalMsg');
    if (msgEl) {
        if (activeSession._focusMsg) { msgEl.textContent = '"' + activeSession._focusMsg + '"'; msgEl.style.display = ''; }
        else msgEl.style.display = 'none';
    }
    const mobileHandleName = document.getElementById('mobileHandleName');
    if (mobileHandleName) mobileHandleName.textContent = activeSession.projectName;
    const buddyEl = document.getElementById('activeSessionBuddy');
    if (buddyEl) {
        const d = activeSession.duration;
        const img = d === 0 ? 'marathon' : d <= 30 ? 'sprint' : d <= 60 ? 'focus' : 'deep';
        buddyEl.src = `public/assets/focus-buddy/${img}.png`;
        buddyEl.onerror = () => { buddyEl.style.display = 'none'; };
        buddyEl.alt = img;
    }
    const project = projects.find(p => p.id === activeSession.projectId);
    const toolsEl = document.getElementById('activeSessionTools');
    if (toolsEl && project && (project.tools || []).length > 0) {
        toolsEl.innerHTML = project.tools.map(tid => { const t = tools.find(x => x.id === tid); return t ? '<span style="padding:2px 8px; background:var(--bg-tertiary); border-radius:12px; font-size:11px;">' + t.icon + ' ' + escapeHtml(t.name) + '</span>' : ''; }).join('');
    } else if (toolsEl) { toolsEl.innerHTML = ''; }
    notesEl.value = activeSession.notes || '';
    if (!Array.isArray(activeSession.activeTasks)) activeSession.activeTasks = [];
    if (activeSession.stopwatch) {
        updateActiveSessionTimerDisplay(Date.now() - activeSession.startTime, true);
    } else {
        updateActiveSessionTimerDisplay(activeSession.endTime - Date.now());
    }
}

        function showSessionEndPopup() {
    if (!activeSession) return;
    const popup = document.getElementById('sessionEndPopup');
    const projectEl = document.getElementById('sessionEndProjectName');
    const durationEl = document.getElementById('sessionEndDuration');
    const tasksEl = document.getElementById('sessionEndTasksCount');
    const notesEl = document.getElementById('sessionEndNotesInput');

    const actualMs = Math.max(0, Date.now() - activeSession.startTime);
    const minutes = Math.floor(actualMs / 60000);
    const seconds = Math.floor((actualMs % 60000) / 1000);

    if (projectEl) projectEl.textContent = activeSession.projectName || '-';
    if (durationEl) durationEl.textContent = `${minutes}m ${String(seconds).padStart(2, '0')}s`;
    if (tasksEl) tasksEl.textContent = String((activeSession.tasksCompleted || []).length);
    if (notesEl) notesEl.value = activeSession.notes || '';

    playSessionEndSound();
    if (window.sessionAlarmInterval) clearInterval(window.sessionAlarmInterval);
    window.sessionAlarmInterval = setInterval(playSessionEndSound, 4000);
    // Populate tools — pre-select project tools
    const project = projects.find(p => p.id === activeSession.projectId);
    sessionSelectedToolIds = new Set((project?.tools || []).filter(id => tools.find(t => t.id === id)));
    renderSessionEndTools();

    if (popup) popup.classList.add('active');
}

        function closeSessionEndPopup() {
    if (window.sessionAlarmInterval) {
        clearInterval(window.sessionAlarmInterval);
        window.sessionAlarmInterval = null;
    }
    const popup = document.getElementById('sessionEndPopup');
    if (popup) popup.classList.remove('active');
}

        function finalizeActiveSession({ completed, interrupted, endNow, saveNotesAndRewards }) {
    if (!activeSession) return;
    const now = Date.now();
    const notesInput = document.getElementById('sessionEndNotesInput');
    const finalNotes = notesInput ? notesInput.value.trim() : (activeSession.notes || '');

    if (saveNotesAndRewards) {
        activeSession.notes = finalNotes;
        if (finalNotes) {
            const project = projects.find(p => p.id === activeSession.projectId);
            if (project) {
                if (!Array.isArray(project.sessionHistory)) project.sessionHistory = [];
                project.sessionHistory.push({
                    sessionId: activeSession.id,
                    date: activeSession.date,
                    createdAt: now,
                    duration: Math.max(0, Math.round((now - activeSession.startTime) / 60000)),
                    notes: finalNotes
                });
                saveProjects();
            }
        }

        if (settings.gamificationEnabled) {
            const rewardDate = activeSession.date || getLocalDateStr(new Date());
            const rewardTaskId = `session_${activeSession.id}`;
            if (!taskLogs[rewardTaskId]) taskLogs[rewardTaskId] = {};
            taskLogs[rewardTaskId][rewardDate] = {
                completed: true,
                points: settings.scoring?.sessions?.completionPoints || 5
            };
            saveTaskLogs();
        }
    }

    activeSession.toolsUsed = Array.from(sessionSelectedToolIds);
    activeSession.distractionFree = !!document.getElementById('sessionToggleDistractionFree')?.checked;
    activeSession.phoneAway = !!document.getElementById('sessionTogglePhoneAway')?.checked;
    activeSession.deepFocus = !!document.getElementById('sessionToggleDeepFocus')?.checked;
    activeSession.completedIntent = !!document.getElementById('sessionToggleCompletedIntent')?.checked;
    activeSession.completed = completed;
    activeSession.interrupted = interrupted;
    if (endNow) {
        activeSession.endTime = now;
    }
    saveSessionLogs();
    if (sessionTimerInterval) {
        clearInterval(sessionTimerInterval);
        sessionTimerInterval = null;
    }
    activeSession = null;
    closeSessionEndPopup();
    renderActiveSessionView();
    switchTab('today');
    renderTodayView();
    if (settings.gamificationEnabled) {
        calculateScores();
        renderSessionAnalytics();
    }
}

        function completeSessionManually() {
    pendingSessionEndMode = 'complete';
    showSessionEndPopup();
}

        function endSessionEarly() {
    pendingSessionEndMode = 'early';
    showSessionEndPopup();
}

        function saveAndCloseSessionEnd() {
    closeSessionEndPopup();
    document.getElementById('focusRatingModal').classList.add('active');
}

        function selectFocusRating(multiplier) {
    document.getElementById('focusRatingModal').classList.remove('active');
    if (!activeSession) return;

    const endTime = Date.now();
    const workedMin = Math.round((endTime - activeSession.startTime) / 60000);
    const xp = Math.round(workedMin * 0.25 * multiplier * 10) / 10;

    activeSession.xpMultiplier = multiplier;
    activeSession.focusQuality = multiplier;

    finalizeActiveSession({
        completed: pendingSessionEndMode !== 'early',
        interrupted: pendingSessionEndMode === 'early',
        endNow: true,
        saveNotesAndRewards: true
    });

    showXpGainPopup(xp);
}

        function showXpGainPopup(xp) {
    const el = document.getElementById('xpGainPopup');
    if (!el) return;
    el.textContent = `+${xp.toFixed(1)} XP`;
    el.classList.remove('show');
    void el.offsetWidth; // force reflow to restart animation
    el.classList.add('show');
    refreshTotalXPDisplay();
}

        function discardSessionEnd() {
    if (!activeSession) return;
    // Remove the session entirely — it was pushed to sessionLogs on start
    sessionLogs = sessionLogs.filter(s => s.id !== activeSession.id);
    saveSessionLogs();
    if (sessionTimerInterval) {
        clearInterval(sessionTimerInterval);
        sessionTimerInterval = null;
    }
    activeSession = null;
    closeSessionEndPopup();
    renderActiveSessionView();
    switchTab('today');
    renderTodayView();
    if (settings.gamificationEnabled) {
        calculateScores();
        renderSessionAnalytics();
    }
}

        function toggleTaskFromActiveSession(taskId, checked) {
    if (!activeSession) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const today = getLocalDateStr(new Date(), true);
    if (!taskLogs[taskId]) taskLogs[taskId] = {};

    if (checked) {
        task.completed = true;
        if (!activeSession.tasksCompleted.includes(taskId)) {
            activeSession.tasksCompleted.push(taskId);
        }
        taskLogs[taskId][today] = {
            completed: true,
            points: settings.scoring?.bonus?.taskPoints || 2
        };
    } else {
        task.completed = false;
        activeSession.tasksCompleted = activeSession.tasksCompleted.filter(id => id !== taskId);
        if (taskLogs[taskId] && taskLogs[taskId][today]) {
            delete taskLogs[taskId][today];
        }
    }

    saveTasks();
    saveTaskLogs();
    saveSessionLogs();
    renderTasks();
    renderTodayView();
}

        function updateActiveSessionNotes() {
    if (!activeSession) return;
    const notesEl = document.getElementById('activeSessionNotes');
    if (!notesEl) return;
    activeSession.notes = notesEl.value;
    saveSessionLogs();
}

        function toggleTheme() {
            settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
            saveSettings();
            applySettings();
        }

        function toggleHelpMenu(e) {
            e.stopPropagation();
            document.getElementById('helpMenuDropdown').classList.toggle('open');
        }
        function closeHelpMenu() {
            document.getElementById('helpMenuDropdown').classList.remove('open');
        }
        document.addEventListener('click', function(e) {
            const wrap = document.getElementById('helpMenuWrap');
            if (wrap && !wrap.contains(e.target)) closeHelpMenu();
            // Close any open project ⋮ menus when clicking outside
            if (!e.target.closest('[id^="proj-menu-"]') && !e.target.closest('button[onclick^="toggleProjectMenu"]')) {
                closeAllProjectMenus();
            }
        });

        document.addEventListener('click', function(e) {
            const view = document.getElementById('activeSessionView');
            if (!view || view.style.display === 'none') return;
            if (view.contains(e.target)) return;
            if (window.innerWidth <= 768) {
                if (view.classList.contains('mobile-expanded')) {
                    view.classList.remove('mobile-expanded');
                }
            } else {
                if (!sessionMinimized) {
                    toggleActiveSessionMinimize();
                }
            }
        });

        // ========================================
        // TAB SYSTEM WITH DRAG & DROP
        // ========================================
        
        function renderTabs() {
            const container = document.getElementById('navContainer');
            container.innerHTML = tabOrder.map((key, i) => {
                const tab = tabDefs[key];
                const hidden = key === 'scoring' && !settings.gamificationEnabled ? 'style="display: none;"' : '';
                return `<div class="sidebar-item ${i === 0 ? 'active' : ''}" data-tab="${key}" draggable="true" ${hidden}><span class="sidebar-icon">${tab.icon}</span><span class="sidebar-label">${tab.label}</span></div>`;
            }).join('');

            document.querySelectorAll('.sidebar-item').forEach(tab => {
                tab.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('dragging')) {
                        switchTab(tab.dataset.tab);
                    }
                });
            });
        }

        function setupDragAndDrop() {
            const container = document.getElementById('navContainer');
            let draggedElement = null;

            container.addEventListener('dragstart', (e) => {
                if (e.target.classList.contains('sidebar-item')) {
                    draggedElement = e.target;
                    e.target.classList.add('dragging');
                }
            });

            container.addEventListener('dragend', (e) => {
                if (e.target.classList.contains('sidebar-item')) {
                    e.target.classList.remove('dragging');
                    draggedElement = null;
                }
            });

            container.addEventListener('dragover', (e) => {
                e.preventDefault();
                const afterElement = getDragAfterElement(container, e.clientY);
                if (afterElement == null) {
                    container.appendChild(draggedElement);
                } else {
                    container.insertBefore(draggedElement, afterElement);
                }
            });

            container.addEventListener('drop', (e) => {
                e.preventDefault();
                const newOrder = Array.from(container.querySelectorAll('.sidebar-item')).map(tab => tab.dataset.tab);
                tabOrder = newOrder;
                saveTabOrder();
            });
        }

        function getDragAfterElement(container, y) {
            const draggableElements = [...container.querySelectorAll('.sidebar-item:not(.dragging)')];
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }

        function switchTab(key) {
            document.querySelectorAll('.sidebar-item').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.querySelectorAll('.mobile-nav-item').forEach(t => t.classList.remove('active'));

            const tabEl = document.querySelector(`.sidebar-item[data-tab="${key}"]`);
            if (!tabDefs[key]) return;
            if (tabEl) tabEl.classList.add('active');
            document.getElementById(tabDefs[key].id).classList.add('active');
            const mobileNavEl = document.querySelector(`#mobileBottomNav .mobile-nav-item[data-tab="${key}"]`);
            if (mobileNavEl) mobileNavEl.classList.add('active');
            localStorage.setItem('lifescore_current_tab_v4', key);
            
         if (key === 'today') renderTodayView();
if (key === 'projects') { renderProjectsTab(); renderTasks(); currentNoteLabel = null; renderNotes(); applyProjectSectionStates(); }
if (key === 'habits') { currentWeekOffset = 0; renderHabitLog(); }
if (key === 'scoring') {
    const datePicker = document.getElementById('scoreDatePicker');
    if (datePicker) {
        datePicker.value = getLocalDateStr(new Date(), true);
        datePicker.onchange = calculateScores;
    }
    setTimeout(() => {
        _projProgressWeekOffset = 0;
        renderWeeklyProjectProgress();
        calculateScores();
        updateChart();
        renderSessionAnalytics();
        renderHabitWeekChart();
        renderAdherenceAnalytics();
    }, 50);
}
if (key === 'island') {
    setTimeout(() => renderIslandTab(), 30);
}
        }

        // ========================================
        // TODAY VIEW
        // ========================================

       function getHabitLogState(log) {
    if (!log) return 'blank';
    if (log.state) return log.state;
    if (log.completed === true) return 'done';
    if (log.completed === false && (log.value || 0) === 0) return 'failed';
    return 'blank';
}

function setHabitLogState(habitId, dateStr, state, value = null) {
    if (!habitLogs[habitId]) habitLogs[habitId] = {};
    const normalized = state === 'done' ? 'done' : state === 'failed' ? 'failed' : state === 'skipped' ? 'skipped' : 'blank';
    const habit = habits.find(h => String(h.id) === String(habitId));
    const isMeasurable = Boolean(habit?.measurable);
    const resolvedValue = value !== null ? value : normalized === 'done' ? 1 : 0;
    habitLogs[habitId][dateStr] = {
        state: normalized,
        completed: normalized === 'done',
        value: isMeasurable ? resolvedValue : (normalized === 'done' ? 1 : 0),
        timestamp: new Date().toISOString()
    };
}

function habitReminderToMinutes(timeStr) {
    if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return Number.POSITIVE_INFINITY;
    const [hh, mm] = timeStr.split(':').map(Number);
    return (hh * 60) + mm;
}

function formatReminderTime(timeStr) {
    return /^\d{2}:\d{2}$/.test(timeStr || '') ? timeStr : null;
}

function getHabitCardState(habit, dateStr, todayDateObj) {
    const log = habitLogs[habit.id]?.[dateStr];
    const state = getHabitLogState(log);
    const today = todayDateObj || new Date();
    const startDate = new Date(`${habit.startTrackingDate || dateStr}T00:00:00`);
    const isPastTrackableDay = new Date(`${dateStr}T00:00:00`) >= startDate && new Date(`${dateStr}T00:00:00`) < new Date(today.toISOString().split('T')[0] + 'T00:00:00');
    const overdue = state === 'blank' && isPastTrackableDay;
    return { state, overdue };
}

function getHabitDisplayGroups(todayHabits) {
    const groups = { Morning: [], Afternoon: [], Evening: [], 'No time': [] };
    todayHabits.forEach(habit => {
        if (!habit.reminderTime) {
            groups['No time'].push(habit);
            return;
        }
        const minutes = habitReminderToMinutes(habit.reminderTime);
        if (minutes < 12 * 60) groups.Morning.push(habit);
        else if (minutes < 17 * 60) groups.Afternoon.push(habit);
        else groups.Evening.push(habit);
    });
    return groups;
}

function setTodayViewMode(mode) {
    todayViewMode = mode === 'calendar' ? 'calendar' : 'list';
    localStorage.setItem('lifescore_today_view_mode_v4', todayViewMode);
    renderTodayView();
}

function renderTodayCalendarView() {
    const grid = document.getElementById('todayCalendarGrid');
    if (!grid) return;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const firstDow = start.getDay();
    const days = [];
    for (let i = 0; i < firstDow; i++) days.push(null);
    for (let d = 1; d <= end.getDate(); d++) days.push(new Date(now.getFullYear(), now.getMonth(), d));
    grid.innerHTML = days.map(day => {
        if (!day) return '<div></div>';
        const ds = getLocalDateStr(day);
        const sessionsDone = getTodaysSessions(ds).filter(s => s.completed && !s.interrupted).length;
        const dayHabits = habits.filter(h => (h.customDays || [0,1,2,3,4,5,6]).includes(day.getDay()));
        const doneHabits = dayHabits.filter(h => getHabitLogState(habitLogs[h.id]?.[ds]) === 'done').length;
        const habitPct = dayHabits.length ? Math.round((doneHabits / dayHabits.length) * 100) : 0;
        const score = Math.floor(calculateDayScore(ds));
        const isToday = ds === getLocalDateStr(new Date(), true);
        return `<div onclick="showTodayCalendarDayDetail('${ds}')" style="padding:8px; border:1px solid ${isToday ? 'var(--accent-color)' : 'var(--border-color)'}; border-radius:8px; background:var(--bg-secondary); cursor:pointer;">
            <div style="font-weight:700; margin-bottom:4px;">${day.getDate()}</div>
            <div style="font-size:11px; color:var(--text-secondary);">🎯 ${sessionsDone}</div>
            <div style="font-size:11px; color:var(--text-secondary);">⭕ ${habitPct}%</div>
            <div style="font-size:11px; color:var(--text-secondary);">⭐ ${score}</div>
        </div>`;
    }).join('');
    showTodayCalendarDayDetail(getLocalDateStr(new Date(), true));
}

function showTodayCalendarDayDetail(dateStr) {
    const detail = document.getElementById('todayCalendarDayDetail');
    if (!detail) return;
    const dayDate = new Date(dateStr + 'T12:00:00');
    const daySessions = getTodaysSessions(dateStr).filter(s => s.completed && !s.interrupted).length;
    const dayHabits = habits.filter(h => (h.customDays || [0,1,2,3,4,5,6]).includes(dayDate.getDay()));
    const doneHabits = dayHabits.filter(h => getHabitLogState(habitLogs[h.id]?.[dateStr]) === 'done').length;
    const habitPct = dayHabits.length ? Math.round((doneHabits / dayHabits.length) * 100) : 0;
    detail.innerHTML = `<strong>${dayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</strong><br>Sessions completed: ${daySessions}<br>Habit completion: ${habitPct}%<br>XP: ${calculateDayScore(dateStr).toFixed(1)}`;
}

function getWeekBoundary() {
    const now = new Date();
    const startDay = settings.weekStartsOn !== undefined ? settings.weekStartsOn : 1;
    const currentDay = now.getDay();
    const diff = (currentDay - startDay + 7) % 7;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - diff);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return { weekStart, weekEnd };
}

function getWeekBoundaryWithOffset(offset) {
    const d = new Date();
    d.setDate(d.getDate() + offset * 7);
    d.setHours(0, 0, 0, 0);
    const mon = new Date(d);
    mon.setDate(d.getDate() - (d.getDay() + 6) % 7);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    sun.setHours(23, 59, 59, 999);
    return { weekStart: mon, weekEnd: sun };
}

function getWeeklyHoursPerProject() {
    const { weekStart } = getWeekBoundary();
    const weekStartTs = weekStart.getTime();

    const hoursMap = {};
    sessionLogs.forEach(s => {
        if (!s.completed || s.startTime < weekStartTs) return;
        const hrs = (s.endTime - s.startTime) / 3600000;
        hoursMap[s.projectId] = (hoursMap[s.projectId] || 0) + hrs;
    });
    return hoursMap;
}

function renderWeeklyProjectProgress() {
    const el = document.getElementById('weeklyProjectProgress');
    if (!el) return;

    const targetProjects = projects.filter(p => p.weeklyTargetHours > 0);
    if (targetProjects.length === 0) {
        el.style.display = 'none';
        return;
    }
    el.style.display = 'block';

    const { weekStart, weekEnd } = getWeekBoundaryWithOffset(_projProgressWeekOffset);
    const weekStartTs = weekStart.getTime();
    const weekEndTs = weekEnd.getTime();

    const hoursMap = {};
    sessionLogs.forEach(s => {
        if (!s.completed || !s.startTime) return;
        if (s.startTime < weekStartTs || s.startTime > weekEndTs) return;
        const hrs = (s.endTime - s.startTime) / 3600000;
        hoursMap[s.projectId] = (hoursMap[s.projectId] || 0) + hrs;
    });

    const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const weekLabel = `${fmt(weekStart)} – ${fmt(weekEnd)}, ${weekEnd.getFullYear()}`;
    const isCurrentWeek = _projProgressWeekOffset >= 0;

    let totalLogged = 0, totalTarget = 0;

    const rows = targetProjects.map(p => {
        const logged = hoursMap[p.id] || 0;
        const target = p.weeklyTargetHours;
        const pct = target > 0 ? Math.min(Math.round((logged / target) * 100), 999) : 0;
        const barPct = target > 0 ? Math.min((logged / target) * 100, 100) : 0;
        const color = pct >= 80 ? '#16a34a' : pct >= 40 ? '#d97706' : '#dc2626';
        const loggedStr = logged.toFixed(1);
        const targetStr = target % 1 === 0 ? String(target) : target.toFixed(1);
        totalLogged += logged;
        totalTarget += target;
        return `<div style="margin-bottom:14px;">
            <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px;">
                <span style="font-size:13px;font-weight:600;">${escapeHtml(p.name)}</span>
                <span style="font-size:12px;color:var(--text-secondary);">${loggedStr}h / ${targetStr}h &nbsp;<b style="color:${color};">${pct}%</b></span>
            </div>
            <div style="background:var(--bg-tertiary);border-radius:6px;height:10px;overflow:hidden;border:1px solid var(--border-color);">
                <div style="height:100%;width:${barPct.toFixed(1)}%;background:${color};border-radius:6px;transition:width 0.4s;min-width:${pct > 0 ? '4px' : '0'};"></div>
            </div>
        </div>`;
    }).join('');

    const totalPct = totalTarget > 0 ? Math.min(Math.round((totalLogged / totalTarget) * 100), 999) : 0;
    const totalColor = totalPct >= 80 ? '#16a34a' : totalPct >= 40 ? '#d97706' : '#dc2626';
    const totalTargetStr = totalTarget % 1 === 0 ? String(totalTarget) : totalTarget.toFixed(1);

    el.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:6px;">
            <span style="font-weight:700;font-size:15px;">📊 Project Hours Progress</span>
            <div style="display:flex;gap:6px;align-items:center;">
                <button class="btn-secondary" style="padding:4px 12px;font-size:15px;line-height:1;" onclick="_projProgressWeekOffset--;renderWeeklyProjectProgress()">‹</button>
                <span style="font-size:12px;color:var(--text-secondary);white-space:nowrap;">${weekLabel}</span>
                <button class="btn-secondary" style="padding:4px 12px;font-size:15px;line-height:1;" onclick="if(_projProgressWeekOffset<0){_projProgressWeekOffset++;renderWeeklyProjectProgress();}" ${isCurrentWeek ? 'disabled style="opacity:0.4;cursor:default;"' : ''}>›</button>
            </div>
        </div>
        ${rows}
        <div style="padding-top:10px;border-top:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px;">
            <span style="font-size:13px;font-weight:600;color:var(--text-primary);">Total</span>
            <span style="font-size:13px;color:var(--text-secondary);">${totalLogged.toFixed(1)}h / ${totalTargetStr}h this week &nbsp;<b style="color:${totalColor};">${totalPct}%</b></span>
        </div>`;
}

       function renderTodayView() {
    const today = new Date();
    const dateStr = getLocalDateStr(today, true);
    const listView = document.getElementById('todayListView');
    const calendarView = document.getElementById('todayCalendarView');
    const listBtn = document.getElementById('todayListViewBtn');
    const calBtn = document.getElementById('todayCalendarViewBtn');
    if (listView) listView.style.display = todayViewMode === 'calendar' ? 'none' : 'block';
    if (calendarView) calendarView.style.display = todayViewMode === 'calendar' ? 'block' : 'none';
    if (listBtn) listBtn.style.background = todayViewMode === 'list' ? 'var(--accent-color)' : 'var(--bg-tertiary)';
    if (listBtn) listBtn.style.color = todayViewMode === 'list' ? '#fff' : 'var(--text-primary)';
    if (calBtn) calBtn.style.background = todayViewMode === 'calendar' ? 'var(--accent-color)' : 'var(--bg-tertiary)';
    if (calBtn) calBtn.style.color = todayViewMode === 'calendar' ? '#fff' : 'var(--text-primary)';
    if (todayViewMode === 'calendar') {
        renderTodayCalendarView();
        return;
    }
            
            const displayDate = new Date(dateStr + 'T12:00:00');
            document.getElementById('todayDate').textContent = displayDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });

            const todayTarget = getTodaySessionTarget(dateStr, displayDate);

            const todaysSessions = getTodaysSessions(dateStr);
            const completedSessions = todaysSessions.filter(session => session.completed && !session.interrupted);

            const plannedEl = document.getElementById('todayPlannedSessions');
            const completedEl = document.getElementById('todayCompletedSessions');
            const totalWorkedMin = completedSessions.reduce((sum, s) => sum + Math.round((s.endTime - s.startTime) / 60000), 0);
            const creditHours = (totalWorkedMin / 60).toFixed(1);
            if (plannedEl) plannedEl.textContent = todayTarget;
            if (completedEl) completedEl.textContent = `${creditHours}h`;
            const sessionCountEl = document.getElementById('todaySessionCount');
            if (sessionCountEl) sessionCountEl.textContent = completedSessions.length;

            renderActiveSessionView();
            
            // Habits in habits-page order (preserve array order, filter by today's day)
            const todayHabits = habits.filter(h => {
                const habitDays = h.customDays || [0,1,2,3,4,5,6];
                return habitDays.includes(displayDate.getDay());
            }).map(h => {
                const stateInfo = getHabitCardState(h, dateStr, displayDate);
                return { ...h, stateInfo };
            }).sort((a, b) => {
                const isDoneToday = h => {
                    const log = habitLogs[h.id]?.[dateStr];
                    const state = getHabitLogState(log);
                    if (state === 'done' || state === 'failed' || state === 'skipped') return true;
                    if ((h.period === 'weekly' || h.period === 'monthly') && (log?.value || 0) > 0) return true;
                    return false;
                };
                return (isDoneToday(a) ? 1 : 0) - (isDoneToday(b) ? 1 : 0);
            });

            document.getElementById('todayHabitsCount').textContent = `${todayHabits.length} habit${todayHabits.length !== 1 ? 's' : ''}`;

            renderTodayTimeline(todayHabits, dateStr, displayDate, creditHours, completedSessions.length);

            const todayXP = getTodayXP(dateStr);
            const xpEl = document.getElementById('todayXpDisplay');
            if (xpEl) xpEl.textContent = todayXP.toFixed(1);
            const focusXpEl = document.getElementById('todayFocusXp');
            if (focusXpEl) focusXpEl.textContent = todayXP.toFixed(1);
            refreshTotalXPDisplay();
        }

        function renderTodayHabit(habit, dateStr) {
            const log = habitLogs[habit.id]?.[dateStr];
            const state = getHabitLogState(log);

            // For weekly measurable habits use the full week total, not today's value
            let value;
            if (habit.period === 'weekly' && habit.measurable) {
                const { weekStart } = getWeekBoundary();
                value = 0;
                for (let d = new Date(weekStart); d.getTime() <= Date.now(); d.setDate(d.getDate() + 1)) {
                    value += habitLogs[habit.id]?.[getLocalDateStr(d, false)]?.value || 0;
                }
            } else {
                value = log?.value || 0;
            }
            const difficultyXP = getHabitXP(habit);
            const diffLabel = (habit.difficulty || 'medium').toLowerCase();
            const diffDisplay = diffLabel[0].toUpperCase() + diffLabel.slice(1);

            const stateClass = state === 'done' ? 'today-habit-tile--done' : state === 'failed' ? 'today-habit-tile--failed' : state === 'skipped' ? 'today-habit-tile--skipped' : '';
            const diffClass  = `today-habit-tile--${diffLabel}`;
            const dotClass   = state === 'done' ? 'state-done' : state === 'failed' ? 'state-failed' : state === 'skipped' ? 'state-skipped' : '';
            const dotIcon    = state === 'done' ? '✓' : state === 'failed' ? '✗' : state === 'skipped' ? '—' : '';

            let progressHtml = '';
            if (habit.measurable) {
                const pct = habit.target_value > 0 ? Math.min(100, Math.round((value / habit.target_value) * 100)) : 0;
                progressHtml = `
                    <div class="today-habit-tile-progress">
                        <div class="today-habit-tile-progress-bar">
                            <div class="today-habit-tile-progress-fill" style="width:${pct}%"></div>
                        </div>
                        <div class="today-habit-tile-progress-label">${value} / ${habit.target_value} ${habit.unit || ''}</div>
                    </div>`;
            }

            const curStreak = getHabitStreak(habit.id);
            const streakBadge = curStreak >= 1 ? '<span class="habit-streak-badge">&#x1F525; ' + curStreak + '</span>' : '';
            return `
                <div class="today-habit-tile ${diffClass} ${stateClass}" onclick="openTodayHabitAction(${habit.id}, '${dateStr}')">
                    <div class="today-habit-tile-emoji">${habit.icon || '✅'}</div>
                    <div class="today-habit-tile-state ${dotClass}">${dotIcon}</div>
                    <div class="today-habit-tile-footer">
                        <div class="today-habit-tile-name">${escapeHtml(habit.name)}</div>
                        <div class="today-habit-tile-meta">${habit.reminderTime ? `<span class="time-chip-sm">${formatReminderTime(habit.reminderTime)}</span> ` : ''}${diffDisplay} · ${difficultyXP} XP ${streakBadge}</div>
                        ${progressHtml}
                    </div>
                </div>
            `;
        }


        function renderFocusTile(creditHours, sessionCount) {
            const sessionLabel = sessionCount === 1 ? '1 session' : `${sessionCount} sessions`;
            const hasSession = sessionCount > 0;
            return `
                <div class="today-habit-tile today-focus-tile" onclick="openStartSessionModal()">
                    <div class="today-habit-tile-emoji">&#x1F3AF;</div>
                    <div class="today-habit-tile-state ${hasSession ? 'state-done' : ''}">${hasSession ? sessionCount : ''}</div>
                    <div class="today-habit-tile-footer">
                        <div class="today-habit-tile-name">Focus Session</div>
                        <div class="today-habit-tile-meta">${creditHours}h today &middot; ${sessionLabel}</div>
                    </div>
                </div>
            `;
        }

        // ========================================
        // TODAY TIMELINE
        // ========================================
        const DAY_ABBRS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

        function renderTodayTimeline(todayHabits, dateStr, displayDate, creditHours, sessionCount) {
            const el = document.getElementById('todayTimeline');
            if (!el) return;

            const todayAbbr = DAY_ABBRS[displayDate.getDay()];
            const plan = getTodayPlan(dateStr);

            // Build scheduled session blocks from projects, applying week overrides
            const scheduledBlocks = [];
            const _weekKey = getISOWeekKey(new Date(dateStr + 'T12:00:00'));
            const _wkMoved = (weekOverrides[_weekKey] || {}).moved || [];
            projects.forEach(p => {
                (p.scheduledSessions || []).forEach((s, idx) => {
                    const ov = _wkMoved.find(m => m.projectId === p.id && m.originalDay === s.day && m.startTime === s.startTime && m.endTime === s.endTime);
                    const showDay = ov ? ov.targetDay : s.day;
                    if (showDay !== todayAbbr) return;
                    expandTo60MinBlocks(s.startTime, s.endTime).forEach((block, bi) => {
                        scheduledBlocks.push({ type: 'session', project: p, session: block, key: `s_${p.id}_${idx}_${bi}`, isMoved: !!ov, originalDay: s.day, sessStartTime: s.startTime, sessEndTime: s.endTime });
                    });
                });
            });

            // Add plan one-off sessions
            if (plan) {
                (plan.oneOffSessions || []).forEach((s, idx) => {
                    const p = projects.find(x => x.id === s.projectId);
                    if (p) {
                        expandTo60MinBlocks(s.startTime, s.endTime).forEach((block, bi) => {
                            scheduledBlocks.push({ type: 'session', project: p, session: block, key: `oneoff_${idx}_${bi}`, isOneOff: true });
                        });
                    }
                });
            }

            // Build habit items
            const habitItems = todayHabits.map(h => ({ type: 'habit', habit: h, key: `h_${h.id}`, time: h.reminderTime || null }));
            const sessionItems = scheduledBlocks.map(b => ({ ...b, time: b.session.startTime }));

            // All items with a time
            let scheduledItems = [...habitItems.filter(i => i.time), ...sessionItems];
            // Unscheduled habits
            let unscheduledItems = habitItems.filter(i => !i.time);

            // Apply plan order if present and matching today
            if (plan && plan.date === dateStr && plan.order && plan.order.length > 0) {
                const allItems = [...scheduledItems, ...unscheduledItems];
                const ordered = [];
                plan.order.forEach(k => {
                    const found = allItems.find(i => i.key === k);
                    if (found) ordered.push(found);
                });
                // Append anything not in the plan order
                allItems.forEach(i => { if (!plan.order.includes(i.key)) ordered.push(i); });
                scheduledItems = ordered.filter(i => i.time);
                unscheduledItems = ordered.filter(i => !i.time);
            } else {
                // Sort by time
                scheduledItems.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
            }

            // Separate active vs completed/skipped/failed items (habits AND sessions)
            function isItemActedOn(item) {
                if (item.type === 'habit') {
                    const log = habitLogs[item.habit.id]?.[dateStr];
                    const state = getHabitLogState(log);
                    return state === 'done' || state === 'skipped' || state === 'failed';
                }
                if (item.type === 'session') {
                    const s = item.session;
                    return sessionLogs.some(sl => {
                        if (!sl.completed || !sl.startTime) return false;
                        if (getLocalDateStr(new Date(sl.startTime), true) !== dateStr) return false;
                        const sStartMins = new Date(sl.startTime).getHours() * 60 + new Date(sl.startTime).getMinutes();
                        return sStartMins >= timeToMin(s.startTime) && sStartMins < timeToMin(s.endTime);
                    });
                }
                return false;
            }

            const activeScheduled = scheduledItems.filter(i => !isItemActedOn(i));
            const activeUnscheduled = unscheduledItems.filter(i => !isItemActedOn(i));

            // Enrich completed session items with their matching session log (for focusQuality display)
            function enrichCompleted(items) {
                return items.filter(i => isItemActedOn(i)).map(item => {
                    if (item.type !== 'session') return item;
                    const s = item.session;
                    const matchedLog = sessionLogs.find(sl => {
                        if (!sl.completed || !sl.startTime) return false;
                        if (getLocalDateStr(new Date(sl.startTime), true) !== dateStr) return false;
                        const sStartMins = new Date(sl.startTime).getHours() * 60 + new Date(sl.startTime).getMinutes();
                        return sStartMins >= timeToMin(s.startTime) && sStartMins < timeToMin(s.endTime);
                    });
                    return { ...item, _focusQuality: matchedLog?.focusQuality };
                });
            }
            const completedItems = [...enrichCompleted(scheduledItems), ...enrichCompleted(unscheduledItems)];

            // Compute break blocks for gaps within wake-sleep window
            const breakBlocks = [];
            const wakeT = settings.wakeTime;
            const sleepT = settings.sleepTime;
            if (wakeT && sleepT) {
                const wakeMin = timeToMin(wakeT);
                const sleepMin = timeToMin(sleepT);
                if (sleepMin > wakeMin) {
                    // Build occupied ranges from ALL timed scheduled items
                    const ranges = [];
                    scheduledItems.forEach(item => {
                        if (!item.time) return;
                        const startM = timeToMin(item.time);
                        let endM;
                        if (item.type === 'habit') endM = startM + (item.habit.duration || 30);
                        else if (item.type === 'session') endM = timeToMin(item.session.endTime);
                        else return;
                        if (startM >= sleepMin || endM <= wakeMin) return;
                        ranges.push([Math.max(startM, wakeMin), Math.min(endM, sleepMin)]);
                    });
                    // Sort and merge overlapping ranges
                    ranges.sort((a, b) => a[0] - b[0]);
                    const merged = [];
                    for (const [s, e] of ranges) {
                        if (!merged.length || s > merged[merged.length - 1][1]) merged.push([s, e]);
                        else merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], e);
                    }
                    // Find gaps between merged ranges within wake-sleep window
                    const MIN_BREAK_MIN = 15;
                    let cursor = wakeMin;
                    for (const [s, e] of merged) {
                        if (s > cursor && s - cursor >= MIN_BREAK_MIN) {
                            breakBlocks.push({ type: 'break', time: minToTime(cursor), endTime: minToTime(s), durationMin: s - cursor, key: `break_${cursor}` });
                        }
                        cursor = Math.max(cursor, e);
                        if (cursor >= sleepMin) break;
                    }
                    if (cursor < sleepMin && sleepMin - cursor >= MIN_BREAK_MIN) {
                        breakBlocks.push({ type: 'break', time: minToTime(cursor), endTime: minToTime(sleepMin), durationMin: sleepMin - cursor, key: `break_${cursor}` });
                    }
                }
            }

            // Merge break blocks into active scheduled section, sorted by time
            const scheduledWithBreaks = [...activeScheduled, ...breakBlocks]
                .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

            let html = '';

            // Active scheduled items (with breaks interleaved)
            scheduledWithBreaks.forEach(item => { html += renderTimelineItem(item, dateStr); });

            // Active unscheduled items (no section label — merged into the main flow)
            activeUnscheduled.forEach(item => { html += renderTimelineItem(item, dateStr); });

            // Completed section
            if (completedItems.length > 0) {
                html += `<div class="timeline-section-label timeline-section-completed">Completed</div>`;
                completedItems.forEach(item => { html += renderTimelineItem(item, dateStr); });
            }

            if (activeScheduled.length === 0 && activeUnscheduled.length === 0 && completedItems.length === 0) {
                html += '<div class="today-tile-empty" style="margin-top:16px;">No habits today!</div>';
            }

            el.innerHTML = html;
            initHabitSwipes(el);
            updateTimelineHighlights();
        }

        function renderTimelineItem(item, dateStr) {
            if (item.type === 'break') {
                const dur = item.durationMin >= 60
                    ? `${Math.floor(item.durationMin / 60)}h${item.durationMin % 60 ? ' ' + (item.durationMin % 60) + 'm' : ''}`
                    : `${item.durationMin}m`;
                return `<div class="timeline-item timeline-item--break" data-time="${item.time}">
                    <div class="timeline-time">${item.time}–${item.endTime}</div>
                    <div class="timeline-icon">☕</div>
                    <div class="timeline-body">
                        <div class="timeline-name">Free Time</div>
                        <div class="timeline-meta">${dur} · unscheduled</div>
                    </div>
                </div>`;
            }
            if (item.type === 'habit') {
                const habit = item.habit;
                const log = habitLogs[habit.id]?.[dateStr];
                const state = getHabitLogState(log);
                const stateClass = state === 'done' ? 'timeline-item--done' : state === 'failed' ? 'timeline-item--failed' : state === 'skipped' ? 'timeline-item--skipped' : '';
                const stateIcon = state === 'done' ? '✓' : state === 'failed' ? '✗' : state === 'skipped' ? '—' : '';
                const stateIconClass = state === 'done' ? 'state-done' : state === 'failed' ? 'state-failed' : state === 'skipped' ? 'state-skipped' : '';
                const diffLabel = (habit.difficulty || 'medium').toLowerCase();
                const diffDisplay = diffLabel[0].toUpperCase() + diffLabel.slice(1);
                const xp = getHabitXP(habit);
                const streak = getHabitStreak(habit.id);
                const streakHtml = streak >= 1 ? `<span class="habit-streak-badge">&#x1F525; ${streak}</span>` : '';
                const startTime = item.time || '';
                const endTime = (startTime && habit.duration) ? addMinutesToTime(startTime, habit.duration) : '';
                const timeDisplay = endTime ? `${startTime}–${endTime}` : startTime;
                return `<div class="timeline-item timeline-item--habit habit-swipe-row ${stateClass}" data-habit-id="${habit.id}" data-date="${dateStr}" data-measurable="${habit.measurable ? '1' : '0'}" data-time="${startTime}">
                    <div class="swipe-bg-right">✓ Done</div>
                    <div class="swipe-bg-left">
                        <div class="swipe-skip">— Skip</div>
                        <div class="swipe-fail">✗ No</div>
                    </div>
                    <div class="swipe-content" onclick="openTodayHabitAction(${habit.id}, '${dateStr}')">
                        <div class="timeline-time">${timeDisplay}</div>
                        <div class="timeline-icon">${habit.icon || '🎯'}</div>
                        <div class="timeline-body">
                            <div class="timeline-name">${escapeHtml(habit.name)}</div>
                            <div class="timeline-meta">${diffDisplay} · ${xp} XP ${streakHtml}${habit.duration ? ` · ${habit.duration}m` : ''}</div>
                        </div>
                        <div class="timeline-status ${stateIconClass}">${stateIcon}</div>
                    </div>
                </div>`;
            } else {
                // session block
                const p = item.project;
                const s = item.session;
                const origDay = item.originalDay || '';
                const sessStart = item.sessStartTime || s.startTime;
                const sessEnd = item.sessEndTime || s.endTime;
                const movedBadge = item.isMoved ? `<span class="session-moved-badge">↗ Moved</span>` : '';
                const focusSuffix = item._focusQuality != null ? ` · Focus: ${item._focusQuality}×` : '';
                const metaLabel = (item.isOneOff ? 'one-off' : (item.isMoved ? `moved from ${origDay}` : 'scheduled')) + focusSuffix;
                const moveBtn = item.isOneOff ? '' : `<button onclick="event.stopPropagation(); openMoveSessionPicker(${p.id},'${origDay || item.session.startTime}','${sessStart}','${sessEnd}')" style="background:none;border:none;font-size:11px;color:var(--accent-color);cursor:pointer;padding:0;white-space:nowrap;">→ Move</button>`;
                return `<div class="timeline-item timeline-item--session" style="cursor:default;" data-time="${s.startTime}" data-date="${dateStr}" data-project-id="${p.id}">
                    <div class="timeline-time">${s.startTime}–${s.endTime}</div>
                    <div class="timeline-icon" style="color:${p.color || 'var(--accent-color)'};">${p.icon || '📁'}</div>
                    <div class="timeline-body">
                        <div class="timeline-name">${escapeHtml(p.name)} ${movedBadge}</div>
                        <div class="timeline-meta">${metaLabel}</div>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;flex-shrink:0;">
                        <button class="btn-primary" onclick="event.stopPropagation(); startTimedSessionDirect(${p.id},'${s.startTime}','${s.endTime}')" style="padding:5px 12px; font-size:12px; white-space:nowrap; border-radius:20px;">Start</button>
                        <button onclick="event.stopPropagation(); openLogMissedModal(${p.id},'${s.startTime}','${s.endTime}')" style="background:none;border:none;font-size:11px;color:var(--text-secondary);cursor:pointer;padding:0;text-decoration:underline;white-space:nowrap;">Log Missed</button>
                        ${moveBtn}
                    </div>
                </div>`;
            }
        }

        function _applyTimeHighlight(el, timeStr, todayStr, isActedOn) {
            const dateStr = el.dataset.date;
            if (dateStr !== todayStr) { el.classList.remove('timeline-item--due-yellow', 'timeline-item--due-red'); return; }
            if (!timeStr || isActedOn) { el.classList.remove('timeline-item--due-yellow', 'timeline-item--due-red'); return; }
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const [h, m] = timeStr.split(':').map(Number);
            const diffMinutes = currentMinutes - (h * 60 + m);
            if (diffMinutes >= 0 && diffMinutes <= 15) {
                el.classList.add('timeline-item--due-yellow');
                el.classList.remove('timeline-item--due-red');
            } else if (diffMinutes > 15) {
                el.classList.add('timeline-item--due-red');
                el.classList.remove('timeline-item--due-yellow');
            } else {
                el.classList.remove('timeline-item--due-yellow', 'timeline-item--due-red');
            }
        }

        function updateTimelineHighlights() {
            const todayStr = getLocalDateStr(new Date(), true);
            document.querySelectorAll('.timeline-item--habit[data-time]').forEach(el => {
                const habitId = parseInt(el.dataset.habitId);
                const dateStr = el.dataset.date;
                const log = habitLogs[habitId]?.[dateStr];
                const state = getHabitLogState(log);
                const actedOn = state === 'done' || state === 'skipped' || state === 'failed';
                _applyTimeHighlight(el, el.dataset.time, todayStr, actedOn);
            });
            document.querySelectorAll('.timeline-item--session[data-time]').forEach(el => {
                const projectId = parseInt(el.dataset.projectId);
                const dateStr = el.dataset.date;
                const timeStr = el.dataset.time;
                // Consider "done" if: active session for this project, OR completed session today for this project overlapping this block
                const isActive = activeSession && activeSession.projectId === projectId;
                const hasCompleted = sessionLogs.some(s => {
                    if (!s.completed || !s.endTime) return false;
                    if (s.projectId !== projectId) return false;
                    if (getLocalDateStr(new Date(s.startTime), true) !== dateStr) return false;
                    const sStartMins = new Date(s.startTime).getHours() * 60 + new Date(s.startTime).getMinutes();
                    const [bh, bm] = timeStr.split(':').map(Number);
                    return Math.abs(sStartMins - (bh * 60 + bm)) <= 60;
                });
                _applyTimeHighlight(el, timeStr, todayStr, isActive || hasCompleted);
            });
        }

        function openStartSessionModalWithProject(projectId) {
            openStartSessionModal();
            setTimeout(() => {
                const sel = document.getElementById('sessionProjectSelect');
                if (sel) sel.value = projectId;
            }, 50);
        }

        const FOCUS_MESSAGES = [
            "Deep work = compound growth",
            "One hour of focus beats three of distraction",
            "Progress, not perfection",
            "Every session is a deposit into your future",
            "Distractions are detours. Stay on the path.",
            "The quality of your focus shapes the quality of your results"
        ];

        function startTimedSessionDirect(projectId, startTimeStr, endTimeStr) {
            if (activeSession) { alert('A session is already active. Please complete it first.'); return; }
            const project = projects.find(p => p.id === projectId);
            if (!project) return;
            const [sh, sm] = startTimeStr.split(':').map(Number);
            const [eh, em] = endTimeStr.split(':').map(Number);
            const durationMinutes = (eh * 60 + em) - (sh * 60 + sm);
            const start = Date.now();
            const end = start + durationMinutes * 60 * 1000;
            const dateStr = getLocalDateStr(new Date(start), true);
            const session = {
                id: start, date: dateStr,
                projectId: project.id, projectName: project.name,
                duration: durationMinutes,
                startTime: start, endTime: end, stopwatch: false,
                activeTasks: tasks.filter(t => t.project === projectId).map(t => t.id),
                tasksCompleted: [], notes: '',
                completed: false, interrupted: null,
                _scheduledBlock: `${startTimeStr}–${endTimeStr}`,
                _focusMsg: FOCUS_MESSAGES[Math.floor(Math.random() * FOCUS_MESSAGES.length)]
            };
            sessionLogs.push(session);
            saveSessionLogs();
            activeSession = session;
            switchTab('today');
            renderActiveSessionView();
            startSessionTimer();
        }

        function addMinutesToTime(timeStr, minutes) {
            const [h, m] = timeStr.split(':').map(Number);
            const total = h * 60 + m + minutes;
            return `${String(Math.floor(total / 60) % 24).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`;
        }
        function timeToMin(timeStr) {
            if (!timeStr) return 0;
            const [h, m] = timeStr.split(':').map(Number);
            return (h || 0) * 60 + (m || 0);
        }
        function minToTime(min) {
            const clamped = ((min % 1440) + 1440) % 1440;
            return `${String(Math.floor(clamped / 60)).padStart(2,'0')}:${String(clamped % 60).padStart(2,'0')}`;
        }

        // Returns "YYYY-Www" ISO week key for a given date
        function getISOWeekKey(date = new Date()) {
            const d = new Date(date); d.setHours(12, 0, 0, 0);
            d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
            const w1 = new Date(d.getFullYear(), 0, 4);
            const wn = 1 + Math.round(((d - w1) / 86400000 - 3 + (w1.getDay() + 6) % 7) / 7);
            return `${d.getFullYear()}-W${String(wn).padStart(2, '0')}`;
        }

        // Returns array of {abbr, date, dayNum, isToday, isPast} for Mon–Sun of the current week
        function getWeekDays(refDate = new Date()) {
            const d = new Date(refDate); d.setHours(0, 0, 0, 0);
            const mon = new Date(d);
            mon.setDate(d.getDate() - (d.getDay() + 6) % 7);
            const todayStr = getLocalDateStr(new Date(), true);
            return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((abbr, i) => {
                const day = new Date(mon); day.setDate(mon.getDate() + i);
                const dateStr = getLocalDateStr(day);
                return { abbr, date: dateStr, dayNum: day.getDate(), isToday: dateStr === todayStr, isPast: dateStr < todayStr };
            });
        }

        function saveWeekOverrides() {
            localStorage.setItem('lifescore_weekoverrides_v4', JSON.stringify(weekOverrides));
        }

        // Auto-skip habits for past days in the current week that were never acted on
        function autoSkipPastHabits() {
            const todayStr = getLocalDateStr(new Date(), true);
            const weekDays = getWeekDays(new Date());
            let changed = false;
            weekDays.forEach(({ date: dateStr }) => {
                if (dateStr >= todayStr) return;
                habits.forEach(h => {
                    if (h.period === 'weekly' || h.period === 'monthly') return;
                    const d = new Date(dateStr + 'T12:00:00');
                    const habitDays = h.customDays || [0,1,2,3,4,5,6];
                    if (!habitDays.includes(d.getDay())) return;
                    if (h.startTrackingDate && dateStr < h.startTrackingDate) return;
                    const log = habitLogs[h.id]?.[dateStr];
                    if (getHabitLogState(log) !== 'blank') return;
                    setHabitLogState(h.id, dateStr, 'skipped', 0);
                    changed = true;
                });
            });
            if (changed) saveHabitLogs();
        }

        // ---- Weekly Template ----
        function openWeeklyTemplate() {
            renderWeeklyTemplate();
            document.getElementById('weeklyTemplateModal').classList.add('active');
        }
        function closeWeeklyTemplate() {
            document.getElementById('weeklyTemplateModal').classList.remove('active');
        }
        function renderWeeklyTemplate() {
            const weekDays = getWeekDays(new Date());
            const weekKey = getISOWeekKey(new Date());
            const overrides = (weekOverrides[weekKey] || {}).moved || [];
            const dayJsMap = { Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6, Sun:0 };

            const html = weekDays.map(({ abbr, dayNum, isToday, isPast, date: dateStr }) => {
                const jsDay = dayJsMap[abbr];
                // Habits for this day
                const dayHabits = habits.filter(h => {
                    if (h.period === 'weekly' || h.period === 'monthly') return false;
                    return (h.customDays || [0,1,2,3,4,5,6]).includes(jsDay);
                }).sort((a, b) => (a.reminderTime || 'ZZ').localeCompare(b.reminderTime || 'ZZ'));
                // Sessions for this day (with overrides applied, split into 60-min blocks)
                const daySessions = [];
                projects.forEach(p => {
                    (p.scheduledSessions || []).forEach((s) => {
                        const ov = overrides.find(m => m.projectId === p.id && m.originalDay === s.day && m.startTime === s.startTime && m.endTime === s.endTime);
                        if (ov ? ov.targetDay !== abbr : s.day !== abbr) return;
                        expandTo60MinBlocks(s.startTime, s.endTime).forEach(block => {
                            daySessions.push({ project: p, block, isMoved: !!ov, originalDay: s.day, sessStart: s.startTime, sessEnd: s.endTime });
                        });
                    });
                });
                daySessions.sort((a, b) => (a.block.startTime || '').localeCompare(b.block.startTime || ''));

                // Build unified item list with a sort key ('ZZ' for no-time items so they sink to bottom)
                const allItems = [];
                dayHabits.forEach(h => {
                    const log = habitLogs[h.id]?.[dateStr];
                    const state = getHabitLogState(log);
                    const si = state === 'done' ? '✓' : state === 'failed' ? '✗' : state === 'skipped' ? '—' : '';
                    const dim = (state === 'done' || state === 'skipped' || state === 'failed') ? 'opacity:0.55;' : '';
                    allItems.push({
                        sortKey: h.reminderTime || 'ZZ',
                        html: `<div class="wt-item wt-item--habit" style="${dim}">
                            <span>${h.icon || '🎯'}</span>
                            <span class="wt-name">${escapeHtml(h.name)}${si ? ` <b>${si}</b>` : ''}</span>
                            ${h.reminderTime ? `<span class="wt-time">${h.reminderTime}</span>` : ''}
                        </div>`
                    });
                });
                daySessions.forEach(({ project: p, block, isMoved, originalDay, sessStart, sessEnd }) => {
                    allItems.push({
                        sortKey: block.startTime,
                        html: `<div class="wt-item wt-item--session">
                            <span>${p.icon || '📁'}</span>
                            <span class="wt-name">${escapeHtml(p.name)}${isMoved ? ' <span class="wt-moved">↗</span>' : ''}</span>
                            <span class="wt-time">${block.startTime}–${block.endTime}</span>
                            <button class="wt-move-btn" onclick="openMoveSessionPicker(${p.id},'${originalDay}','${sessStart}','${sessEnd}')" title="Move">→</button>
                        </div>`
                    });
                });
                allItems.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

                const bodyHtml = allItems.length ? allItems.map(i => i.html).join('') : `<div class="wt-empty">Free</div>`;
                return `<div class="wt-col${isToday ? ' wt-today' : ''}${isPast ? ' wt-past' : ''}">
                    <div class="wt-header"><div class="wt-abbr">${abbr}</div><div class="wt-daynum">${dayNum}</div></div>
                    <div class="wt-body">${bodyHtml}</div>
                </div>`;
            }).join('');

            const el = document.getElementById('weeklyTemplateGrid');
            if (el) el.innerHTML = html;
        }

        // ---- Move Session Picker ----
        function openMoveSessionPicker(projectId, originalDay, startTime, endTime) {
            _movePickerSession = { projectId, originalDay, startTime, endTime };
            const weekKey = getISOWeekKey(new Date());
            const moved = (weekOverrides[weekKey] || {}).moved || [];
            // Find current effective day
            const existing = moved.find(m => m.projectId === projectId && m.originalDay === originalDay && m.startTime === startTime && m.endTime === endTime);
            const effectiveDay = existing ? existing.targetDay : originalDay;

            const weekDays = getWeekDays(new Date());
            const grid = document.getElementById('moveSessionDayGrid');
            if (!grid) return;
            grid.innerHTML = weekDays.map(({ abbr, dayNum, isToday }) => {
                const isCurrent = abbr === effectiveDay;
                return `<button class="move-day-btn${isCurrent ? ' move-day-current' : ''}${isToday ? ' move-day-today' : ''}" onclick="moveSessionToDay('${abbr}')">
                    <div style="font-weight:700;font-size:13px;">${abbr}</div>
                    <div style="font-size:11px;color:var(--text-secondary);">${dayNum}</div>
                </button>`;
            }).join('');
            document.getElementById('moveSessionPickerModal').classList.add('active');
        }
        function closeMoveSessionPicker() {
            document.getElementById('moveSessionPickerModal')?.classList.remove('active');
            _movePickerSession = null;
        }
        function moveSessionToDay(targetDay) {
            if (!_movePickerSession) return;
            const { projectId, originalDay, startTime, endTime } = _movePickerSession;
            const weekKey = getISOWeekKey(new Date());
            if (!weekOverrides[weekKey]) weekOverrides[weekKey] = { moved: [] };
            // Remove any existing override for this session
            weekOverrides[weekKey].moved = weekOverrides[weekKey].moved.filter(m =>
                !(m.projectId === projectId && m.originalDay === originalDay && m.startTime === startTime && m.endTime === endTime)
            );
            // Add new override (if not moving back to original)
            if (targetDay !== originalDay) {
                weekOverrides[weekKey].moved.push({ projectId, originalDay, targetDay, startTime, endTime });
            }
            saveWeekOverrides();
            closeMoveSessionPicker();
            renderTodayView();
            if (document.getElementById('weeklyTemplateModal')?.classList.contains('active')) renderWeeklyTemplate();
        }

        function expandTo60MinBlocks(startTime, endTime) {
            const blocks = [];
            let [sh, sm] = startTime.split(':').map(Number);
            const [eh, em] = endTime.split(':').map(Number);
            const endTotal = eh * 60 + em;
            while (sh * 60 + sm < endTotal) {
                const blockEnd = Math.min(sh * 60 + sm + 60, endTotal);
                const beh = Math.floor(blockEnd / 60);
                const bem = blockEnd % 60;
                blocks.push({
                    startTime: `${String(sh).padStart(2,'0')}:${String(sm).padStart(2,'0')}`,
                    endTime: `${String(beh).padStart(2,'0')}:${String(bem).padStart(2,'0')}`
                });
                sh = beh; sm = bem;
            }
            return blocks;
        }

        function _resetSwipe(content, callback) {
            if (!content) return;
            content.style.transition = 'transform 0.25s ease';
            content.style.transform = 'translateX(0)';
            if (callback) setTimeout(callback, 260);
        }

        function initHabitSwipes(container) {
            container.querySelectorAll('.habit-swipe-row').forEach(row => {
                const habitId = parseInt(row.dataset.habitId);
                const dateStr = row.dataset.date;
                const isMeasurable = row.dataset.measurable === '1';
                const content = row.querySelector('.swipe-content');
                if (!content) return;

                let startX = 0, startY = 0, dx = 0, swiping = false, revealed = false;

                row.addEventListener('touchstart', e => {
                    if (e.touches.length !== 1) return;
                    startX = e.touches[0].clientX;
                    startY = e.touches[0].clientY;
                    dx = 0; swiping = false;
                    if (!revealed) content.style.transition = 'none';
                }, { passive: true });

                row.addEventListener('touchmove', e => {
                    const x = e.touches[0].clientX - startX;
                    const y = e.touches[0].clientY - startY;
                    if (!swiping) {
                        if (Math.abs(y) > Math.abs(x) + 5 && !revealed) return;
                        swiping = true;
                    }
                    dx = x;
                    if (revealed) {
                        content.style.transform = `translateX(${Math.min(0, -160 + Math.max(0, x))}px)`;
                    } else {
                        content.style.transform = `translateX(${Math.max(-160, Math.min(200, x))}px)`;
                    }
                }, { passive: true });

                row.addEventListener('touchend', () => {
                    if (!swiping && !revealed) return;
                    if (revealed) {
                        if (dx > 60) {
                            _resetSwipe(content, () => { revealed = false; });
                        } else {
                            content.style.transition = 'transform 0.2s ease';
                            content.style.transform = 'translateX(-160px)';
                        }
                        return;
                    }
                    if (dx > 60) {
                        // Right swipe = complete
                        content.style.transition = 'transform 0.22s ease';
                        content.style.transform = 'translateX(110%)';
                        setTimeout(() => {
                            const habit = habits.find(h => h.id === habitId);
                            if (habit && !isMeasurable) {
                                _executeHabitDone(habit, dateStr, false);
                            } else if (habit) {
                                _resetSwipe(content, null);
                                openTodayHabitAction(habitId, dateStr);
                            }
                        }, 230);
                    } else if (dx < -60) {
                        // Left swipe = reveal skip/fail
                        content.style.transition = 'transform 0.2s ease';
                        content.style.transform = 'translateX(-160px)';
                        revealed = true;
                    } else {
                        _resetSwipe(content, () => { revealed = false; });
                    }
                });
            });

            container.querySelectorAll('.swipe-skip').forEach(btn => {
                btn.addEventListener('click', e => {
                    e.stopPropagation();
                    const row = btn.closest('.habit-swipe-row');
                    if (!row) return;
                    const content = row.querySelector('.swipe-content');
                    _resetSwipe(content, null);
                    skipHabitForDate(parseInt(row.dataset.habitId), row.dataset.date);
                });
            });

            container.querySelectorAll('.swipe-fail').forEach(btn => {
                btn.addEventListener('click', e => {
                    e.stopPropagation();
                    const row = btn.closest('.habit-swipe-row');
                    if (!row) return;
                    const content = row.querySelector('.swipe-content');
                    _resetSwipe(content, null);
                    markHabitNotDone(parseInt(row.dataset.habitId), row.dataset.date);
                });
            });
        }

        function initHabitTouchReorder(grid) {
            let srcId = null, tgtId = null;

            grid.querySelectorAll('.habit-drag-handle').forEach(handle => {
                handle.addEventListener('touchstart', e => {
                    e.stopPropagation(); // block swipe handler on parent row
                    const row = handle.closest('.habit-log-name');
                    if (!row) return;
                    srcId = parseInt(row.dataset.habitId);
                    tgtId = null;
                    row.querySelector('.swipe-content').style.opacity = '0.35';
                }, { passive: true });

                handle.addEventListener('touchmove', e => {
                    if (srcId == null) return;
                    e.preventDefault();    // prevent page scroll
                    e.stopPropagation();   // block swipe handler
                    const touch = e.touches[0];
                    // Temporarily hide handle to hit-test the row beneath
                    handle.style.pointerEvents = 'none';
                    const el = document.elementFromPoint(touch.clientX, touch.clientY);
                    handle.style.pointerEvents = '';
                    if (!el) return;
                    const targetRow = el.closest('.habit-log-name');
                    if (!targetRow || !targetRow.dataset.habitId) return;
                    const newTgt = parseInt(targetRow.dataset.habitId);
                    if (isNaN(newTgt) || newTgt === srcId) return;
                    if (newTgt !== tgtId) {
                        grid.querySelectorAll('.habit-log-name').forEach(r => r.style.outline = '');
                        targetRow.style.outline = '2px solid var(--accent-color)';
                        tgtId = newTgt;
                    }
                }, { passive: false });

                handle.addEventListener('touchend', e => {
                    if (srcId == null) return;
                    e.stopPropagation();
                    const srcRow = grid.querySelector(`.habit-log-name[data-habit-id="${srcId}"]`);
                    if (srcRow) srcRow.querySelector('.swipe-content').style.opacity = '';
                    grid.querySelectorAll('.habit-log-name').forEach(r => r.style.outline = '');
                    if (tgtId != null) {
                        const di = habits.findIndex(h => h.id === srcId);
                        const ti = habits.findIndex(h => h.id === tgtId);
                        if (di !== -1 && ti !== -1) {
                            const [moved] = habits.splice(di, 1);
                            habits.splice(ti, 0, moved);
                            saveHabits();
                            renderHabitLog();
                        }
                    }
                    srcId = null; tgtId = null;
                });
            });
        }

        // ========================================
        // PLAN TODAY
        // ========================================
        const PLAN_TODAY_KEY = 'lifescore_todayplan_v4';
        let _planTodayItems = [];
        let _planTodayOneOffs = [];
        let _planTodayDateStr = '';

        function getTodayPlan(dateStr) {
            try {
                const raw = localStorage.getItem(PLAN_TODAY_KEY);
                if (!raw) return null;
                const plan = JSON.parse(raw);
                return plan.date === dateStr ? plan : null;
            } catch { return null; }
        }

        function openPlanTodayModal() {
            const today = new Date();
            _planTodayDateStr = getLocalDateStr(today, true);
            const displayDate = new Date(_planTodayDateStr + 'T12:00:00');
            const todayAbbr = DAY_ABBRS[displayDate.getDay()];

            document.getElementById('planTodayDateLabel').textContent = displayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

            // Build items list
            const todayHabits = habits.filter(h => {
                const habitDays = h.customDays || [0,1,2,3,4,5,6];
                return habitDays.includes(displayDate.getDay());
            });

            const sessionBlocks = [];
            projects.forEach(p => {
                (p.scheduledSessions || []).forEach((s, idx) => {
                    if (s.day === todayAbbr) {
                        sessionBlocks.push({ type: 'session', key: `s_${p.id}_${idx}`, label: `${p.icon || '📁'} ${p.name}`, meta: `${s.startTime}–${s.endTime}`, time: s.startTime, project: p, session: s });
                    }
                });
            });

            const habitItemsList = todayHabits.map(h => ({ type: 'habit', key: `h_${h.id}`, label: `${h.icon || '🎯'} ${h.name}`, meta: h.reminderTime || 'No time', time: h.reminderTime || null }));
            _planTodayItems = [...habitItemsList, ...sessionBlocks];

            // Load existing plan order + one-offs
            const existing = getTodayPlan(_planTodayDateStr);
            if (existing && existing.order) {
                const ordered = [];
                existing.order.forEach(k => {
                    const found = _planTodayItems.find(i => i.key === k);
                    if (found) ordered.push(found);
                });
                _planTodayItems.forEach(i => { if (!existing.order.includes(i.key)) ordered.push(i); });
                _planTodayItems = ordered;
            }
            _planTodayOneOffs = existing ? JSON.parse(JSON.stringify(existing.oneOffSessions || [])) : [];

            // Populate one-off project dropdown
            const sel = document.getElementById('planOneOffProject');
            sel.innerHTML = '<option value="">Select project...</option>' +
                projects.map(p => `<option value="${p.id}">${p.icon || '📁'} ${escapeHtml(p.name)}</option>`).join('');

            renderPlanTodayItems();
            document.getElementById('planTodayModal').classList.add('active');
        }

        function closePlanTodayModal() {
            document.getElementById('planTodayModal').classList.remove('active');
        }

        function renderPlanTodayItems() {
            const el = document.getElementById('planTodayItemsList');
            if (!el) return;
            let html = '';
            _planTodayItems.forEach((item, i) => {
                html += `<div class="plan-today-item">
                    <div class="plan-today-item-label">
                        <span>${item.label}</span>
                        <span class="plan-today-item-meta">${item.meta}</span>
                    </div>
                    <div class="plan-today-item-controls">
                        <button onclick="planTodayMoveUp(${i})" ${i === 0 ? 'disabled' : ''} style="background:none; border:1px solid var(--border-color); border-radius:4px; cursor:pointer; padding:2px 8px; color:var(--text-primary);">↑</button>
                        <button onclick="planTodayMoveDown(${i})" ${i === _planTodayItems.length - 1 ? 'disabled' : ''} style="background:none; border:1px solid var(--border-color); border-radius:4px; cursor:pointer; padding:2px 8px; color:var(--text-primary);">↓</button>
                    </div>
                </div>`;
            });
            if (_planTodayOneOffs.length > 0) {
                html += `<div class="timeline-section-label" style="margin-top:12px;">One-off Sessions</div>`;
                _planTodayOneOffs.forEach((s, i) => {
                    const p = projects.find(x => x.id === s.projectId);
                    html += `<div class="plan-today-item">
                        <div class="plan-today-item-label">
                            <span>${p ? (p.icon || '📁') + ' ' + escapeHtml(p.name) : 'Unknown'}</span>
                            <span class="plan-today-item-meta">${s.startTime}–${s.endTime}</span>
                        </div>
                        <button onclick="planTodayRemoveOneOff(${i})" style="background:none; border:none; color:var(--error-color); cursor:pointer; font-size:18px;">×</button>
                    </div>`;
                });
            }
            el.innerHTML = html || '<div style="color:var(--text-secondary); font-size:13px;">No habits or sessions for today.</div>';
        }

        function planTodayMoveUp(i) {
            if (i <= 0) return;
            [_planTodayItems[i - 1], _planTodayItems[i]] = [_planTodayItems[i], _planTodayItems[i - 1]];
            renderPlanTodayItems();
        }

        function planTodayMoveDown(i) {
            if (i >= _planTodayItems.length - 1) return;
            [_planTodayItems[i], _planTodayItems[i + 1]] = [_planTodayItems[i + 1], _planTodayItems[i]];
            renderPlanTodayItems();
        }

        function planTodayAddOneOff() {
            const projectId = parseInt(document.getElementById('planOneOffProject').value);
            const startTime = document.getElementById('planOneOffStart').value;
            const endTime = document.getElementById('planOneOffEnd').value;
            if (!projectId) return alert('Please select a project');
            if (!startTime || !endTime) return alert('Please set start and end times');
            if (startTime >= endTime) return alert('End time must be after start time');
            _planTodayOneOffs.push({ projectId, startTime, endTime });
            renderPlanTodayItems();
        }

        function planTodayRemoveOneOff(i) {
            _planTodayOneOffs.splice(i, 1);
            renderPlanTodayItems();
        }

        function savePlanToday() {
            const plan = {
                date: _planTodayDateStr,
                order: _planTodayItems.map(i => i.key),
                oneOffSessions: _planTodayOneOffs
            };
            localStorage.setItem(PLAN_TODAY_KEY, JSON.stringify(plan));
            closePlanTodayModal();
            renderTodayView();
        }


        // ==========================================
        // STREAK & RECOVER GEM SYSTEM
        // ==========================================
        const STREAK_MILESTONES = [
            { days: 3,   xp: 10   },
            { days: 7,   xp: 25   },
            { days: 14,  xp: 50   },
            { days: 30,  xp: 150  },
            { days: 50,  xp: 300  },
            { days: 100, xp: 1000 },
        ];
        function saveStreaks() {
            localStorage.setItem('lifescore_streaks_v4', JSON.stringify(streakData));
        }
        function saveGems() {
            localStorage.setItem('lifescore_gems_v4', JSON.stringify({
                count: recoverGems, cleanStreak: gemCleanStreak, lastCleanDay: gemLastCleanDay
            }));
        }
        function getHabitStreak(habitId) {
            return (streakData[String(habitId)] || {}).current || 0;
        }
        function hasMissedDays(habit, fromDateStr, toDateStr) {
            if (!fromDateStr || fromDateStr === toDateStr) return false;
            const scheduled = habit.customDays || [0,1,2,3,4,5,6];
            const from = new Date(fromDateStr + 'T12:00:00');
            const to = new Date(toDateStr + 'T12:00:00');
            const cur = new Date(from);
            cur.setDate(cur.getDate() + 1);
            while (cur < to) {
                if (scheduled.includes(cur.getDay())) {
                    const ds = getLocalDateStr(cur);
                    if (getHabitLogState(habitLogs[habit.id]?.[ds]) !== 'done') return true;
                }
                cur.setDate(cur.getDate() + 1);
            }
            return false;
        }
        function getStreakMilestoneBonus(newStreak, oldStreak) {
            for (const m of STREAK_MILESTONES) {
                if (newStreak >= m.days && oldStreak < m.days) return m;
            }
            return null;
        }
        function applyHabitStreak(habit, dateStr, preserveStreak) {
            const key = String(habit.id);
            const sd = streakData[key] || { current: 0, best: 0, lastCompleted: null, total: 0 };
            const oldCurrent = sd.current || 0;
            let newCurrent;
            if (preserveStreak) {
                newCurrent = oldCurrent + 1;
            } else if (!sd.lastCompleted) {
                newCurrent = 1;
            } else if (sd.lastCompleted === dateStr) {
                newCurrent = oldCurrent;
            } else {
                newCurrent = hasMissedDays(habit, sd.lastCompleted, dateStr) ? 1 : oldCurrent + 1;
            }
            const newBest = Math.max(newCurrent, sd.best || 0);
            const newTotal = sd.lastCompleted === dateStr ? (sd.total || 0) : (sd.total || 0) + 1;
            streakData[key] = { current: newCurrent, best: newBest, lastCompleted: dateStr, total: newTotal };
            saveStreaks();
            const milestone = getStreakMilestoneBonus(newCurrent, oldCurrent);
            return { streakCount: newCurrent, milestone };
        }
        function recomputeStreakFromHistory(habit) {
            const key = String(habit.id);
            const scheduled = habit.customDays || [0, 1, 2, 3, 4, 5, 6];
            const logs = habitLogs[String(habit.id)] || {};
            const doneDates = Object.keys(logs).filter(d => getHabitLogState(logs[d]) === 'done').sort();
            const total = doneDates.length;
            if (total === 0) {
                streakData[key] = { current: 0, best: 0, lastCompleted: null, total: 0 };
                saveStreaks();
                return;
            }
            const today = new Date();
            today.setHours(12, 0, 0, 0);
            const todayStr = getLocalDateStr(today);
            const earliestDone = doneDates[0];
            let currentStreak = 0;
            let cur = new Date(today);
            for (let i = 0; i < 2000; i++) {
                const ds = getLocalDateStr(cur);
                if (ds < earliestDone) break;
                if (scheduled.includes(cur.getDay())) {
                    const state = getHabitLogState(logs[ds]);
                    if (state === 'done') {
                        currentStreak++;
                    } else if (ds === todayStr && state !== 'failed') {
                        // today is still pending — skip without breaking
                    } else {
                        break;
                    }
                }
                cur.setDate(cur.getDate() - 1);
            }
            let bestStreak = currentStreak;
            let tempStreak = 0;
            let prevDoneDate = null;
            for (const dateStr of doneDates) {
                tempStreak = prevDoneDate && !hasMissedDays(habit, prevDoneDate, dateStr) ? tempStreak + 1 : 1;
                if (tempStreak > bestStreak) bestStreak = tempStreak;
                prevDoneDate = dateStr;
            }
            streakData[key] = { current: currentStreak, best: bestStreak, lastCompleted: doneDates[doneDates.length - 1], total };
            saveStreaks();
        }
        function recomputeAllStreaks() {
            habits.forEach(habit => recomputeStreakFromHistory(habit));
        }
        function showHabitCompletionPopup(habit, baseXP, streakCount, milestone, dateStr) {
            if (milestone && habitLogs[habit.id]?.[dateStr]) {
                habitLogs[habit.id][dateStr].streakBonus = milestone.xp;
                saveHabitLogs();
            }
            refreshTotalXPDisplay();
            _sessionHabitsCompleted++;
            const hitCombo = _comboThresholds.includes(_sessionHabitsCompleted);
            _pendingComboBonus = hitCombo;
            showHabitSuccessModal(habit, baseXP, streakCount, milestone, dateStr);
        }
        function updateGemDisplay() {
            const el = document.getElementById('todayGemCount');
            if (el) el.textContent = recoverGems;
        }
        function checkAndAwardGem(dateStr) {
            const d = new Date(dateStr + 'T12:00:00');
            const todayHabits = habits.filter(h => (h.customDays || [0,1,2,3,4,5,6]).includes(d.getDay()));
            if (!todayHabits.length) return;
            if (!todayHabits.every(h => getHabitLogState(habitLogs[h.id]?.[dateStr]) === 'done')) return;
            const y = new Date(d); y.setDate(y.getDate() - 1);
            const yesterday = getLocalDateStr(y);
            if (gemLastCleanDay === yesterday) {
                gemCleanStreak = (gemCleanStreak || 0) + 1;
            } else if (gemLastCleanDay !== dateStr) {
                gemCleanStreak = 1;
            }
            gemLastCleanDay = dateStr;
            if (gemCleanStreak >= 14) {
                recoverGems = recoverGems + 1;
                gemCleanStreak = 0;
                saveGems();
                showGemEarnedPopup();
            } else {
                saveGems();
            }
            updateGemDisplay();
        }
        function showGemEarnedPopup() {
            const el = document.getElementById('xpGainPopup');
            if (!el) return;
            el.innerHTML =
                '<div class="sp-gem-icon">&#x1F48E;</div>' +
                '<div class="sp-gem-title">Recover Gem Earned!</div>' +
                '<div class="sp-label">You now have ' + recoverGems + ' gem' + (recoverGems !== 1 ? 's' : '') + '</div>';
            el.className = '';
            void el.offsetWidth;
            el.classList.add('show', 'sp-gem');
        }
        function openGemRecoveryModal(habit, currentStreak) {
            const modal = document.getElementById('gemRecoveryModal');
            if (!modal) return;
            document.getElementById('gemRecoveryHabitName').textContent = habit.name;
            document.getElementById('gemRecoveryStreakCount').textContent = currentStreak;
            document.getElementById('gemRecoveryGemCount').textContent = recoverGems;
            modal.classList.add('active');
        }
        function closeGemRecoveryModal() {
            document.getElementById('gemRecoveryModal')?.classList.remove('active');
        }
        function useGemAndMarkDone() {
            closeGemRecoveryModal();
            if (!_pendingHabitCompletion) return;
            const { habit, dateStr } = _pendingHabitCompletion;
            _pendingHabitCompletion = null;
            recoverGems--;
            saveGems();
            updateGemDisplay();
            const sd = streakData[String(habit.id)] || {};
            const el = document.getElementById('xpGainPopup');
            if (el) {
                el.innerHTML =
                    '<div class="sp-gem-icon">&#x1F48E;</div>' +
                    '<div class="sp-gem-title">Recover Gem Used!</div>' +
                    '<div class="sp-label">' + ((sd.current || 0) + 1) + ' Day ' + escapeHtml(habit.name) + ' Streak Saved!</div>';
                el.className = '';
                void el.offsetWidth;
                el.classList.add('show', 'sp-gem');
            }
            _executeHabitDone(habit, dateStr, true);
        }
        function skipGemAndMarkDone() {
            closeGemRecoveryModal();
            if (!_pendingHabitCompletion) return;
            const { habit, dateStr } = _pendingHabitCompletion;
            _pendingHabitCompletion = null;
            _executeHabitDone(habit, dateStr, false);
        }
        function _executeHabitDone(habit, dateStr, preserveStreak) {
            setHabitLogState(habit.id, dateStr, 'done', habit.target_value || 1);
            if (_todayHabitNote && habitLogs[String(habit.id)]?.[dateStr]) {
                habitLogs[String(habit.id)][dateStr].note = _todayHabitNote;
            }
            _todayHabitNote = '';
            saveHabitLogs();
            const baseXP = getHabitXP(habit);
            const { streakCount, milestone } = applyHabitStreak(habit, dateStr, preserveStreak);
            showHabitCompletionPopup(habit, baseXP, streakCount, milestone, dateStr);
            checkAndAwardGem(dateStr);
            renderTodayView();
            renderHabitLog();
        }

        let _todayHabitId = null;
        let _todayHabitDate = null;
        let _todayHabitNote = '';
        let _sessionHabitsCompleted = 0;
        let _pendingComboBonus = false;

        /* ---- Sound helpers (Web Audio API) ---- */
        function _getAudioCtx() {
            if (!window._lifescoreAudioCtx) {
                try { window._lifescoreAudioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
            }
            return window._lifescoreAudioCtx;
        }
        function _playTone(freq, type, startTime, dur, vol, ctx) {
            try {
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.connect(g); g.connect(ctx.destination);
                o.type = type; o.frequency.setValueAtTime(freq, startTime);
                g.gain.setValueAtTime(vol, startTime);
                g.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
                o.start(startTime); o.stop(startTime + dur + 0.01);
            } catch(e) {}
        }
        function playClickSound() {
            const ctx = _getAudioCtx(); if (!ctx) return;
            const t = ctx.currentTime;
            _playTone(800, 'sine', t, 0.06, 0.12, ctx);
        }
        function playSuccessSound() {
            const ctx = _getAudioCtx(); if (!ctx) return;
            const t = ctx.currentTime;
            const notes = [523, 659, 784];
            notes.forEach((f, i) => _playTone(f, 'sine', t + i * 0.11, 0.18, 0.14, ctx));
        }
        function playMilestoneSound() {
            const ctx = _getAudioCtx(); if (!ctx) return;
            const t = ctx.currentTime;
            const notes = [523, 659, 784, 1047];
            notes.forEach((f, i) => _playTone(f, 'sine', t + i * 0.1, 0.22, 0.15, ctx));
        }

        /* ---- Confetti ---- */
        function launchConfetti() {
            const canvas = document.getElementById('confettiCanvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            const colors = ['#6366f1','#8b5cf6','#a78bfa','#facc15','#f472b6','#34d399','#60a5fa'];
            const particles = Array.from({length: 80}, () => ({
                x: Math.random() * canvas.width,
                y: -10 - Math.random() * 40,
                r: 4 + Math.random() * 6,
                d: 2 + Math.random() * 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                tilt: Math.random() * 10 - 5,
                tiltAngle: 0,
                tiltSpeed: 0.07 + Math.random() * 0.05,
                opacity: 1
            }));
            let frame = 0;
            const maxFrames = 72;
            function draw() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                particles.forEach(p => {
                    p.tiltAngle += p.tiltSpeed;
                    p.y += p.d;
                    p.tilt = Math.sin(p.tiltAngle) * 12;
                    p.opacity = Math.max(0, 1 - frame / maxFrames);
                    ctx.globalAlpha = p.opacity;
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.ellipse(p.x + p.tilt, p.y, p.r, p.r * 0.5, p.tiltAngle, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.globalAlpha = 1;
                frame++;
                if (frame < maxFrames) requestAnimationFrame(draw);
                else ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            draw();
        }

        /* ---- Count-up animation ---- */
        function animateCount(elId, from, to, prefix, suffix, duration) {
            const el = document.getElementById(elId);
            if (!el) return;
            const start = performance.now();
            function step(now) {
                const t = Math.min((now - start) / duration, 1);
                const ease = 1 - Math.pow(1 - t, 3);
                el.textContent = prefix + Math.round(from + (to - from) * ease) + suffix;
                if (t < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
        }

        /* ---- Habit Success Modal ---- */
        let _hsmHabitId = null;
        let _hsmDateStr = null;
        function showHabitSuccessModal(habit, baseXP, streakCount, milestone, dateStr) {
            const modal = document.getElementById('habitSuccessModal');
            if (!modal) return;
            _hsmHabitId = habit.id;
            _hsmDateStr = dateStr || _todayHabitDate;
            document.getElementById('hsmHabitName').textContent = habit.name;
            const totalXP = baseXP + (milestone ? milestone.xp : 0);
            const noteInput = document.getElementById('hsmNoteInput');
            if (noteInput) {
                noteInput.value = habitLogs[habit.id]?.[_hsmDateStr]?.note || '';
            }
            modal.style.display = 'flex';
            launchConfetti();
            animateCount('hsmXp', 0, totalXP, '+', ' XP', 800);
            const streakEl = document.getElementById('hsmStreak');
            if (streakEl) streakEl.textContent = streakCount || 1;
            const streakIcon = modal.querySelector('.hsm-stat-icon.flame');
            if (streakIcon) streakIcon.style.animation = streakCount >= 2 ? '' : 'none';
            const mEl = document.getElementById('hsmMilestone');
            if (mEl) {
                if (milestone) {
                    mEl.textContent = '🔥 ' + milestone.days + ' Day Streak! +' + milestone.xp + ' Bonus XP';
                    mEl.style.display = 'block';
                    playMilestoneSound();
                } else {
                    mEl.style.display = 'none';
                    playSuccessSound();
                }
            }
        }
        function closeHabitSuccessModal() {
            const noteInput = document.getElementById('hsmNoteInput');
            if (noteInput && _hsmHabitId && _hsmDateStr) {
                const note = noteInput.value.trim();
                if (!habitLogs[_hsmHabitId]) habitLogs[_hsmHabitId] = {};
                if (!habitLogs[_hsmHabitId][_hsmDateStr]) habitLogs[_hsmHabitId][_hsmDateStr] = {};
                habitLogs[_hsmHabitId][_hsmDateStr].note = note;
                saveHabitLogs();
            }
            _hsmHabitId = null;
            _hsmDateStr = null;
            const modal = document.getElementById('habitSuccessModal');
            if (modal) modal.style.display = 'none';
            if (_pendingComboBonus) {
                _pendingComboBonus = false;
                setTimeout(showHabitComboModal, 180);
            }
        }

        /* ---- Not Today Modal ---- */
        function showHabitNotTodayModal() {
            const modal = document.getElementById('habitNotTodayModal');
            if (modal) modal.style.display = 'flex';
        }
        function closeHabitNotTodayModal() {
            const modal = document.getElementById('habitNotTodayModal');
            if (modal) modal.style.display = 'none';
        }

        /* ---- Combo Modal ---- */
        const _comboThresholds = [3, 5, 8];
        function showHabitComboModal() {
            const modal = document.getElementById('habitComboModal');
            if (!modal) return;
            const sub = document.getElementById('hcmSubtitle');
            if (sub) sub.textContent = 'You completed ' + _sessionHabitsCompleted + ' habits!';
            modal.style.display = 'flex';
        }
        function closeHabitComboModal() {
            const modal = document.getElementById('habitComboModal');
            if (modal) modal.style.display = 'none';
        }

        function openTodayHabitAction(habitId, dateStr) {
            const habit = habits.find(h => String(h.id) === String(habitId));
            if (!habit) return;
            _todayHabitId = habitId;
            _todayHabitDate = dateStr;

            playClickSound();
            const iconEl = document.getElementById('todayHabitModalIcon');
            if (iconEl) iconEl.textContent = habit.icon || '🎯';
            document.getElementById('todayHabitModalTitle').textContent = habit.name;

            const yesno = document.getElementById('todayHabitYesNoActions');
            const meas  = document.getElementById('todayHabitMeasurableActions');

            if (habit.measurable && habit.period === 'weekly') {
                // Weekly measurable habits: use the same +/− modal as the Habits tab
                incrementWeeklyHabit(habitId);
                return;
            } else if (habit.measurable) {
                yesno.style.display = 'none';
                meas.style.display  = 'block';
                const currentVal = habitLogs[habitId]?.[dateStr]?.value || '';
                document.getElementById('todayHabitValueLabel').textContent =
                    `Enter ${habit.unit || 'value'} (target: ${habit.target_value || 1})`;
                const inp = document.getElementById('todayHabitValueInput');
                inp.value = currentVal;
                setTimeout(() => inp.focus(), 80);
            } else {
                yesno.style.display = 'grid';
                meas.style.display  = 'none';
            }

            document.getElementById('todayHabitModal').classList.add('active');
        }

        function closeTodayHabitModal() {
            document.getElementById('todayHabitModal').classList.remove('active');
            _todayHabitId = null;
            _todayHabitDate = null;
            const noteEl = document.getElementById('todayHabitNote');
            if (noteEl) noteEl.value = '';
        }

        function todayMarkHabitDone() {
            if (!_todayHabitId) return;
            const habit = habits.find(h => String(h.id) === String(_todayHabitId));
            if (!habit) return;
            const dateStr = _todayHabitDate;
            _todayHabitNote = (document.getElementById('todayHabitNote')?.value || '').trim();
            const sd = streakData[String(habit.id)] || {};
            const wouldBreak = (sd.current || 0) > 0 && sd.lastCompleted && sd.lastCompleted !== dateStr
                && hasMissedDays(habit, sd.lastCompleted, dateStr);
            closeTodayHabitModal();
            if (wouldBreak && recoverGems > 0) {
                _pendingHabitCompletion = { habit, dateStr };
                openGemRecoveryModal(habit, sd.current);
                return;
            }
            _executeHabitDone(habit, dateStr, false);
        }

        function todayMarkHabitFailed() {
            if (!_todayHabitId) return;
            setHabitLogState(_todayHabitId, _todayHabitDate, 'failed', 0);
            saveHabitLogs();
            closeTodayHabitModal();
            renderTodayView();
            renderHabitLog();
            showHabitNotTodayModal();
        }

        function todaySkipHabit() {
            if (!_todayHabitId) return;
            setHabitLogState(_todayHabitId, _todayHabitDate, 'skipped', 0);
            saveHabitLogs();
            closeTodayHabitModal();
            renderTodayView();
            renderHabitLog();
        }

        function todaySubmitMeasurable() {
            if (!_todayHabitId) return;
            const val = parseFloat(document.getElementById('todayHabitValueInput').value);
            if (isNaN(val) || val < 0) return;
            const noteVal = (document.getElementById('todayHabitNote')?.value || '').trim();
            const habit = habits.find(h => String(h.id) === String(_todayHabitId));
            const dateStr = _todayHabitDate;
            const isNegativeHabit = (habit?.type === 'negative') || (habit?.habitType === 'negative');
            let targetMet, state;
            if (habit?.measurable) {
                if (isNegativeHabit) {
                    targetMet = val <= (habit?.target_value ?? 0);
                    state = targetMet ? 'done' : 'failed';
                } else {
                    targetMet = val >= (habit?.target_value || 1);
                    state = targetMet ? 'done' : 'failed';
                }
            } else {
                targetMet = val > 0;
                state = targetMet ? 'done' : 'failed';
            }
            setHabitLogState(_todayHabitId, dateStr, state, val);
            if (noteVal && habitLogs[String(_todayHabitId)]?.[dateStr]) {
                habitLogs[String(_todayHabitId)][dateStr].note = noteVal;
            }
            saveHabitLogs();
            if (targetMet && habit) {
                const sd = streakData[String(habit.id)] || {};
                const wouldBreak = (sd.current || 0) > 0 && sd.lastCompleted && sd.lastCompleted !== dateStr
                    && hasMissedDays(habit, sd.lastCompleted, dateStr);
                closeTodayHabitModal();
                if (wouldBreak && recoverGems > 0) {
                    _pendingHabitCompletion = { habit, dateStr };
                    openGemRecoveryModal(habit, sd.current);
                    return;
                }
                const baseXP = getHabitXP(habit);
                const { streakCount, milestone } = applyHabitStreak(habit, dateStr, false);
                showHabitCompletionPopup(habit, baseXP, streakCount, milestone, dateStr);
                checkAndAwardGem(dateStr);
            } else {
                closeTodayHabitModal();
            }
            renderTodayView();
            renderHabitLog();
        }

        function quickToggleHabit(habitId, dateStr, measurable) {
            if (!habitLogs[habitId]) habitLogs[habitId] = {};

            const habit = habits.find(h => String(h.id) === String(habitId));
            if (!habit) return;
            const currentLog = habitLogs[habitId][dateStr] || { completed: false, value: 0 };
            
            if (measurable) {
                showHabitValueModal(habitId, dateStr);
            } else {
                const state = getHabitLogState(currentLog);
                const nextState = state === 'blank' ? 'done' : state === 'done' ? 'failed' : 'blank';
                setHabitLogState(habitId, dateStr, nextState, nextState === 'done' ? (habit.target_value || 1) : 0);
                saveHabitLogs();
                recomputeStreakFromHistory(habit);
                if (nextState === 'done') showXpGainPopup(getHabitXP(habit));
                renderTodayView();
                renderHabitLog();
                renderHabitWeekChart();
            }
        }

        function markHabitNotDone(habitId, dateStr) {
            setHabitLogState(habitId, dateStr, 'failed', 0);
            saveHabitLogs();
            const h = habits.find(h => String(h.id) === String(habitId));
            if (h) recomputeStreakFromHistory(h);
            renderTodayView();
            renderHabitLog();
            renderHabitWeekChart();
        }

        function skipHabitForDate(habitId, dateStr) {
            setHabitLogState(habitId, dateStr, 'skipped', 0);
            saveHabitLogs();
            renderTodayView();
            renderHabitLog();
        }

        function calculateHabitDailyPoints(habit, value) {
    if (!settings.gamificationEnabled) return 0;
    
    let completionPercent = 0;
    
    if (habit.period === 'weekly' || habit.period === 'monthly') {
        // For weekly/monthly: if done today = 100%
        completionPercent = value > 0 ? 1 : 0;
    } else {
        // For daily: value/target
        completionPercent = habit.target_value > 0 ? Math.min(1, value / habit.target_value) : (value > 0 ? 1 : 0);
    }
    
    const weight = (habit.weight || 0) / 100;
    const totalHabitPool = settings.scoring.habits.totalPool || 50;
    
    return totalHabitPool * weight * completionPercent;
}

        // ========================================
        // PROJECTS
        // ========================================
        
        function renderProjects() {
            // Projects tab removed — projects are now lightweight tags managed via registry modal
            updateProjectSelects();
            populateHabitFilterProjects();
        }

function filterHabitsByProject() {
    const dropdown = document.getElementById('habitsProjectFilterDropdown');
    const selectedValue = dropdown.value;
    
    if (selectedValue === 'all') {
        currentHabitProject = null;
    } else {
        currentHabitProject = parseInt(selectedValue);
    }
    
    renderHabitLog();
}

        function updateProjectSelects() {
    const selects = [document.getElementById('modalProject')];
    const html = '<option value="">No Project</option>' +
        projects.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('');
    selects.forEach(s => s && (s.innerHTML = html));
}

        function updateProjectCounts() {
            // tasks removed — no-op
            const el = document.getElementById('allProjectsCount');
            if (el) el.textContent = 0;
            
            projects.forEach(p => {
                const count = getProjectCount(p.id);
                const countEl = document.querySelector(`[data-project="${p.id}"] .filter-count`);
                if (countEl) countEl.textContent = count;
            });
        }

        function filterByProject() {
            const dropdown = document.getElementById('projectFilterDropdown');
            const selectedValue = dropdown.value;
            
            if (selectedValue === 'all') {
                currentProject = null;
            } else {
                currentProject = parseInt(selectedValue);
            }
            
            const mainFilter = document.getElementById('mainFilterDropdown');
            if (mainFilter) mainFilter.value = 'all';
            currentFilter = 'all';
            renderTasks();
        }

        function applyFilter() {
            currentFilter = document.getElementById('mainFilterDropdown').value;
            renderTasks();
        }
        function toggleShowCompleted() {
    showCompleted = document.getElementById('showCompletedToggle').checked;
    renderTasks();
}

        function getProjectCount(projectId) {
            return tasks.filter(t => t.project === projectId && !t.completed).length;
        }

        function showAddProjectModal() {
           console.log('showAddProjectModal called');
           selectedProjectIcon = '📁';
    selectedProjectColor = '#1967d2';
            editingId = null;
            document.getElementById('projectModalTitle').textContent = 'Add Project';
            document.getElementById('projectName').value = '';
            document.getElementById('projectIcon').value = '📁';
            document.getElementById('selectedProjectIcon').dataset.icon = '📁';
            document.getElementById('selectedProjectIcon').textContent = '📁';
            document.querySelector('.icon-option.selected')?.classList.remove('selected');
            document.querySelector('.icon-option').classList.add('selected');
            document.querySelector('.color-option.selected')?.classList.remove('selected');
            document.querySelector('.color-option').classList.add('selected');
            document.getElementById('projectStartDate').value = '';
            document.getElementById('projectEndDate').value = '';
            document.getElementById('projectStatus').value = 'active';
            document.getElementById('projectDescription').value = '';
            document.getElementById('deleteProjectBtn').style.display = 'none';
            renderProjectToolsCheckboxes([]);
            _editingScheduledSessions = [];
            renderScheduledSessions();
            document.getElementById('projectModal').classList.add('active');
        }

        function editProject(projectId) {
            const project = projects.find(p => p.id === projectId);
            if (!project) return;

            editingId = projectId;
            document.getElementById('projectModalTitle').textContent = 'Edit Project';
            document.getElementById('projectName').value = project.name;
            selectedProjectIcon = project.icon || '📁';
            document.getElementById('projectIcon').value = project.icon || '📁';
            document.getElementById('selectedProjectIcon').dataset.icon = project.icon || '📁';
            document.getElementById('selectedProjectIcon').textContent = project.icon || '📁';
            
            document.querySelectorAll('.icon-option').forEach(opt => {
                opt.classList.toggle('selected', opt.dataset.icon === project.icon);
            });
            
            document.querySelectorAll('.color-option').forEach(opt => {
                opt.classList.toggle('selected', opt.dataset.color === project.color);
            });
            selectedProjectColor = project.color || '#1967d2';
            document.getElementById('projectStartDate').value = project.startDate || '';
    document.getElementById('projectEndDate').value = project.endDate || '';
    document.getElementById('projectStatus').value = project.status || 'active';
    document.getElementById('projectDescription').value = project.description || '';

            
            document.getElementById('deleteProjectBtn').style.display = 'block';
            renderProjectToolsCheckboxes(project.tools || []);
            _editingScheduledSessions = JSON.parse(JSON.stringify(project.scheduledSessions || []));
            renderScheduledSessions();
            document.getElementById('projectModal').classList.add('active');
        }

        let sessionSelectedToolIds = new Set();

        function renderSessionEndTools() {
            const tagsEl = document.getElementById('sessionEndToolsTags');
            if (!tagsEl) return;
            if (sessionSelectedToolIds.size === 0) {
                tagsEl.innerHTML = '<span style="font-size:13px; color:var(--text-secondary);">None selected</span>';
            } else {
                tagsEl.innerHTML = Array.from(sessionSelectedToolIds).map(id => {
                    const t = tools.find(x => x.id === id);
                    if (!t) return '';
                    return `<span style="display:inline-flex; align-items:center; gap:5px; padding:4px 10px; background:var(--accent-color); color:#fff; border-radius:20px; font-size:13px; font-weight:500;">
                        ${t.icon} ${escapeHtml(t.name)}
                        <button onclick="sessionToolRemove(${t.id})" style="background:none; border:none; color:#fff; font-size:14px; cursor:pointer; padding:0; line-height:1; opacity:0.8;">×</button>
                    </span>`;
                }).join('');
            }
        }

        function openSessionToolPicker() {
            document.getElementById('toolPickerSearch').value = '';
            document.getElementById('newToolNameFromPicker').value = '';
            renderToolPickerList();
            document.getElementById('sessionToolPickerModal').classList.add('active');
            setTimeout(() => document.getElementById('toolPickerSearch').focus(), 100);
        }

        function closeSessionToolPicker() {
            document.getElementById('sessionToolPickerModal').classList.remove('active');
        }

        function renderToolPickerList(filter = '') {
            const list = document.getElementById('toolPickerList');
            if (!list) return;
            const filtered = filter
                ? tools.filter(t => t.name.toLowerCase().includes(filter.toLowerCase()))
                : tools;
            if (filtered.length === 0) {
                list.innerHTML = `<div style="font-size:13px; color:var(--text-secondary); padding:8px 4px;">${filter ? 'No tools match.' : 'No tools yet — add one below.'}</div>`;
                return;
            }
            list.innerHTML = filtered.map(t => {
                const selected = sessionSelectedToolIds.has(t.id);
                return `<button onclick="sessionToolPickerToggle(${t.id})" style="display:flex; align-items:center; gap:10px; width:100%; text-align:left; padding:10px 12px; background:${selected ? 'var(--accent-color)' : 'var(--bg-tertiary)'}; color:${selected ? '#fff' : 'var(--text-primary)'}; border:none; border-radius:8px; cursor:pointer; font-size:13px; transition:background 0.15s;">
                    <span style="font-size:16px;">${t.icon}</span>
                    <span style="flex:1; font-weight:500;">${escapeHtml(t.name)}</span>
                    ${selected ? '<span style="font-size:15px; opacity:0.9;">✓</span>' : ''}
                </button>`;
            }).join('');
        }

        function filterToolPickerList() {
            renderToolPickerList(document.getElementById('toolPickerSearch').value);
        }

        function sessionToolPickerToggle(id) {
            if (sessionSelectedToolIds.has(id)) {
                sessionSelectedToolIds.delete(id);
            } else {
                sessionSelectedToolIds.add(id);
            }
            renderSessionEndTools();
            renderToolPickerList(document.getElementById('toolPickerSearch')?.value || '');
        }

        function addNewToolFromPicker() {
            const nameEl = document.getElementById('newToolNameFromPicker');
            const name = nameEl.value.trim();
            if (!name) return nameEl.focus();
            const newTool = { id: Date.now(), name, icon: '🔧', category: 'General' };
            tools.push(newTool);
            saveTools();
            sessionSelectedToolIds.add(newTool.id);
            nameEl.value = '';
            renderSessionEndTools();
            renderToolPickerList(document.getElementById('toolPickerSearch')?.value || '');
        }

        function sessionToolRemove(id) {
            sessionSelectedToolIds.delete(id);
            renderSessionEndTools();
        }
        function renderProjectToolsCheckboxes(selectedToolIds) {
            const container = document.getElementById('projectToolsList');
            if (!container) return;
            if (tools.length === 0) {
                container.innerHTML = '<span style="font-size: 13px; color: var(--text-secondary);">No tools in registry. Add tools via 🧰 button.</span>';
                return;
            }
            container.innerHTML = tools.map(t => `
                <label style="display: flex; align-items: center; gap: 6px; padding: 6px 10px; background: var(--bg-tertiary); border-radius: 6px; cursor: pointer; font-size: 13px;">
                    <input type="checkbox" class="project-tool-checkbox" value="${t.id}" ${selectedToolIds.includes(t.id) ? 'checked' : ''}>
                    ${t.icon} ${escapeHtml(t.name)}
                </label>
            `).join('');
        }
function openProjectEmojiPicker() {
    document.getElementById('projectEmojiPickerPopup').style.display = 'block';
    document.getElementById('customProjectEmojiInput').value = '';
}

function closeProjectEmojiPicker() {
    document.getElementById('projectEmojiPickerPopup').style.display = 'none';
}

function selectProjectEmoji(emoji) {
    const display = document.getElementById('selectedProjectIcon');
    display.textContent = emoji;
    display.dataset.icon = emoji;
    display.classList.add('selected');
    const iconInput = document.getElementById('projectIcon');
    if (iconInput) iconInput.value = emoji;
    selectedProjectIcon = emoji;
    closeProjectEmojiPicker();
}
function openHabitEmojiPicker() {
    document.getElementById('habitEmojiPickerPopup').style.display = 'block';
    document.getElementById('customHabitEmojiInput').value = '';
}

function closeHabitEmojiPicker() {
    document.getElementById('habitEmojiPickerPopup').style.display = 'none';
}

function selectHabitEmoji(emoji) {
    const display = document.getElementById('selectedHabitIcon');
    display.textContent = emoji;
    display.dataset.icon = emoji;
    display.classList.add('selected');
    closeHabitEmojiPicker();
}

// Handle custom emoji input
document.addEventListener('DOMContentLoaded', function() {
    const customProjectInput = document.getElementById('customProjectEmojiInput');
    if (customProjectInput) {
        customProjectInput.addEventListener('input', function() {
            const emoji = this.value.trim();
            if (emoji) {
                selectProjectEmoji(emoji);
            }
        });
    }
    
    const customHabitInput = document.getElementById('customHabitEmojiInput');
    if (customHabitInput) {
        customHabitInput.addEventListener('input', function() {
            const emoji = this.value.trim();
            if (emoji) {
                selectHabitEmoji(emoji);
            }
        });
    }
}); 

        function saveProject() {
            const name = document.getElementById('projectName').value.trim();
            if (!name) return alert('Please enter a project name');

            const icon = document.getElementById('projectIcon')?.value || selectedProjectIcon || '📁';
            const color = document.querySelector('.color-picker .color-option.selected')?.dataset.color || selectedProjectColor || '#1967d2';
            const startDate = document.getElementById('projectStartDate').value;
    const endDate = document.getElementById('projectEndDate').value;
    const status = document.getElementById('projectStatus').value;
    const description = document.getElementById('projectDescription').value.trim();
    const selectedTools = Array.from(document.querySelectorAll('.project-tool-checkbox:checked')).map(cb => parseInt(cb.value));

            let savedProjectId = editingId;
            if (editingId) {
                const project = projects.find(p => p.id === editingId);
                project.name = name;
                project.icon = icon;
                project.color = color;
                project.startDate = startDate;
                project.endDate = endDate;
                project.status = status || 'active';
                project.description = description;
                project.tools = selectedTools;
                project.archived = (status === 'archived');
                project.scheduledSessions = _editingScheduledSessions;
            } else {
                const newProjectId = Date.now();
                savedProjectId = newProjectId;
                projects.push({
                    id: newProjectId,
                    name: name,
                    icon: icon,
                    color: color,
                    startDate: startDate,
                    endDate: endDate,
                    status: status || 'active',
                    description: description,
                    tools: selectedTools,
                    archived: false,
                    scheduledSessions: _editingScheduledSessions,
                });
                
                // Auto-create Plan and Guidelines notes
                notes.push({
                    id: Date.now() + 1,
                    title: `${name} - Plan`,
                    content: '',
                    project: newProjectId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                
                notes.push({
                    id: Date.now() + 2,
                    title: `${name} - Guidelines`,
                    content: '',
                    project: newProjectId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                
                saveNotes();
            }

            saveProjects();
            renderProjects();
            renderProjectsTab();
            if (currentProjectId === savedProjectId) {
                renderProjectDetailHeader(currentProjectId);
            }
            closeProjectModal();
        }

        function deleteProject(projectId) {
            if (!confirm('Delete this project? Tasks will not be deleted.')) return;
            projects = projects.filter(p => p.id !== projectId);
            saveProjects();
            renderProjects();
            renderProjectsTab();
            renderTasks();
            if (currentProjectId === projectId) {
                closeProjectDetail();
            }
        }

        function deleteCurrentProject() {
            deleteProject(editingId);
            closeProjectModal();
        }

        function closeProjectModal() {
            document.getElementById('projectModal').classList.remove('active');
            editingId = null;
        }

        // ========================================
        // SCHEDULED SESSIONS
        // ========================================
        let _editingScheduledSessions = [];

        function renderScheduledSessions() {
            const el = document.getElementById('scheduledSessionsList');
            if (!el) return;
            if (_editingScheduledSessions.length === 0) {
                el.innerHTML = '<div style="color:var(--text-secondary); font-size:13px; padding:4px 0 8px;">No sessions scheduled.</div>';
                return;
            }
            el.innerHTML = _editingScheduledSessions.map((s, i) =>
                `<div style="display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid var(--border-color);">
                    <span style="font-weight:600; min-width:36px;">${s.day}</span>
                    <span>${s.startTime} – ${s.endTime}</span>
                    <button type="button" onclick="removeScheduledSession(${i})" style="margin-left:auto; background:none; border:none; color:var(--error-color); cursor:pointer; font-size:18px; line-height:1;">×</button>
                </div>`
            ).join('');
        }

        function addScheduledSession() {
            const day = document.getElementById('newSessionDay').value;
            const startTime = document.getElementById('newSessionStart').value;
            const endTime = document.getElementById('newSessionEnd').value;
            if (!startTime || !endTime) return alert('Please set start and end times');
            if (startTime >= endTime) return alert('End time must be after start time');
            _editingScheduledSessions.push({ day, startTime, endTime });
            renderScheduledSessions();
        }

        function removeScheduledSession(index) {
            _editingScheduledSessions.splice(index, 1);
            renderScheduledSessions();
        }

        // ========================================
        // TASKS
        // ========================================
        
    function toggleFabMenu(e) {
    e.stopPropagation();
    const menu = document.getElementById('fabAddMenu');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

function fabAction(type) {
    document.getElementById('fabAddMenu').style.display = 'none';
    if (type === 'session') openStartSessionModal();
    else if (type === 'habit') showAddHabitModal();
    else if (type === 'projects') openProjectRegistry();
}

const _sectionCollapsed = JSON.parse(localStorage.getItem('lifescore_section_collapsed') || '{"projects":true,"tasks":true,"notes":true}');

function toggleProjectSection(key) {
    _sectionCollapsed[key] = !_sectionCollapsed[key];
    localStorage.setItem('lifescore_section_collapsed', JSON.stringify(_sectionCollapsed));
    applyProjectSectionStates();
}

function applyProjectSectionStates() {
    const map = {
        projects: { content: 'projectsListView', toggle: 'projectsSectionToggle' },
        tasks:    { content: 'tasksList',         toggle: 'tasksSectionToggle' },
        notes:    { content: 'notesList',          toggle: 'notesSectionToggle' },
    };
    for (const [key, { content, toggle }] of Object.entries(map)) {
        const collapsed = _sectionCollapsed[key] !== false;
        const contentEl = document.getElementById(content);
        const toggleEl  = document.getElementById(toggle);
        if (contentEl) contentEl.style.display = collapsed ? 'none' : '';
        if (toggleEl)  toggleEl.textContent = collapsed ? '▶' : '▼';
    }
}

function smartAddButton() { toggleFabMenu({ stopPropagation: () => {} }); }
function showAddModal() { toggleFabMenu({ stopPropagation: () => {} }); }

        function showAddTaskModal() {
            editingId = null;
            editingType = 'task';
            
            document.getElementById('itemModalTitle').textContent = 'Add Task';
            document.getElementById('modalTitleLabel').textContent = 'Title';
            document.getElementById('modalTitle').value = '';
            document.getElementById('modalProject').value = '';
            document.getElementById('modalDate').value = '';
            document.getElementById('modalTime').value = '';
            document.getElementById('modalTaskReminderTime').value = '';
            document.getElementById('modalRepeat').value = 'none';
            document.getElementById('modalTaskDetails').value = '';
            
            document.getElementById('habitDetailsContainer').style.display = 'none';
            document.getElementById('taskSpecificFields').style.display = 'block';
            document.getElementById('habitSpecificFields').style.display = 'none';
            document.getElementById('deleteItemBtn').style.display = 'none';
            document.getElementById('itemModal').classList.remove('habit-mode');
            
            document.getElementById('itemModal').classList.add('active');
        }

        function showAddHabitModal() {
            editingId = null;
            editingType = 'habit';
            
            document.getElementById('itemModalTitle').textContent = 'Add Habit';
            document.getElementById('modalTitleLabel').textContent = 'Habit Name';
            document.getElementById('modalTitle').value = '';
            document.getElementById('modalProject').value = '';
            document.getElementById('modalHabitType').value = 'positive';
            document.getElementById('modalDifficulty').value = 'medium';
            document.getElementById('modalMeasurable').checked = false;
            document.getElementById('modalTargetValue').value = '';
            document.getElementById('modalUnit').value = '';
            document.getElementById('modalPeriod').value = 'daily';
            document.getElementById('modalHabitReminderTime').value = '';
            document.getElementById('modalHabitStartDate').value = getLocalDateStr();
            document.getElementById('modalHabitDetails').value = '';
            
            document.getElementById('habitDetailsContainer').style.display = 'block';
            
            document.getElementById('taskSpecificFields').style.display = 'none';
            document.getElementById('habitSpecificFields').style.display = 'block';
            document.getElementById('measurableFields').style.display = 'none';
            document.getElementById('deleteItemBtn').style.display = 'none';
            document.getElementById('itemModal').classList.add('habit-mode');
            
            document.querySelectorAll('#habitDaysSelector .day-chip').forEach(chip => {
                chip.classList.add('selected');
            });

            toggleMeasurableFields();
            document.getElementById('itemModal').classList.add('active');
        }

        function updateWeightDisplay() {}


        
        function editTask(taskId) {
            const task = tasks.find(t => t.id === taskId);
            if (!task) return;

            editingId = taskId;
            editingType = 'task';
            
            document.getElementById('itemModalTitle').textContent = 'Edit Task';
            document.getElementById('modalTitleLabel').textContent = 'Title';
            document.getElementById('modalTitle').value = task.text || task.title || '';
            document.getElementById('modalProject').value = task.project || '';
            document.getElementById('modalDate').value = task.dueDate || '';
            document.getElementById('modalTime').value = task.dueTime || '';
            document.getElementById('modalTaskReminderTime').value = task.reminderTime || '';
            document.getElementById('modalRepeat').value = task.repeat || 'none';
            document.getElementById('modalTaskDetails').value = task.details || '';
            
            document.getElementById('habitDetailsContainer').style.display = 'none';
            document.getElementById('taskSpecificFields').style.display = 'block';
            document.getElementById('habitSpecificFields').style.display = 'none';
            document.getElementById('deleteItemBtn').style.display = 'block';
            document.getElementById('itemModal').classList.remove('habit-mode');
            
            toggleRepeatOptions();
            
            if (task.repeat === 'custom' && task.customDays) {
                document.querySelectorAll('#taskDaysSelector .day-chip').forEach(chip => {
                    chip.classList.toggle('selected', task.customDays.includes(parseInt(chip.dataset.day)));
                });
            }
            
            document.getElementById('itemModal').classList.add('active');
        }

        function editHabit(habitId) {
            const habit = habits.find(h => String(h.id) === String(habitId));
            if (!habit) return;

            editingId = habitId;
            editingType = 'habit';
            
            document.getElementById('itemModalTitle').textContent = 'Edit Habit';
            document.getElementById('modalTitleLabel').textContent = 'Habit Name';
            document.getElementById('modalTitle').value = habit.name || habit.text || '';
            document.getElementById('modalProject').value = habit.project || '';
            
            document.getElementById('modalHabitType').value = habit.type || 'positive';
            document.getElementById('modalDifficulty').value = habit.difficulty || 'medium';
            document.getElementById('modalMeasurable').checked = habit.measurable || false;
            document.getElementById('modalTargetValue').value = habit.measurable ? habit.target_value : '';
            document.getElementById('modalUnit').value = habit.measurable ? habit.unit : '';
            document.getElementById('modalPeriod').value = habit.period || 'daily';
            document.getElementById('modalHabitReminderTime').value = habit.reminderTime || '';
            document.getElementById('modalHabitStartDate').value = habit.startTrackingDate || getLocalDateStr();
            document.getElementById('modalHabitDuration').value = habit.duration || 30;
            document.getElementById('modalHabitDetails').value = habit.details || '';
            
            document.getElementById('habitDetailsContainer').style.display = 'block';
            
            document.getElementById('taskSpecificFields').style.display = 'none';
            document.getElementById('habitSpecificFields').style.display = 'block';
            document.getElementById('measurableFields').style.display = habit.measurable ? 'block' : 'none';
            document.getElementById('deleteItemBtn').style.display = 'block';
            document.getElementById('itemModal').classList.add('habit-mode');
            
            const habitDays = habit.customDays || [0,1,2,3,4,5,6];
            document.querySelectorAll('#habitDaysSelector .day-chip').forEach(chip => {
                chip.classList.toggle('selected', habitDays.includes(parseInt(chip.dataset.day)));
            });

            toggleMeasurableFields();
            document.getElementById('itemModal').classList.add('active');
        }

        function toggleMeasurableFields() {
            const measurable = document.getElementById('modalMeasurable').checked;
            document.getElementById('measurableFields').style.display = measurable ? 'block' : 'none';
            const dayContainer = document.getElementById('habitDaySelectorContainer');
            if (dayContainer) dayContainer.classList.toggle('hidden', measurable);
        }

        function toggleRepeatOptions() {
            const repeat = document.getElementById('modalRepeat').value;
            const container = document.getElementById('customDaysContainer');
            if (container) container.style.display = repeat === 'custom' ? 'block' : 'none';
        }
function handleProjectSelect() {
    const select = document.getElementById('modalProject');
    const newProjectInput = document.getElementById('newProjectInput');
    
    if (select.value === '__new__') {
        newProjectInput.style.display = 'block';
        document.getElementById('quickProjectName').focus();
    } else {
        newProjectInput.style.display = 'none';
    }
}

function toggleTaskFilterMenu(event) {
    const menu = document.getElementById('taskFilterMenu');
    if (!menu) return;
    const isActive = menu.classList.contains('active');
    document.querySelectorAll('.habit-filter-menu').forEach(m => m.classList.remove('active'));
    if (!isActive) {
        const rect = event.currentTarget.getBoundingClientRect();
        menu.style.top = `${rect.bottom + 4}px`;
        menu.style.left = `${Math.max(8, rect.left)}px`;
        menu.classList.add('active');
    }
}

function populateTaskProjectFilterList() {
    const container = document.getElementById('taskProjectFilterList');
    if (!container) return;
    const activeProjects = projects.filter(p => !p.archived);
    container.innerHTML = `<label><input type="radio" name="taskProjectFilter" value="all" ${taskProjectFilter === 'all' ? 'checked' : ''} onchange="setTaskProjectFilter('all')"> All Projects</label>` +
        activeProjects.map(p => `<label><input type="radio" name="taskProjectFilter" value="${p.id}" ${String(taskProjectFilter) === String(p.id) ? 'checked' : ''} onchange="setTaskProjectFilter('${p.id}')"> ${escapeHtml(p.name)}</label>`).join('');
}

function setTaskDateFilter(value) {
    currentFilter = value;
    renderTasks();
}

function setTaskProjectFilter(value) {
    taskProjectFilter = value;
    currentProject = value === 'all' ? null : parseInt(value);
    renderTasks();
}

function toggleShowSkipped() {
    showSkipped = document.getElementById('showSkippedToggle')?.checked || false;
    renderTasks();
}

function clearTaskFilters() {
    currentFilter = 'all';
    currentProject = null;
    taskProjectFilter = 'all';
    showCompleted = false;
    showSkipped = false;
    const c = document.getElementById('showCompletedToggle'); if (c) c.checked = false;
    const s = document.getElementById('showSkippedToggle'); if (s) s.checked = false;
    const dateRadio = document.querySelector('input[name="taskDateFilter"][value="all"]'); if (dateRadio) dateRadio.checked = true;
    populateTaskProjectFilterList();
    renderTasks();
}

function createQuickProject() {
    const name = document.getElementById('quickProjectName').value.trim();
    if (!name) return alert('Please enter a project name');
    
    const newProject = {
        id: Date.now(),
        name: name,
        icon: '📁',
        color: '#1967d2',
        archived: false
    };
    
    projects.push(newProject);
    saveProjects();
    renderProjects();
    updateProjectSelects();
    
    // Select the new project
    document.getElementById('modalProject').value = newProject.id;
    document.getElementById('newProjectInput').style.display = 'none';
    document.getElementById('quickProjectName').value = '';
}

        function saveItem() {
            const title = document.getElementById('modalTitle').value.trim();
            if (!title) return alert('Please enter a title');
            
            const projectId = document.getElementById('modalProject').value ? parseInt(document.getElementById('modalProject').value) : null;
            if (editingType === 'task' && !projectId) return alert('Please select a project');

            const commonDetails = editingType === 'habit'
                ? (document.getElementById('modalHabitDetails')?.value || '')
                : (document.getElementById('modalTaskDetails')?.value || '');
            const commonData = {
                text: title,
                project: projectId,
                details: commonDetails.trim()
            };

            if (editingType === 'task') {
                const customDays = Array.from(document.querySelectorAll('#taskDaysSelector .day-chip.selected')).map(c => parseInt(c.dataset.day));
                const taskData = {
                    ...commonData,
                    dueDate: document.getElementById('modalDate').value,
                    dueTime: document.getElementById('modalTime').value,
                    reminderTime: document.getElementById('modalTaskReminderTime').value || null,
                    repeat: document.getElementById('modalRepeat').value,
                    customDays: customDays
                };

                if (editingId) {
                    const task = tasks.find(t => t.id === editingId);
                    Object.assign(task, taskData);
                } else {
                    tasks.unshift({
                        id: Date.now(),
                        completed: false,
                        skipped: false,
                        ...taskData
                    });
                }
                saveTasks();
                renderTasks();
                renderTodayView();
                refreshCurrentProjectView();
            } else {
                const habitDays = Array.from(document.querySelectorAll('#habitDaysSelector .day-chip.selected')).map(c => parseInt(c.dataset.day));
                const measurable = document.getElementById('modalMeasurable').checked;
                const difficulty = document.getElementById('modalDifficulty').value || 'medium';

                const habitData = {
                    name: title,
                    icon: editingId ? (habits.find(h => String(h.id) === String(editingId))?.icon || '🎯') : '🎯',
                    ...commonData,
                    type: document.getElementById('modalHabitType').value,
                    habitType: document.getElementById('modalHabitType').value,
                    difficulty: difficulty,
                    customDays: measurable ? [0,1,2,3,4,5,6] : habitDays,
                    measurable: measurable,
                    target_value: measurable ? (document.getElementById('modalTargetValue').value !== '' ? parseFloat(document.getElementById('modalTargetValue').value) : 1) : 1,
targetValue: measurable ? (document.getElementById('modalTargetValue').value !== '' ? parseFloat(document.getElementById('modalTargetValue').value) : 1) : 1,
unit: measurable ? document.getElementById('modalUnit').value.trim() || 'count' : 'count',
period: measurable ? document.getElementById('modalPeriod').value : 'daily',
                    reminderTime: document.getElementById('modalHabitReminderTime').value || null,
                    startTrackingDate: document.getElementById('modalHabitStartDate').value || getLocalDateStr(),
                    duration: parseInt(document.getElementById('modalHabitDuration').value) || 30,
                    streakCurrent: 0,
                    streakLongest: 0
                };

                if (editingId) {
                    const habit = habits.find(h => String(h.id) === String(editingId));
                    if (!habit) return alert('Could not find habit to update. Please close and try again.');
                    habitData.streakCurrent = habit.streakCurrent || 0;
                    habitData.streakLongest = habit.streakLongest || 0;
                    Object.assign(habit, habitData);
                } else {
                    habits.push({
                        id: Date.now(),
                        ...habitData
                    });
                }
                saveHabits();
                populateHabitFilterProjects();
                renderHabitLog();
                renderTodayView();
                refreshCurrentProjectView();
            }

            setTimeout(() => closeItemModal(), 0);
        }

        function deleteCurrentItem() {
            if (editingType === 'task') {
                if (confirm('Delete this task?')) {
                    tasks = tasks.filter(t => t.id !== editingId);
                    saveTasks();
                    renderTasks();
                    renderTodayView();
                    refreshCurrentProjectView();
                }
            } else {
                if (confirm('Delete this habit? All history will be lost.')) {
                    habits = habits.filter(h => h.id !== editingId);
                    delete habitLogs[editingId];
                    saveHabits();
                    saveHabitLogs();
                    populateHabitFilterProjects();
                    renderHabitLog();
                    renderTodayView();
                    refreshCurrentProjectView();
                }
            }
            closeItemModal();
        }

        function closeItemModal() {
    const modal = document.getElementById('itemModal');
    if (modal) {
        modal.classList.remove('active');
        modal.classList.remove('habit-mode');
    }
    editingId = null;
    editingType = null;
}

        function setupDaySelectors() {
            document.querySelectorAll('.day-selector').forEach(selector => {
                selector.querySelectorAll('.day-chip').forEach(chip => {
                    chip.addEventListener('click', function() {
                        this.classList.toggle('selected');
                    });
                });
            });
        }

        function setupIconPicker() {
            document.querySelectorAll('.icon-option').forEach(opt => {
                opt.addEventListener('click', function() {
                    document.querySelectorAll('.icon-option').forEach(o => o.classList.remove('selected'));
                    this.classList.add('selected');
                });
            });
        }

        function setupColorPicker() {
            document.querySelectorAll('.color-picker').forEach(picker => {
                picker.querySelectorAll('.color-option').forEach(opt => {
                    opt.addEventListener('click', function() {
                        picker.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
                        this.classList.add('selected');
                    });
                });
            });
        }
function toggleSessionFields() {
            const isChecked = document.getElementById('projectIsSession').checked;
            const container = document.getElementById('sessionFieldsContainer');
            if (container) {
                container.style.display = isChecked ? 'block' : 'none';
            }
        }
        function renderTasks() {
            const filtered = getFilteredTasks();
            const list = document.getElementById('tasksList');
            if (!list) return;

            updateProjectCounts();

            if (filtered.length === 0) {
                list.innerHTML = '<div class="empty-state"><div>✨</div><div>No tasks here!</div></div>';
                return;
            }

            list.innerHTML = filtered.map(task => renderTask(task)).join('');
        }
        function renderTask(task) {
            const project = projects.find(p => p.id === task.project);
            
            // Check if task is in the future (not today)
            const today = new Date();
            today.setHours(0,0,0,0);
            const taskDate = task.dueDate ? new Date(task.dueDate + 'T00:00:00') : null;
            if (taskDate) taskDate.setHours(0,0,0,0);
            const isFuture = taskDate && taskDate.getTime() > today.getTime();
            

            let detailsHtml = '';
            if (task.details) {
                detailsHtml = `<div class="details-section">${escapeHtml(task.details)}</div>`;
            }

            return `
                <div class="task-item ${task.completed ? 'completed' : ''} ${task.skipped ? 'skipped' : ''} ${isFuture ? 'future' : ''}">
                    <div class="task-main">
                        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} ${isFuture ? 'disabled' : ''} onchange="toggleTask(${task.id})">
                        <div class="task-content">
                            <div class="task-text">
                                ${linkify(task.text)}
                            </div>
                            <div class="task-meta">
                                ${project ? `<span>${project.icon} ${escapeHtml(project.name)}</span>` : ''}
                                ${task.dueDate ? `<span>${getDueInfo(task)}</span>` : ''}
                                ${task.repeat !== 'none' ? `<span class="label-chip" style="background: var(--accent-color)20; color: var(--accent-color);">🔄 ${task.repeat}</span>` : ''}
                                ${task.skipped ? `<span class="label-chip" style="background: #9AA0A620; color: #5f6368;">⏭️ Skipped</span>` : ''}
                                ${task.reminderTime ? `<span class="label-chip" style="background: var(--bg-tertiary); color: var(--text-secondary);">⏰ ${task.reminderTime}</span>` : ''}
                            </div>
                            ${detailsHtml}
                        </div>
                        <div class="task-actions">
                            ${!task.completed && !task.skipped ? `<button class="btn-secondary" style="padding: 4px 8px; font-size: 12px; margin-right: 8px;" onclick="event.stopPropagation(); skipTask(${task.id})">⏭️ Skip</button>` : ''}
                            ${task.skipped ? `<button class="btn-secondary" style="padding: 4px 8px; font-size: 12px; margin-right: 8px;" onclick="event.stopPropagation(); unskipTask(${task.id})">↩️ Unskip</button>` : ''}
                            <button class="more-btn" onclick="editTask(${task.id})">⋮</button>
                        </div>
                    </div>
                </div>
            `;
        }

        function toggleTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Check if task is in future (not today)
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.toISOString().split('T')[0];
    
    const taskDate = task.dueDate ? new Date(task.dueDate + 'T00:00:00') : null;
    if (taskDate) taskDate.setHours(0,0,0,0);
    if (taskDate && taskDate.getTime() > today.getTime()) {
        alert('Cannot complete future tasks');
        event.target.checked = false;
        return;
    }

   task.completed = !task.completed;
   if (task.completed) task.skipped = false;
    
    // Log completion
    const dateStr = getLocalDateStr(new Date(), true);
    if (task.completed) {
        if (!taskLogs[taskId]) taskLogs[taskId] = {};
        
        let points = settings.scoring?.bonus?.taskPoints || 2;
        
        taskLogs[taskId][dateStr] = {
            completed: true,
            points: points
        };
        task.completedDate = dateStr;
    } else {
                if (taskLogs[taskId] && taskLogs[taskId][dateStr]) {
                    delete taskLogs[taskId][dateStr];
                }
                task.completedDate = null;
            }

            if (task.completed && task.repeat !== 'none' && task.dueDate) {
                createNextOccurrence(task);
            }

            saveTasks();
            saveTaskLogs();
            renderTasks();
            renderTodayView();
            refreshCurrentProjectView();
            if (settings.gamificationEnabled) calculateScores();
        }
function skipTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    task.skipped = true;
    task.skippedDate = getLocalDateStr(new Date(), true);
    
    saveTasks();
    renderTasks();
    renderTodayView();
    refreshCurrentProjectView();
}

function unskipTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    task.skipped = false;
    task.skippedDate = null;
    
    saveTasks();
    renderTasks();
    renderTodayView();
    refreshCurrentProjectView();
}

        function createNextOccurrence(task) {
            const date = new Date(task.dueDate);
            
            if (task.repeat === 'custom') {
                const today = date.getDay();
                const sortedDays = task.customDays.sort((a,b) => a-b);
                let nextDay = sortedDays.find(d => d > today);
                if (!nextDay) {
                    nextDay = sortedDays[0];
                    date.setDate(date.getDate() + 7);
                }
                const daysToAdd = nextDay - today;
                date.setDate(date.getDate() + (daysToAdd >= 0 ? daysToAdd : daysToAdd + 7));
            } else {
                switch (task.repeat) {
                    case 'daily': date.setDate(date.getDate() + 1); break;
                    case 'weekly': date.setDate(date.getDate() + 7); break;
                    case 'monthly': date.setMonth(date.getMonth() + 1); break;
                }
            }

            tasks.unshift({
                ...task,
                id: Date.now(),
                completed: false,
                completedDate: null,
                dueDate: date.toISOString().split('T')[0]
            });
        }

        
        function getFilteredTasks() {
            let filtered = tasks;

            if (currentProject !== null) {
                filtered = filtered.filter(t => t.project === currentProject);
            }
            if (!showSkipped) {
                filtered = filtered.filter(t => !t.skipped);
            }

            const today = new Date();
            today.setHours(0,0,0,0);
            const weekEnd = new Date(today);
            weekEnd.setDate(weekEnd.getDate() + 7);

            switch (currentFilter) {
    case 'all':
        return showCompleted ? filtered : filtered.filter(t => !t.completed);
    case 'today':
        return filtered.filter(t => {
            if (showCompleted ? false : t.completed) return false;
            if (!t.dueDate) return false;
            const td = new Date(t.dueDate);
            td.setHours(0,0,0,0);
            const todayDate = new Date();
            todayDate.setHours(0,0,0,0);
            return td.getTime() === todayDate.getTime();
        });
    case 'week':
        return filtered.filter(t => {
            if (showCompleted ? false : t.completed) return false;
            if (!t.dueDate) return false;
            const td = new Date(t.dueDate);
            td.setHours(0,0,0,0);
            return td >= today && td <= weekEnd;
        });
    case 'overdue':
        return filtered.filter(t => {
            if (showCompleted ? false : t.completed) return false;
            if (!t.dueDate) return false;
            const td = new Date(t.dueDate);
            td.setHours(0,0,0,0);
            return td < today;
        });
    default:
        return showCompleted ? filtered : filtered.filter(t => !t.completed);
}
        }

        function linkify(text) {
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            return escapeHtml(text).replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
        }

        function getDueInfo(task) {
            const date = new Date(task.dueDate);
            const today = new Date();
            today.setHours(0,0,0,0);
            const td = new Date(task.dueDate);
            td.setHours(0,0,0,0);
            const diff = Math.floor((td - today) / (1000*60*60*24));
            
            const time = task.dueTime ? ` ${task.dueTime}` : '';
            
            if (diff === 0) return `📅 Today${time}`;
            if (diff === 1) return `📅 Tomorrow${time}`;
            if (diff < 0) return `⚠️ ${Math.abs(diff)}d ago${time}`;
            if (diff <= 7) return `📅 ${date.toLocaleDateString('en-US', {weekday: 'short'})}${time}`;
            return `📅 ${date.toLocaleDateString()}${time}`;
        }

        // ========================================
        // HABITS
        // ========================================

        function toggleHabitFilterMenu(key, event) {
            document.querySelectorAll('.habit-filter-menu').forEach(menu => menu.classList.remove('active'));
            const menu = document.getElementById(`habitFilter${key.charAt(0).toUpperCase() + key.slice(1)}Menu`);
            if (menu) {
                if (event?.currentTarget) {
                    const rect = event.currentTarget.getBoundingClientRect();
                    menu.style.top = `${rect.bottom + 4}px`;
                    menu.style.left = `${Math.max(8, rect.left)}px`;
                }
                menu.classList.add('active');
            }
        }

        function handleHabitFilterOutsideClick(event) {
            if (!event.target.closest('.habit-filter-menu') && !event.target.closest('.habit-header-filter-btn')) {
                document.querySelectorAll('.habit-filter-menu').forEach(menu => menu.classList.remove('active'));
            }
        }

        function populateHabitFilterProjects() {
            const listEl = document.getElementById('habitFilterProjectList');
            if (!listEl) return;
            listEl.innerHTML = projects.map(p => {
                const checked = habitFilters.projects.includes(String(p.id)) ? 'checked' : '';
                return `<label><input type="checkbox" value="${p.id}" class="habit-filter-project-checkbox" ${checked} onchange="applyHabitFilters()"> ${escapeHtml(p.name)}</label>`;
            }).join('');
        }

        function applyHabitFilters() {
            habitFilters.nameSearch = (document.getElementById('habitFilterNameSearch')?.value || '').trim().toLowerCase();
            const checkedNameSort = document.querySelector('input[name="habitNameSort"]:checked');
            habitFilters.nameSort = checkedNameSort?.value || habitFilters.nameSort || 'none';
            habitFilters.timeSort = document.getElementById('habitFilterTimeSort')?.value || 'none';
            habitFilters.timeBuckets = [
                document.getElementById('habitFilterTimeNoTime')?.checked ? 'no-time' : null,
                document.getElementById('habitFilterTimeMorning')?.checked ? 'morning' : null,
                document.getElementById('habitFilterTimeAfternoon')?.checked ? 'afternoon' : null,
                document.getElementById('habitFilterTimeEvening')?.checked ? 'evening' : null
            ].filter(Boolean);
            habitFilters.projects = Array.from(document.querySelectorAll('.habit-filter-project-checkbox:checked')).map(i => String(i.value));
            habitFilters.types = [
                document.getElementById('habitFilterTypeDailyYesNo')?.checked ? 'daily-yesno' : null,
                document.getElementById('habitFilterTypeWeeklyYesNo')?.checked ? 'weekly-yesno' : null,
                document.getElementById('habitFilterTypeDailyMeasurable')?.checked ? 'daily-measurable' : null,
                document.getElementById('habitFilterTypeWeeklyMeasurable')?.checked ? 'weekly-measurable' : null,
                document.getElementById('habitFilterTypePositive')?.checked ? 'positive' : null,
                document.getElementById('habitFilterTypeNegative')?.checked ? 'negative' : null
            ].filter(Boolean);
            renderHabitLog();
        }

        function setHabitNameSort(value) {
            habitFilters.nameSort = value;
            applyHabitFilters();
        }

        function clearHabitFilter(type) {
            if (type === 'name') {
                habitFilters.nameSearch = '';
                habitFilters.nameSort = 'none';
                if (document.getElementById('habitFilterNameSearch')) document.getElementById('habitFilterNameSearch').value = '';
                document.querySelectorAll('input[name="habitNameSort"]').forEach(i => i.checked = false);
            } else if (type === 'time') {
                habitFilters.timeSort = 'none';
                if (document.getElementById('habitFilterTimeSort')) document.getElementById('habitFilterTimeSort').value = 'none';
                ['habitFilterTimeNoTime','habitFilterTimeMorning','habitFilterTimeAfternoon','habitFilterTimeEvening']
                    .forEach(id => { const el = document.getElementById(id); if (el) el.checked = false; });
            } else if (type === 'project') {
                habitFilters.projects = [];
                document.querySelectorAll('.habit-filter-project-checkbox').forEach(i => i.checked = false);
            } else if (type === 'type') {
                habitFilters.types = [];
                ['habitFilterTypeDailyYesNo','habitFilterTypeWeeklyYesNo','habitFilterTypeDailyMeasurable','habitFilterTypeWeeklyMeasurable','habitFilterTypePositive','habitFilterTypeNegative']
                    .forEach(id => { const el = document.getElementById(id); if (el) el.checked = false; });
            }
            applyHabitFilters();
        }

        function isHabitFilterActive(key) {
            if (key === 'name') return !!habitFilters.nameSearch || habitFilters.nameSort !== 'none';
            if (key === 'time') return habitFilters.timeSort !== 'none' || habitFilters.timeBuckets.length > 0;
            if (key === 'project') return habitFilters.projects.length > 0;
            if (key === 'type') return habitFilters.types.length > 0;
            return false;
        }

        function getHabitGridTemplateColumns() {
            return `${habitColumnWidths.habit}px repeat(7, ${habitColumnWidths.day}px)`;
        }

        function startHabitColumnResize(col, event) {
            event.preventDefault();
            activeHabitResize = { col, startX: event.clientX, startWidth: habitColumnWidths[col] };
        }

        function handleHabitColumnResizeMove(event) {
            if (!activeHabitResize) return;
            const minWidths = { habit: 180, time: 70, project: 100, type: 90, completion: 90, day: 60 };
            const delta = event.clientX - activeHabitResize.startX;
            habitColumnWidths[activeHabitResize.col] = Math.max(minWidths[activeHabitResize.col] || 60, activeHabitResize.startWidth + delta);
            const grid = document.getElementById('habitLogGrid');
            if (grid) grid.style.gridTemplateColumns = getHabitGridTemplateColumns();
        }

        function stopHabitColumnResize() {
            if (!activeHabitResize) return;
            activeHabitResize = null;
            localStorage.setItem('lifescore_habit_column_widths_v4', JSON.stringify(habitColumnWidths));
            renderHabitLog();
        }

        function getFilteredHabitsForLog(last7Days, today) {
            const todayStr = getLocalDateStr(today, true);
            const fromDate = last7Days?.[0] ? getLocalDateStr(last7Days[0]) : todayStr;
            let list = [...habits];

            if (habitFilters.nameSearch) {
                list = list.filter(h => (h.name || '').toLowerCase().includes(habitFilters.nameSearch));
            }
            if (habitFilters.projects.length > 0) {
                list = list.filter(h => habitFilters.projects.includes(String(h.project || '')));
            }
            if (habitFilters.types.length > 0) {
                list = list.filter(h => {
                    const period = (h.period || 'daily');
                    const isDaily = period === 'daily';
                    const isWeekly = ['weekly', 'monthly'].includes(period);
                    const isYesNo = !h.measurable || (h.target_value || 1) <= 1;
                    const isMeasurable = h.measurable && (h.target_value || 1) > 1;
                    const typeMatches =
                        (habitFilters.types.includes('daily-yesno') && isDaily && isYesNo) ||
                        (habitFilters.types.includes('weekly-yesno') && isWeekly && isYesNo) ||
                        (habitFilters.types.includes('daily-measurable') && isDaily && isMeasurable) ||
                        (habitFilters.types.includes('weekly-measurable') && isWeekly && isMeasurable) ||
                        (habitFilters.types.includes('positive') && (h.type || h.habitType) === 'positive') ||
                        (habitFilters.types.includes('negative') && (h.type || h.habitType) === 'negative');
                    return typeMatches;
                });
            }

            if (habitFilters.timeBuckets.length > 0) {
                list = list.filter(h => {
                    const mins = habitReminderToMinutes(h.reminderTime);
                    return habitFilters.timeBuckets.some(bucket => {
                        if (bucket === 'no-time') return !h.reminderTime;
                        if (!h.reminderTime || !Number.isFinite(mins)) return false;
                        if (bucket === 'morning') return mins < 12 * 60;
                        if (bucket === 'afternoon') return mins >= 12 * 60 && mins < 17 * 60;
                        if (bucket === 'evening') return mins >= 17 * 60;
                        return false;
                    });
                });
            }

            if (habitFilters.timeSort === 'earliest') {
                list.sort((a, b) => habitReminderToMinutes(a.reminderTime) - habitReminderToMinutes(b.reminderTime));
            } else if (habitFilters.timeSort === 'latest') {
                list.sort((a, b) => habitReminderToMinutes(b.reminderTime) - habitReminderToMinutes(a.reminderTime));
            } else {
                // Default: sort by scheduled time ascending, no-time habits go to bottom
                list.sort((a, b) => habitReminderToMinutes(a.reminderTime) - habitReminderToMinutes(b.reminderTime));
            }

            if (habitFilters.nameSort === 'az') list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            if (habitFilters.nameSort === 'za') list.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
            return list;
        }
        
        function changeWeek(offset) {
            currentWeekOffset += offset;
            renderHabitLog();
            renderHabitWeekChart();
        }

        function renderHabitLog() {
            const grid = document.getElementById('habitLogGrid');
            if (!grid) return;

            const weekStart = settings.weekStartsOn;
            const last7Days = [];
            const todayStr = getLocalDateStr(new Date(), true);
            const today = new Date(todayStr + 'T12:00:00');
            
            const startDate = new Date(today);
            startDate.setDate(startDate.getDate() + (currentWeekOffset * 7));
            
            while (startDate.getDay() !== weekStart) {
                startDate.setDate(startDate.getDate() - 1);
            }

            for (let i = 0; i < 7; i++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                last7Days.push(date);
            }

            // Update week display
            const weekDisplayEl = document.getElementById('currentWeekDisplay');
            if (weekDisplayEl) {
                const firstDay = last7Days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const lastDay = last7Days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                weekDisplayEl.textContent = `${firstDay} - ${lastDay}`;
            }

            grid.style.gridTemplateColumns = getHabitGridTemplateColumns();
            const filterBtn = (key) => `<button class="habit-header-filter-btn ${isHabitFilterActive(key) ? 'active' : ''}" onclick="toggleHabitFilterMenu('${key}', event)">${isHabitFilterActive(key) ? '▽' : '▼'}</button>`;
            const resize = (col) => `<span class="habit-col-resize" onmousedown="startHabitColumnResize('${col}', event)"></span>`;
            let html = `
                <div class="habit-log-header">Name</div>
            `;
            last7Days.forEach((date, idx) => {
                const dayName = date.toLocaleDateString('en-US', {weekday: 'short'});
                const isToday = date.toDateString() === today.toDateString();
                html += `<div class="habit-log-header header-col" style="${isToday ? 'font-weight: 700; color: var(--accent-color);' : ''}">${dayName}<br>${date.getDate()}${idx < last7Days.length - 1 ? resize('day') : ''}</div>`;
            });

           const filteredHabits = getFilteredHabitsForLog(last7Days, today);
           filteredHabits.forEach(habit => {
                const timeLabel = formatReminderTime(habit.reminderTime);
                const project = projects.find(p => p.id === habit.project);
                const todayLogState = getHabitLogState(habitLogs[habit.id]?.[getLocalDateStr(today)]);
                html += `<div class="habit-log-name habit-swipe-row" data-habit-id="${habit.id}" data-date="${getLocalDateStr(today)}" data-measurable="${habit.measurable ? '1' : '0'}">
                    <div class="swipe-bg-right">✓ Done</div>
                    <div class="swipe-bg-left">
                        <div class="swipe-skip">— Skip</div>
                        <div class="swipe-fail">✗ No</div>
                    </div>
                    <div class="swipe-content">
                        <span class="habit-drag-handle" draggable="true" data-habit-id="${habit.id}" title="Drag to reorder" onclick="event.stopPropagation()">⋮⋮</span>
                        <span style="margin-right: 8px;">${habit.icon || '🎯'}</span>
                        <span class="habit-name-text" title="${escapeHtml(habit.name)}" onclick="event.stopPropagation(); openHabitAnalyticsModal(${habit.id}, event)" style="cursor: pointer;">${escapeHtml(habit.name)}</span>
                        ${timeLabel ? `<span class="time-chip">${timeLabel}</span>` : ''}<span class="weight-badge">${(habit.difficulty || 'medium')[0].toUpperCase() + (habit.difficulty || 'medium').slice(1)} · ${getHabitXP(habit)} XP</span>
                        <button class="more-btn" onclick="event.preventDefault(); event.stopPropagation(); editHabit(${habit.id})" style="margin-left: auto;">⋮</button>
                    </div>
                </div>`;
                // Removed: Time, Project, Type, Completion columns
                
                // Weekly habits: show single aggregate column
                if (habit.period === 'weekly' && habit.measurable && habit.target_value > 1) {
                    const weekKey = `${last7Days[0].toISOString().split('T')[0]}_week`;
                    const wTrackStart = habit.startTrackingDate || '1900-01-01';
                    const weekEndStr = last7Days[6].toISOString().split('T')[0];
                    if (weekEndStr < wTrackStart) {
                        html += `<div class="habit-log-cell" style="grid-column: span 7; opacity: 0.3; cursor: default;">-</div>`;
                    } else {
                    let weekTotal = 0;
                    
                    // Sum up all days in this week
                    last7Days.forEach(date => {
                        const dateStr = date.toISOString().split('T')[0];
                        const dayLog = habitLogs[habit.id]?.[dateStr];
                        if (dayLog?.value) weekTotal += dayLog.value;
                    });
                    
                    const percentage = Math.min(100, Math.round((weekTotal / habit.target_value) * 100));
                    let cellClass = '';
                    let cellText = `${weekTotal}/${habit.target_value}`;
                    
                    if (weekTotal >= habit.target_value) {
                        cellClass = 'completed';
                        cellText = '✓';
                    } else if (weekTotal > 0) {
                        cellClass = 'partial';
                    }
                    
                   html += `<div class="habit-log-cell ${cellClass}" style="grid-column: span 7;" onclick="incrementWeeklyHabit(${habit.id})">
                        ${cellText}
                    </div>`;
                    }
                } else {
                    // Daily habits: show 7 separate columns
                    last7Days.forEach(date => {
                    const dateStr = date.toISOString().split('T')[0];
                    const dayOfWeek = date.getDay();
                    const habitDays = habit.customDays || [0,1,2,3,4,5,6];
                    const isApplicable = habitDays.includes(dayOfWeek);
                    
                   const trackStart = habit.startTrackingDate || '2099-01-01';
                   if (!isApplicable || dateStr < trackStart) {
    html += `<div class="habit-log-cell" style="opacity: 0.3; cursor: default;">-</div>`;
} else {
    const log = habitLogs[habit.id]?.[dateStr];
    const value = log?.value || 0;
    
    let cellClass = '';
    let cellText = '';
    
    if (habit.measurable) {
        if (habit.period === 'weekly' || habit.period === 'monthly') {
            // For weekly/monthly: show checkmark if done that day
            if (value > 0) {
                cellClass = 'completed';
                cellText = '✓';
            }
        } else {
            // For daily measurable habits
            if (habit.type === 'negative') {
                // Negative habits: ✓ if under/equal target, ✗ if over
                if (!log) {
                    // Not logged yet - blank
                } else if (value <= habit.target_value) {
                    cellClass = 'completed';
                    cellText = '✓';
                } else {
                    cellClass = 'failed';
                    cellText = '✗';
                }
            } else {
                // Positive habits: ✓ if met target, % if partial, X if past day with 0
                const percentage = Math.min(100, Math.round((value / habit.target_value) * 100));
                if (value >= habit.target_value) {
                    cellClass = 'completed';
                    cellText = '✓';
                } else if (value > 0) {
                    cellClass = 'partial';
                    cellText = `${percentage}%`;
                } else {
                    // value is 0 - check if day has passed AND after tracking started
                    const today = getLocalDateStr(new Date(), true);
                    const trackStart = habit.startTrackingDate || '1900-01-01';
                    if (dateStr < today && dateStr >= trackStart) {
                        cellClass = 'failed';
                        cellText = '✗';
                    }
                }
            }
        }
    } else {
        const trackStart = habit.startTrackingDate || '2099-01-01';
        const todayCutoff = getLocalDateStr(new Date(), true);
        const state = getHabitLogState(log);
        
                
        if (state === 'done') {
            cellClass = 'completed';
            cellText = '✓';
        } else if (state === 'failed') {
            cellClass = 'failed';
            cellText = '✗';
        } else if (state === 'skipped') {
            cellClass = 'skipped';
            cellText = '—';
        } else if (dateStr < todayCutoff && dateStr >= trackStart) {
            cellClass = 'failed';
            cellText = '✗';
        }
    }
    
    html += `<div class="habit-log-cell ${cellClass}" onclick="showHabitValueModal(${habit.id}, '${dateStr}')">
        ${cellText}
    </div>`;
}
            });
                }
            });

            grid.innerHTML = html;
            
            // Add drag and drop handlers
            const habitRows = grid.querySelectorAll('.habit-log-name[data-habit-id]');
            const dragHandles = grid.querySelectorAll('.habit-drag-handle[draggable="true"]');
            let draggedHabit = null;
            
            dragHandles.forEach(handle => {
                handle.addEventListener('dragstart', function(e) {
                    draggedHabit = this.closest('.habit-log-name');
                    if (!draggedHabit) return;
                    draggedHabit.style.opacity = '0.5';
                    this.style.cursor = 'grabbing';
                });

                handle.addEventListener('dragend', function(e) {
                    if (draggedHabit) {
                        draggedHabit.style.opacity = '1';
                    }
                    this.style.cursor = 'grab';
                    draggedHabit = null;
                });
            });

            habitRows.forEach(row => {
                
                row.addEventListener('dragover', function(e) {
                    e.preventDefault();
                    grid.querySelectorAll('.habit-log-name').forEach(r => r.style.borderBottom = '');
                    if (this !== draggedHabit && this.dataset.habitId) {
                        this.style.borderBottom = '2px solid var(--accent-color)';
                    }
                });
                
                row.addEventListener('drop', function(e) {
                    e.preventDefault();
                    grid.querySelectorAll('.habit-log-name').forEach(r => r.style.borderBottom = '');
                    
                    if (!draggedHabit || this === draggedHabit) return;
                    const draggedId = parseInt(draggedHabit.dataset.habitId);
                    const targetId = parseInt(this.dataset.habitId);
                    const draggedIdx = habits.findIndex(h => h.id === draggedId);
                    const targetIdx = habits.findIndex(h => h.id === targetId);
                    if (draggedIdx === -1 || targetIdx === -1) return;
                    
                    const [moved] = habits.splice(draggedIdx, 1);
                    habits.splice(targetIdx, 0, moved);
                    
                    saveHabits();
                    renderHabitLog();
                });
            });
            
            updateHabitScores();
            renderMobileHabitCards(last7Days, filteredHabits, todayStr);
            initHabitSwipes(grid);
            initHabitTouchReorder(grid);
        }

        function showHabitValueModal(habitId, dateStr) {
            // Prevent logging future dates
            const today = getLocalDateStr(new Date(), true);
            if (dateStr > today) {
                alert('Cannot log habits for future dates');
                return;
            }
            
            const habit = habits.find(h => String(h.id) === String(habitId));
            if (!habit) return;

            // Simple checkbox habits (non-measurable): just toggle
            if (!habit.measurable) {
                toggleSimpleHabit(habitId, dateStr);
                return;
            }
            
            currentHabitId = habitId;
            currentHabitDate = dateStr;
            
            const log = habitLogs[habitId]?.[dateStr];
            const currentValue = log?.value || 0;
            
            document.getElementById('habitValueModalTitle').textContent = `Log: ${habit.name}`;
            document.getElementById('habitValueInput').value = currentValue;
            document.getElementById('habitValueTarget').textContent = habit.target_value;
            document.getElementById('habitValueUnit').textContent = habit.unit;
            
            document.getElementById('habitValueModal').classList.add('active');
            setTimeout(() => document.getElementById('habitValueInput').focus(), 100);
        }

        function toggleSimpleHabit(habitId, dateStr) {
    // Prevent logging future dates
    const today = getLocalDateStr(new Date(), true);
    if (dateStr > today) {
        alert('Cannot log habits for future dates');
        return;
    }
    
    if (!habitLogs[habitId]) habitLogs[habitId] = {};
    
    const currentLog = habitLogs[habitId][dateStr];
    const currentState = currentLog?.state || 'blank'; // blank, done, failed
    
    let newState;
    if (currentState === 'blank') {
        newState = 'done';
    } else if (currentState === 'done') {
        newState = 'failed';
    } else {
        newState = 'blank';
    }
    
    setHabitLogState(habitId, dateStr, newState, newState === 'done' ? 1 : 0);

    saveHabitLogs();
    const _tsh = habits.find(h => String(h.id) === String(habitId));
    if (_tsh) recomputeStreakFromHistory(_tsh);
    renderHabitLog();
    renderTodayView();
    renderHabitWeekChart();
}
let currentWeeklyHabitId = null;
let currentWeekDates = [];

function incrementWeeklyHabit(habitId) {
    const habit = habits.find(h => String(h.id) === String(habitId));
    if (!habit) return;
    
    // Prevent logging future weeks
    if (currentWeekOffset > 0) {
        alert('Cannot log habits for future weeks');
        return;
    }
    
    currentWeeklyHabitId = habitId;
    
    // Get current week dates
    const weekStart = settings.weekStartsOn;
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() + (currentWeekOffset * 7));
    
    while (startDate.getDay() !== weekStart) {
        startDate.setDate(startDate.getDate() - 1);
    }
    
    currentWeekDates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        currentWeekDates.push(date);
    }
    
    // Calculate total for week
    let weekTotal = 0;
    currentWeekDates.forEach(date => {
        const dateStr = date.toISOString().split('T')[0];
        const dayLog = habitLogs[habitId]?.[dateStr];
        if (dayLog?.value) weekTotal += dayLog.value;
    });
    
    document.getElementById('weeklyHabitModalTitle').textContent = habit.name;
    document.getElementById('weeklyHabitCount').textContent = weekTotal;
    document.getElementById('weeklyHabitTarget').textContent = habit.target_value;
    document.getElementById('weeklyHabitUnit').textContent = habit.unit || 'times';
    
    document.getElementById('weeklyHabitModal').classList.add('active');
}

function adjustWeeklyHabit(change) {
    console.log('adjustWeeklyHabit called:', change, 'habitId:', currentWeeklyHabitId);
    
    // Get the actual date to log to based on currentWeekOffset
    const actualDate = new Date();
    actualDate.setDate(actualDate.getDate() + (currentWeekOffset * 7));
    const today = getLocalDateStr(actualDate, true);
    console.log('Logging to date:', today, 'weekOffset:', currentWeekOffset);
    
    if (!habitLogs[currentWeeklyHabitId]) habitLogs[currentWeeklyHabitId] = {};
    
    const currentLog = habitLogs[currentWeeklyHabitId][today];
    const currentValue = currentLog?.value || 0;
    const newValue = Math.max(0, currentValue + change);
    
    habitLogs[currentWeeklyHabitId][today] = {
        state: newValue > 0 ? 'done' : 'blank',
        value: newValue,
        completed: newValue > 0,
        timestamp: new Date().toISOString()
    };
    habitLogs[currentWeeklyHabitId][today] = {
        state: newValue > 0 ? 'done' : 'blank',
        value: newValue,
        completed: newValue > 0,
        timestamp: new Date().toISOString()
    };
    console.log('Saved new value:', newValue, 'Log:', habitLogs[currentWeeklyHabitId][today]);

    saveHabitLogs();
    const _awh = habits.find(h => String(h.id) === String(currentWeeklyHabitId));
    if (_awh) recomputeStreakFromHistory(_awh);

    // Award XP on the first completion of the day (state blank→done)
    if (change === 1 && currentValue === 0 && _awh) {
        showXpGainPopup(getHabitXP(_awh));
    }

    // Recalculate total
    let weekTotal = 0;
    currentWeekDates.forEach(date => {
        const dateStr = date.toISOString().split('T')[0];
        const dayLog = habitLogs[currentWeeklyHabitId]?.[dateStr];
        if (dayLog?.value) weekTotal += dayLog.value;
    });

    document.getElementById('weeklyHabitCount').textContent = weekTotal;
    renderHabitLog();
    renderTodayView();
}

function closeWeeklyHabitModal() {
    document.getElementById('weeklyHabitModal').classList.remove('active');
}
        function saveHabitValue() {
            const value = parseFloat(document.getElementById('habitValueInput').value) || 0;
            const habit = habits.find(h => String(h.id) === String(currentHabitId));
            if (!habit) return;

            if (!habitLogs[currentHabitId]) habitLogs[currentHabitId] = {};
            const prevState = getHabitLogState(habitLogs[currentHabitId][currentHabitDate]);
            const isNegative = (habit.habitType || habit.type) === 'negative';
let state;
if (isNegative) {
    state = value <= habit.target_value ? 'done' : 'failed';
} else {
    state = value >= habit.target_value ? 'done' : value > 0 ? 'failed' : 'blank';
}
            setHabitLogState(currentHabitId, currentHabitDate, state, value);

            saveHabitLogs();
            recomputeStreakFromHistory(habit);
            if (state === 'done' && prevState !== 'done') showXpGainPopup(getHabitXP(habit));
            closeHabitValueModal();
            renderHabitLog();
            renderTodayView();
            renderHabitWeekChart();
        }

        function closeHabitValueModal() {
            document.getElementById('habitValueModal').classList.remove('active');
            currentHabitId = null;
            currentHabitDate = null;
        }

        function buildHabitAnalyticsData(habit, days = 7) {
            const dates = [];
            const values = [];
            const states = [];
            const now = new Date();
            const startTrackingDate = habit.startTrackingDate || getLocalDateStr(now);
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(now.getDate() - i);
                const dateStr = getLocalDateStr(d);
                if (dateStr < startTrackingDate) continue;
                dates.push(dateStr.slice(5));
                const log = habitLogs[habit.id]?.[dateStr];
                let state = getHabitLogState(log);
                const today = getLocalDateStr(new Date(), true);
                if (state === 'blank' && dateStr < today) {
                    state = 'failed';
                }
                states.push(state);
                values.push(Number(log?.value) || 0);
            }
            return { dates, values, states, startTrackingDate };
        }

        function computeHabitAnalyticsStats(habit, data) {
            const { states, values } = data;
            let currentStreak = 0;
            let bestStreak = 0;
            let running = 0;
            let doneCount = 0;
            let measuredDays = 0;
            let measuredTotal = 0;
            for (let i = 0; i < states.length; i++) {
                const st = states[i];
                if (st === 'done') {
                    doneCount++;
                    running++;
                    currentStreak = running;
                } else {
                    running = 0;
                    currentStreak = 0;
                }
                bestStreak = Math.max(bestStreak, running);
                if (habit.measurable) {
                    measuredDays++;
                    measuredTotal += values[i] || 0;
                }
            }
            const completionRate = states.length ? roundToTwo((doneCount / states.length) * 100) : 0;
            const avgValue = measuredDays ? roundToTwo(measuredTotal / measuredDays) : 0;
            return { currentStreak, bestStreak, completionRate, avgValue };
        }
        let currentHabitAnalyticsId = null;
        let currentHabitAnalyticsDays = 7;

        function setHabitAnalyticsDays(days) {
            currentHabitAnalyticsDays = days;
            if (currentHabitAnalyticsId) {
                refreshHabitAnalytics();
            }
        }

        function updateHabitAnalyticsFromDates() {
            const startInput = document.getElementById('habitAnalyticsStartDate');
            const endInput = document.getElementById('habitAnalyticsEndDate');
            if (!startInput || !endInput) return;
            const start = new Date(startInput.value);
            const end = new Date(endInput.value);
            if (isNaN(start) || isNaN(end) || start > end) return;
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            currentHabitAnalyticsDays = diffDays;
            if (currentHabitAnalyticsId) {
                refreshHabitAnalytics();
            }
        }

        function refreshHabitAnalytics() {
            const habit = habits.find(h => String(h.id) === String(currentHabitAnalyticsId));
            if (!habit) return;
            const data = buildHabitAnalyticsData(habit, currentHabitAnalyticsDays);
            const stats = computeHabitAnalyticsStats(habit, data);
            const statsEl = document.getElementById('habitAnalyticsStats');
            if (statsEl) {
                const avgCell = habit.measurable ? `<div class="score-item"><div class="score-item-title">Average Value</div><div class="score-item-value" style="font-size:22px;">${stats.avgValue} ${escapeHtml(habit.unit || '')}</div></div>` : '';
                statsEl.innerHTML = `
                    <div class="score-item"><div class="score-item-title">Current Streak</div><div class="score-item-value" style="font-size:22px;">${stats.currentStreak} days</div></div>
                    <div class="score-item"><div class="score-item-title">Best Streak</div><div class="score-item-value" style="font-size:22px;">${stats.bestStreak} days</div></div>
                    <div class="score-item"><div class="score-item-title">Completion Rate</div><div class="score-item-value" style="font-size:22px;">${stats.completionRate}%</div></div>
                    ${avgCell}
                `;
            }
            const canvas = document.getElementById('habitAnalyticsChart');
            if (habitAnalyticsChart) habitAnalyticsChart.destroy();
            if (canvas && window.Chart) {
                const ctx = canvas.getContext('2d');
                if (!habit.measurable || (habit.target_value || 1) <= 1) {
                    const mapped = data.states.map(s => s === 'done' ? 1 : s === 'failed' ? -1 : null);
                    habitAnalyticsChart = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: data.dates,
                            datasets: [{
                                label: 'Completion Pattern',
                                data: mapped,
                                backgroundColor: (context) => {
                                    const y = context.parsed?.y;
                                    if (y === null || y === undefined) return 'rgba(0,0,0,0)';
                                    return y > 0 ? '#00C853' : '#FF5252';
                                },
                                borderWidth: 0
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                y: {
                                    min: -1.2,
                                    max: 1.2,
                                    ticks: { display: false },
                                    grid: { color: (ctx) => ctx.tick.value === 0 ? '#9AA0A6' : 'rgba(0,0,0,0)' }
                                },
                                x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } }
                            },
                            plugins: {
                                tooltip: {
                                    callbacks: {
                                        label: (ctx) => {
                                            const idx = ctx.dataIndex;
                                            const state = data.states[idx];
                                            const label = state === 'done' ? 'Completed ✓' : state === 'failed' ? 'Not done ✗' : 'No data';
                                            return `${data.dates[idx]}: ${label}`;
                                        }
                                    }
                                }
                            }
                        }
                    });
                } else {
                    const target = Number(habit.target_value) || 0;
                    const isNegative = (habit.habitType || habit.type) === 'negative';
                    habitAnalyticsChart = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: data.dates,
                            datasets: [
                                {
                                    label: habit.unit || 'Value',
                                    data: data.values,
                                    borderWidth: 3,
                                    pointRadius: 2,
                                    tension: 0.2,
                                    segment: {
                                        borderColor: (context) => {
                                            const value = context.p1.parsed.y;
                                            if (isNegative) return value > target ? '#FF5252' : '#00C853';
                                            return value >= target ? '#00C853' : '#FFC107';
                                        }
                                    }
                                },
                                {
                                    label: isNegative ? `Target: < ${target}` : `Goal: ${target}`,
                                    data: data.values.map(() => target),
                                    borderColor: '#9AA0A6',
                                    borderDash: [6, 6],
                                    pointRadius: 0,
                                    borderWidth: 2
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                tooltip: {
                                    callbacks: {
                                        label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}`
                                    }
                                }
                            }
                        }
                    });
                }
            }
        }


        function openHabitAnalyticsModal(habitId, event) {
            // Block if clicked on button - CHECK THIS FIRST
            if (event && event.target && event.target.closest('button')) {
                return;
            }
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            const habit = habits.find(h => String(h.id) === String(habitId));
            if (!habit) return;
            currentHabitAnalyticsId = habitId;
            currentHabitAnalyticsDays = 7;
            const data = buildHabitAnalyticsData(habit, 7);
            const stats = computeHabitAnalyticsStats(habit, data);
            const info = document.getElementById('habitAnalyticsInfo');
            if (info) {
                info.innerHTML = `<div style="font-size:22px; font-weight:700; color:var(--text-primary); margin-bottom:4px;">${escapeHtml(habit.name)}</div><div style="font-size:13px; color:var(--text-secondary);">Tracking since: ${escapeHtml(data.startTrackingDate)}</div>`;
            }
            const statsEl = document.getElementById('habitAnalyticsStats');
            if (statsEl) {
                const avgCell = habit.measurable ? `<div class="score-item"><div class="score-item-title">Average Value</div><div class="score-item-value" style="font-size:22px;">${stats.avgValue} ${escapeHtml(habit.unit || '')}</div></div>` : '';
                statsEl.innerHTML = `
                    <div class="score-item"><div class="score-item-title">Current Streak</div><div class="score-item-value" style="font-size:22px;">${stats.currentStreak} days</div></div>
                    <div class="score-item"><div class="score-item-title">Best Streak</div><div class="score-item-value" style="font-size:22px;">${stats.bestStreak} days</div></div>
                    <div class="score-item"><div class="score-item-title">Completion Rate</div><div class="score-item-value" style="font-size:22px;">${stats.completionRate}%</div></div>
                    ${avgCell}
                `;
            }
            const modal = document.getElementById('habitAnalyticsModal');
            if (modal) modal.classList.add('active');
            const canvas = document.getElementById('habitAnalyticsChart');
            if (habitAnalyticsChart) habitAnalyticsChart.destroy();
            if (canvas && window.Chart) {
                try {
                    const ctx = canvas.getContext('2d');
                    if (!habit.measurable) {
                        const mapped = data.states.map(s => s === 'done' ? 1 : s === 'failed' ? -1 : null);
                        habitAnalyticsChart = new Chart(ctx, {
                            type: 'bar',
                            data: {
                                labels: data.dates,
                                datasets: [{
                                    label: 'Completion Pattern',
                                    data: mapped,
                                    backgroundColor: (context) => {
                                        const y = context.parsed?.y;
                                        if (y === null || y === undefined) return 'rgba(0,0,0,0)';
                                        return y > 0 ? '#00C853' : '#FF5252';
                                    },
                                    borderWidth: 0
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    y: {
                                        min: -1.2,
                                        max: 1.2,
                                        ticks: { display: false },
                                        grid: { color: (ctx) => ctx.tick.value === 0 ? '#9AA0A6' : 'rgba(0,0,0,0)' }
                                    },
                                    x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } }
                                },
                                plugins: {
                                    tooltip: {
                                        callbacks: {
                                            label: (ctx) => {
                                                const idx = ctx.dataIndex;
                                                const state = data.states[idx];
                                                const label = state === 'done' ? 'Completed ✓' : state === 'failed' ? 'Not done ✗' : 'No data';
                                                return `${data.dates[idx]}: ${label}`;
                                            }
                                        }
                                    }
                                }
                            }
                        });
                    } else {
                        const target = Number(habit.target_value) || 0;
                        const isNegative = (habit.habitType || habit.type) === 'negative';
                        habitAnalyticsChart = new Chart(ctx, {
                            type: 'line',
                            data: {
                                labels: data.dates,
                                datasets: [
                                    {
                                        label: habit.unit || 'Value',
                                        data: data.values,
                                        borderWidth: 3,
                                        pointRadius: 2,
                                        tension: 0.2,
                                        segment: {
                                            borderColor: (context) => {
                                                const value = context.p1.parsed.y;
                                                if (isNegative) return value > target ? '#FF5252' : '#00C853';
                                                return value >= target ? '#00C853' : '#FFC107';
                                            }
                                        }
                                    },
                                    {
                                        label: isNegative ? (target === 0 ? 'Target: 0' : `Target: < ${target}`) : `Goal: ${target}`,
                                        data: data.values.map(() => target),
                                        borderColor: '#9AA0A6',
                                        borderDash: [6, 6],
                                        pointRadius: 0,
                                        borderWidth: 2
                                    }
                                ]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    tooltip: {
                                        callbacks: {
                                            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}`
                                        }
                                    }
                                }
                            }
                        });
                    }
                } catch (error) {
                    console.error('Habit analytics chart error:', error);
                    if (canvas) {
                        const chartContainer = canvas.parentElement;
                        if (chartContainer) chartContainer.textContent = 'Unable to render chart.';
                    }
                }
            }
            // Force modal to show with requestAnimationFrame
            requestAnimationFrame(() => {
                document.getElementById('habitAnalyticsModal').classList.add('active');
            });
        }

        function closeHabitAnalyticsModal() {
            document.getElementById('habitAnalyticsModal').classList.remove('active');
        }

        function updateHabitScores() {
            const today = getLocalDateStr(new Date(), true);

            let todayCompleted = 0;
            let todayTotal = 0;
            let todayScore = 0;
            let weekCompleted = 0;
            let weekTotal = 0;

            habits.forEach(habit => {
                const logs = habitLogs[habit.id] || {};
                
                // Today
                // Today
const habitDays = habit.customDays || [0,1,2,3,4,5,6];
if (habitDays.includes(new Date().getDay())) {
    todayTotal++;
    const todayLog = logs[today];
    
    // Check completion based on period
    let isDone = false;
    if (habit.period === 'weekly' || habit.period === 'monthly') {
        isDone = todayLog && todayLog.value > 0;
    } else {
        isDone = todayLog?.completed;
    }
    
    if (isDone) {
        todayCompleted++;
    }
    if (todayLog) {
        todayScore += calculateHabitDailyPoints(habit, todayLog.value);
    }
}

                // Week
for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    if (habitDays.includes(date.getDay())) {
        weekTotal++;
        const dateStr = date.toISOString().split('T')[0];
        const log = logs[dateStr];
        
        // Check completion based on period
        let isDone = false;
        if (habit.period === 'weekly' || habit.period === 'monthly') {
            isDone = log && log.value > 0;
        } else {
            isDone = log?.completed;
        }
        
        if (isDone) {
            weekCompleted++;
        }
    }
}
            });

            const todayPercentage = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;
            const weekPercentage = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;

            const todayPctEl = document.getElementById('todayHabitPercentage');
            if (todayPctEl) todayPctEl.textContent = todayPercentage + '%';
            
            const todayCompEl = document.getElementById('todayHabitsCompleted');
            if (todayCompEl) todayCompEl.textContent = `${todayCompleted} / ${todayTotal}`;
            
            if (settings.gamificationEnabled) {
                const scoreEl = document.getElementById('todayHabitScore');
                if (scoreEl) scoreEl.textContent = Math.round(todayScore);
            }
            
            const pctEl = document.getElementById('weekPercentage');
            if (pctEl) pctEl.textContent = weekPercentage + '%';
            
            const compEl = document.getElementById('weekCompletion');
            if (compEl) compEl.textContent = `${weekCompleted} / ${weekTotal}`;

            const progressBar = document.getElementById('weekProgressBar');
            if (progressBar) {
                progressBar.style.width = weekPercentage + '%';
                progressBar.className = 'progress-fill';
                if (weekPercentage >= 80) progressBar.classList.add('good');
                else if (weekPercentage >= 50) progressBar.classList.add('medium');
                else progressBar.classList.add('high');
            }
        }

        function renderHabitWeekChart() {
            const canvas = document.getElementById('habitWeekChart');
            if (!canvas || !canvas.getContext) return;

            const todayStr = getLocalDateStr(new Date(), true);

            // Last 7 days
            const days = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                days.push({ date: d, dateStr: getLocalDateStr(d, true), isToday: i === 0 });
            }

            // Per-day counts: done / failed / missed (scheduled past days not logged)
            const doneCounts   = [];
            const failedCounts = [];
            const missedCounts = [];
            const pcts         = [];
            const labels       = [];

            days.forEach(d => {
                const scheduled = habits.filter(h => {
                    if (h.startTrackingDate && h.startTrackingDate > d.dateStr) return false;
                    return (h.customDays || [0,1,2,3,4,5,6]).includes(d.date.getDay());
                });
                let done = 0, failed = 0, missed = 0;
                const isFuture = d.dateStr > todayStr;
                scheduled.forEach(h => {
                    const state = getHabitLogState(habitLogs[h.id]?.[d.dateStr]);
                    if (state === 'done') done++;
                    else if (state === 'failed') failed++;
                    else if (!isFuture) missed++;
                });
                doneCounts.push(done);
                failedCounts.push(failed);
                missedCounts.push(missed);
                const total = scheduled.length;
                pcts.push(total > 0 && !isFuture ? Math.round(done / total * 100) : null);
                const dayLabel = d.date.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' + d.date.getDate();
                labels.push(d.isToday ? dayLabel + ' ★' : dayLabel);
            });

            if (window.habitWeekChartInstance) {
                window.habitWeekChartInstance.destroy();
            }

            window.habitWeekChartInstance = new Chart(canvas.getContext('2d'), {
                type: 'bar',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'Completed',
                            data: doneCounts,
                            backgroundColor: '#10b981',
                            borderRadius: 4,
                            stack: 'habits'
                        },
                        {
                            label: 'Failed',
                            data: failedCounts,
                            backgroundColor: '#ef4444cc',
                            borderRadius: 0,
                            stack: 'habits'
                        },
                        {
                            label: 'Missed',
                            data: missedCounts,
                            backgroundColor: 'rgba(245,158,11,0.35)',
                            borderRadius: 0,
                            stack: 'habits'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            stacked: true,
                            grid: { display: false },
                            ticks: { font: { size: 12 } }
                        },
                        y: {
                            stacked: true,
                            beginAtZero: true,
                            ticks: { stepSize: 1, precision: 0 },
                            title: { display: true, text: 'Habits', font: { size: 11 } }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: { boxWidth: 12, padding: 14, font: { size: 12 } }
                        },
                        tooltip: {
                            callbacks: {
                                afterBody: (items) => {
                                    const idx = items[0].dataIndex;
                                    const pct = pcts[idx];
                                    const total = doneCounts[idx] + failedCounts[idx] + missedCounts[idx];
                                    return [
                                        `Total scheduled: ${total}`,
                                        pct !== null ? `Completion rate: ${pct}%` : ''
                                    ].filter(Boolean);
                                }
                            }
                        }
                    }
                }
            });
        }

        // ========================================
        // SCORING & CHARTS
        // ========================================

        function renderSessionAnalytics() {
    const fromInput = document.getElementById('sessionAnalyticsFrom');
    const toInput = document.getElementById('sessionAnalyticsTo');
    
    // Set defaults if empty (Monday of current week to today)
    if (!fromInput.value) {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon ... 6=Sat
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(now);
        monday.setDate(now.getDate() - daysToMonday);
        fromInput.value = getLocalDateStr(monday, true);
    }
    if (!toInput.value) {
        toInput.value = getLocalDateStr(new Date(), true);
    }
    
    const startDate = new Date(fromInput.value + 'T00:00:00');
    const endDate = new Date(toInput.value + 'T23:59:59');
    const period = Math.round((endDate - startDate) / 86400000) + 1;
    
    // Filter sessions in date range
    const sessionsInRange = sessionLogs.filter(s => {
        const sessionDate = new Date(s.startTime);
        return sessionDate >= startDate && sessionDate <= endDate && s.completed;
    });
    
    // Calculate stats
    const totalSessions = sessionsInRange.length;
    const totalMinutes = sessionsInRange.reduce((sum, s) => {
        const workedMin = Math.round((s.endTime - s.startTime) / 60000);
        return sum + workedMin;
    }, 0);
    
    // Calculate daily averages
    const avgSessionsPerDay = (totalSessions / period).toFixed(1);
    const avgMinutesPerDay = Math.round(totalMinutes / period);
    const avgHoursPerDay = (avgMinutesPerDay / 60).toFixed(1);
    
    // Update stats
    document.getElementById('sessionAnalyticsTotal').textContent = avgSessionsPerDay;
    document.getElementById('sessionAnalyticsAvgDuration').textContent = `${avgHoursPerDay}h`;
    
    // Prepare chart data - total minutes per day
    const dateLabels = [];
    const dailyMinutes = [];
    for (let i = 0; i < period; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = getLocalDateStr(date, true);
       const labelDate = new Date(dateStr + 'T12:00:00');
dateLabels.push(labelDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        
        // Sum minutes for this day
        const dayTotal = sessionsInRange
    .filter(s => {
        const sessionDateStr = getLocalDateStr(new Date(s.startTime), true);
        return sessionDateStr === dateStr;
    })
    .reduce((sum, s) => {
        const workedMin = Math.round((s.endTime - s.startTime) / 60000);
        return sum + workedMin;
    }, 0);
        
        dailyMinutes.push(dayTotal);
    }
    
    // Render chart (line graph)
    const canvas = document.getElementById('sessionAnalyticsChart');
    const ctx = canvas.getContext('2d');
    
    if (window.sessionAnalyticsChartInstance) {
        window.sessionAnalyticsChartInstance.destroy();
    }
    
    window.sessionAnalyticsChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dateLabels,
            datasets: [{
                label: 'Minutes Worked',
                data: dailyMinutes,
                backgroundColor: 'rgba(25, 103, 210, 0.1)',
                borderColor: 'rgba(25, 103, 210, 1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { 
                        stepSize: 60,
                        callback: function(value) {
                            return value + 'm';
                        }
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const mins = context.parsed.y;
                            const hours = (mins / 60).toFixed(1);
                            return `${mins}m (${hours}h)`;
                        }
                    }
                }
            }
        }
    });
    
    // By project breakdown
    const projectStats = {};
    sessionsInRange.forEach(session => {
        if (!projectStats[session.projectName]) {
            projectStats[session.projectName] = { count: 0, minutes: 0, focusSum: 0, focusCount: 0 };
        }
        const stats = projectStats[session.projectName];
        stats.count++;
        const workedMin = Math.round((session.endTime - session.startTime) / 60000);
        stats.minutes += workedMin;
        if (session.focusQuality != null) { stats.focusSum += session.focusQuality; stats.focusCount++; }
    });
    
    // Pie chart - hours by project
    const pieCanvas = document.getElementById('sessionAnalyticsPieChart');
    if (pieCanvas) {
        if (window.sessionPieChartInstance) window.sessionPieChartInstance.destroy();
        const projectNames = Object.keys(projectStats);
        const projectHours = projectNames.map(n => +(projectStats[n].minutes / 60).toFixed(1));
        const pieColors = ['#1967d2', '#e8710a', '#0d9488', '#7c3aed', '#db2777', '#ca8a04', '#059669', '#6366f1'];
        window.sessionPieChartInstance = new Chart(pieCanvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: projectNames,
                datasets: [{
                    data: projectHours,
                    backgroundColor: pieColors.slice(0, projectNames.length),
                    borderWidth: 2,
                    borderColor: 'var(--bg-primary)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, padding: 8, font: { size: 11 } } },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                const pct = total > 0 ? Math.round(ctx.parsed / total * 100) : 0;
                                return `${ctx.label}: ${ctx.parsed}h (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Build project list HTML using already-computed projectStats
    const _existingStats = true;
    
    
    const projectList = Object.entries(projectStats)
        .sort((a, b) => b[1].minutes - a[1].minutes)
        .map(([name, stats]) => {
            const hours = (stats.minutes / 60).toFixed(1);
            const avgFocus = stats.focusCount > 0 ? (stats.focusSum / stats.focusCount).toFixed(2) : null;
            const focusLabel = avgFocus ? ` · Focus: ${avgFocus}×` : '';
            return `
            <div style="display: flex; justify-content: space-between; padding: 8px 12px; background: var(--bg-tertiary); border-radius: 6px;">
                <span>${escapeHtml(name)}</span>
                <span style="color: var(--text-secondary);">${stats.count} sessions • ${hours}h${focusLabel}</span>
            </div>
        `}).join('');
    
    document.getElementById('sessionAnalyticsByProject').innerHTML = projectList || '<div style="color: var(--text-secondary); font-size: 14px;">No sessions recorded</div>';

    renderNotesLog(startDate, endDate);
}

function renderNotesLog(startDate, endDate) {
    const container = document.getElementById('notesLogContainer');
    if (!container) return;

    const entries = [];

    // Session notes
    sessionLogs.forEach(s => {
        if (!s.notes || !s.notes.trim() || !s.completed) return;
        const d = new Date(s.startTime);
        if (d < startDate || d > endDate) return;
        entries.push({
            date: d,
            dateStr: getLocalDateStr(d, true),
            type: 'session',
            label: escapeHtml(s.projectName || 'Session'),
            note: s.notes.trim()
        });
    });

    // Habit notes
    habits.forEach(h => {
        const logs = habitLogs[h.id];
        if (!logs) return;
        Object.entries(logs).forEach(([dateStr, log]) => {
            if (!log?.note || !log.note.trim()) return;
            const d = new Date(dateStr + 'T12:00:00');
            if (d < startDate || d > endDate) return;
            entries.push({
                date: d,
                dateStr,
                type: 'habit',
                label: escapeHtml(h.name),
                note: log.note.trim()
            });
        });
    });

    if (entries.length === 0) {
        container.innerHTML = '<div style="color:var(--text-secondary); font-size:14px;">No notes in this period.</div>';
        return;
    }

    entries.sort((a, b) => b.date - a.date);

    container.innerHTML = entries.map(e => {
        const badge = e.type === 'session'
            ? `<span style="font-size:11px; font-weight:600; padding:2px 7px; border-radius:10px; background:rgba(25,103,210,0.12); color:#1967d2;">Session</span>`
            : `<span style="font-size:11px; font-weight:600; padding:2px 7px; border-radius:10px; background:rgba(13,148,136,0.12); color:#0d9488;">Habit</span>`;
        const displayDate = new Date(e.dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `
            <div style="padding:12px 14px; background:var(--bg-tertiary); border-radius:8px; border-left:3px solid ${e.type === 'session' ? '#1967d2' : '#0d9488'};">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                    ${badge}
                    <span style="font-weight:600; font-size:13px;">${e.label}</span>
                    <span style="font-size:12px; color:var(--text-secondary); margin-left:auto;">${displayDate}</span>
                </div>
                <div style="font-size:13px; color:var(--text-primary); line-height:1.5; white-space:pre-wrap;">${escapeHtml(e.note)}</div>
            </div>`;
    }).join('');
}

function renderAdherenceAnalytics() {
    const fromEl = document.getElementById('adherenceFrom');
    const toEl = document.getElementById('adherenceTo');
    if (!fromEl || !toEl) return;

    if (!fromEl.value) {
        const now = new Date();
        const monday = new Date(now);
        const dow = now.getDay();
        monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
        fromEl.value = getLocalDateStr(monday, true);
    }
    if (!toEl.value) toEl.value = getLocalDateStr(new Date(), true);

    const fromDate = new Date(fromEl.value + 'T00:00:00');
    const toDate = new Date(toEl.value + 'T23:59:59');
    const todayStr = getLocalDateStr(new Date(), true);
    const nowMins = new Date().getHours() * 60 + new Date().getMinutes();

    const onTimeItems = [], lateItems = [], missedItems = [];

    let cur = new Date(fromDate);
    while (cur <= toDate) {
        const dateStr = getLocalDateStr(cur, true);
        const dayOfWeek = cur.getDay();
        const isPast = dateStr < todayStr;
        const isToday = dateStr === todayStr;

        habits.forEach(h => {
            if (!h.reminderTime) return;
            const days = h.customDays || [0,1,2,3,4,5,6];
            if (!days.includes(dayOfWeek)) return;
            const start = h.startTrackingDate ? new Date(h.startTrackingDate + 'T00:00:00') : new Date(0);
            if (cur < start) return;

            const log = habitLogs[h.id]?.[dateStr];
            const state = getHabitLogState(log);
            const [sh, sm] = h.reminderTime.split(':').map(Number);
            const scheduledMins = sh * 60 + sm;
            const fmtDate = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            if (state === 'done') {
                if (log.timestamp) {
                    const ct = new Date(log.timestamp);
                    const cMins = ct.getHours() * 60 + ct.getMinutes();
                    const diff = cMins - scheduledMins;
                    const actualStr = `${String(ct.getHours()).padStart(2,'0')}:${String(ct.getMinutes()).padStart(2,'0')}`;
                    if (diff <= 15) {
                        onTimeItems.push({ name: h.name, scheduled: h.reminderTime, actual: actualStr, diff, date: fmtDate });
                    } else {
                        lateItems.push({ name: h.name, scheduled: h.reminderTime, actual: actualStr, diff, date: fmtDate });
                    }
                } else {
                    onTimeItems.push({ name: h.name, scheduled: h.reminderTime, actual: '—', diff: 0, date: fmtDate });
                }
            } else if (isPast || (isToday && nowMins > scheduledMins + 15)) {
                const label = state === 'skipped' ? 'Skipped' : state === 'failed' ? 'Not done' : 'Not done';
                missedItems.push({ name: h.name, scheduled: h.reminderTime, actual: label, date: fmtDate });
            }
        });

        cur.setDate(cur.getDate() + 1);
    }

    const total = onTimeItems.length + lateItems.length + missedItems.length;
    const summaryEl = document.getElementById('adherenceSummary');
    if (summaryEl) {
        summaryEl.innerHTML = `
            <span style="color:#1E8E3E;font-weight:700;">${onTimeItems.length} On Time</span> &nbsp;
            <span style="color:#f59e0b;font-weight:700;">${lateItems.length} Late</span> &nbsp;
            <span style="color:#D93025;font-weight:700;">${missedItems.length} Missed</span>
            <span style="color:var(--text-secondary);font-size:12px;"> (${total} total with scheduled time)</span>`;
    }

    const canvas = document.getElementById('adherenceChart');
    if (canvas) {
        if (window._adherenceChartInstance) { window._adherenceChartInstance.destroy(); window._adherenceChartInstance = null; }
        if (total > 0) {
            window._adherenceChartInstance = new Chart(canvas.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['On Time', 'Late', 'Missed'],
                    datasets: [{ data: [onTimeItems.length, lateItems.length, missedItems.length],
                        backgroundColor: ['#1E8E3E','#f59e0b','#D93025'], borderWidth: 2, borderColor: 'var(--bg-primary)' }]
                },
                options: { responsive: true, maintainAspectRatio: true,
                    plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 8, font: { size: 11 } } } } }
            });
        } else {
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    const listEl = document.getElementById('adherenceList');
    if (!listEl) return;
    const flagged = [...lateItems.map(i => ({...i, cat:'late'})), ...missedItems.map(i => ({...i, cat:'missed'}))];
    if (flagged.length === 0) {
        listEl.innerHTML = '<div style="color:var(--text-secondary);font-size:14px;">No late or missed habits in this period.</div>';
        return;
    }
    listEl.innerHTML = flagged.map(e => {
        const color = e.cat === 'late' ? '#f59e0b' : '#D93025';
        const diffText = e.diff != null ? `${e.diff > 0 ? '+' : ''}${Math.round(e.diff)} min` : '';
        return `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--bg-tertiary);border-radius:8px;border-left:3px solid ${color};">
            <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(e.name)}</div>
                <div style="font-size:11px;color:var(--text-secondary);">Scheduled ${e.scheduled} · ${e.date}</div>
            </div>
            <div style="text-align:right;flex-shrink:0;">
                <div style="font-size:12px;font-weight:600;color:${color};">${e.actual}</div>
                ${diffText ? `<div style="font-size:11px;color:${color};">${diffText}</div>` : ''}
            </div>
        </div>`;
    }).join('');
}

        function calculateScores() {
    if (!settings.gamificationEnabled) return;

    const datePicker = document.getElementById('scoreDatePicker');
    const selectedDate = datePicker ? datePicker.value : getLocalDateStr(new Date(), true);
    if (!selectedDate) return;

    const doneSessions = sessionLogs.filter(s => s.date === selectedDate && s.completed && !s.interrupted);
    const totalWorkedMin = doneSessions.reduce((sum, s) => sum + Math.round((s.endTime - s.startTime) / 60000), 0);
    const dateXP = getTodayXP(selectedDate);

    const tasksScoreEl = document.getElementById('tasksScore');
    const habitsScoreEl = document.getElementById('habitsScoreDisplay');
    const totalScoreEl = document.getElementById('totalScore');
    if (tasksScoreEl) tasksScoreEl.textContent = (totalWorkedMin / 60).toFixed(1) + 'h';
    if (habitsScoreEl) habitsScoreEl.textContent = '';
    if (totalScoreEl) totalScoreEl.textContent = dateXP.toFixed(1);
    renderScoringBreakdown(selectedDate);
}

function toggleScoringBreakdown(type) {
    const detail = document.getElementById(type === 'sessions' ? 'scoreBreakdownSessionsDetail' : 'scoreBreakdownHabitsDetail');
    const arrow = document.getElementById(type === 'sessions' ? 'scoreBreakdownSessionsArrow' : 'scoreBreakdownHabitsArrow');
    if (!detail || !arrow) return;
    const isOpen = detail.style.display === 'block';
    detail.style.display = isOpen ? 'none' : 'block';
    arrow.textContent = isOpen ? '▼' : '▲';
}

function renderScoringBreakdown(dateStr) {
    const sessionsDetail = document.getElementById('scoreBreakdownSessionsDetail');
    const sessionsSummary = document.getElementById('scoreBreakdownSessionsSummary');
    if (!sessionsDetail || !sessionsSummary) return;

    const doneSessions = sessionLogs.filter(s => s.date === dateStr && s.completed && !s.interrupted);
    let totalXP = 0;
    const lines = doneSessions.map((s, i) => {
        const workedMin = Math.round((s.endTime - s.startTime) / 60000);
        const xp = calcSessionXP(s);
        totalXP += xp;
        return `<span style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px;" onclick="viewSessionDetails(${s.id})">✅ Session ${i + 1}: ${escapeHtml(s.projectName || 'Project')} (${workedMin}m) +${xp.toFixed(1)} XP</span>`;
    });
    sessionsSummary.textContent = `${totalXP.toFixed(1)} XP`;
    if (doneSessions.length === 0) lines.push('⏸️ No sessions completed');
    sessionsDetail.innerHTML = lines.join('<br>');

    const habitsDetail = document.getElementById('scoreBreakdownHabitsDetail');
    const habitsSummary = document.getElementById('scoreBreakdownHabitsSummary');
    if (habitsDetail && habitsSummary) {
        const dayHabits = habits.filter(h => (h.customDays || [0,1,2,3,4,5,6]).includes(new Date(dateStr + 'T12:00:00').getDay()));
        const habitLines = dayHabits.map(h => {
            const log = habitLogs[h.id]?.[dateStr];
            const done = getHabitLogState(log) === 'done';
            const progress = h.measurable ? ` (${Number(log?.value || 0)}/${Number(h.target_value || 1)})` : '';
            return `${done ? '✅' : '⏸️'} ${escapeHtml(h.name)}${progress}`;
        });
        const doneCount = dayHabits.filter(h => getHabitLogState(habitLogs[h.id]?.[dateStr]) === 'done').length;
        habitsSummary.textContent = `${doneCount}/${dayHabits.length}`;
        habitsDetail.innerHTML = habitLines.join('<br>') || 'No habits scheduled';
    }
}

        function updateChart() {
            const startDate = new Date(document.getElementById('chartStartDate').value);
            const endDate = new Date(document.getElementById('chartEndDate').value);
            
            if (isNaN(startDate) || isNaN(endDate)) return;
            
            const dates = [];
            const scores = [];
            
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                dates.push(dateStr);
                scores.push(calculateDayScore(dateStr));
            }
            
            renderChart(dates, scores);
        }

        function calculateDayScore(dateStr) {
            return getTodayXP(dateStr);
        }

        function renderChart(dates, scores) {
            const canvas = document.getElementById('scoreChart');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const labels = dates.map(d => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' }));
            if (scoreTrendChart) scoreTrendChart.destroy();
            scoreTrendChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'XP',
                        data: scores,
                        borderColor: '#1967d2',
                        backgroundColor: 'rgba(25,103,210,0.15)',
                        pointRadius: 5,
                        pointHoverRadius: 8,
                        pointHitRadius: 12,
                        tension: 0.25
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    onClick: (event, elements) => {
                        if (elements.length === 0) return;
                        const idx = elements[0].index;
                        showDayDetailPanel(dates[idx]);
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: (context) => `${labels[context.dataIndex]}: ${context.parsed.y.toFixed(1)} XP`
                            }
                        }
                    }
                }
            });
        }

        function showDayDetailPanel(dateStr) {
            const panel = document.getElementById('dayDetailPanel');
            const title = document.getElementById('dayDetailTitle');
            const content = document.getElementById('dayDetailContent');
            if (!panel || !title || !content) return;

            const d = new Date(dateStr + 'T12:00:00');
            title.textContent = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

            const daySessions = sessionLogs.filter(s => {
                const sd = getLocalDateStr(new Date(s.startTime), true);
                return sd === dateStr && s.completed;
            });
            const dayHabits = habits.filter(h => {
                const log = habitLogs[h.id]?.[dateStr];
                return getHabitLogState(log) === 'done';
            });

            let html = '';

            // Sessions
            html += `<div style="font-weight:700; font-size:14px; margin-bottom:8px;">🎯 Sessions (${daySessions.length})</div>`;
            if (daySessions.length === 0) {
                html += `<div style="color:var(--text-secondary); font-size:13px; margin-bottom:16px;">No sessions</div>`;
            } else {
                daySessions.forEach(s => {
                    const mins = Math.round((s.endTime - s.startTime) / 60000);
                    const xp = getSessionXP(s);
                    html += `<div style="padding:10px 12px; background:var(--bg-secondary); border-radius:8px; margin-bottom:8px;">
                        <div style="font-weight:600; font-size:13px;">${escapeHtml(s.projectName || 'Session')} <span style="color:var(--text-secondary); font-weight:400;">· ${mins}m · ${xp.toFixed(1)} XP</span></div>
                        ${s.notes ? `<div style="color:var(--text-secondary); font-size:12px; margin-top:4px; font-style:italic;">"${escapeHtml(s.notes)}"</div>` : ''}
                    </div>`;
                });
            }

            // Completed habits
            html += `<div style="font-weight:700; font-size:14px; margin-bottom:8px; margin-top:8px;">✅ Habits Completed (${dayHabits.length})</div>`;
            if (dayHabits.length === 0) {
                html += `<div style="color:var(--text-secondary); font-size:13px;">No habits completed</div>`;
            } else {
                dayHabits.forEach(h => {
                    const log = habitLogs[h.id]?.[dateStr];
                    const xp = getHabitXP(h);
                    html += `<div style="padding:8px 12px; background:var(--bg-secondary); border-radius:8px; margin-bottom:6px; display:flex; flex-direction:column; gap:2px;">
                        <div style="font-size:13px;">${h.icon || '🎯'} ${escapeHtml(h.name)} <span style="color:var(--text-secondary);">· ${xp} XP</span></div>
                        ${log?.note ? `<div style="color:var(--text-secondary); font-size:12px; font-style:italic;">"${escapeHtml(log.note)}"</div>` : ''}
                    </div>`;
                });
            }

            content.innerHTML = html;
            panel.style.display = 'flex';
        }

        function closeDayDetailPanel() {
            const panel = document.getElementById('dayDetailPanel');
            if (panel) panel.style.display = 'none';
        }

        // ========================================
        // SETTINGS
        // ========================================
        
        function openSettings() {
            const today = new Date();
            const todayStr = getLocalDateStr(today, true);
            const weekdayDate = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            const currentDefault = getTodaySessionTarget(todayStr, today);
            const todayOverrideLabel = document.getElementById('settingTodayOverrideLabel');
            const todayOverrideDescription = document.getElementById('settingTodayOverrideDescription');
            const todayOverrideInput = document.getElementById('settingTodaySessionOverride');
            if (todayOverrideLabel) todayOverrideLabel.textContent = `Today (${weekdayDate}):`;
            if (todayOverrideDescription) todayOverrideDescription.textContent = `Current default: ${currentDefault}`;
            if (todayOverrideInput) {
                const existingOverride = dailySessionOverrides[todayStr];
                todayOverrideInput.value = Number.isFinite(existingOverride) ? existingOverride : currentDefault;
            }
            document.getElementById('settingSessionEndSound').value = sessionEndSound || 'bellChime';
            document.getElementById('settingDayCutoffTime').value = dayCutoffTime || '03:00';
            const wakeEl = document.getElementById('settingWakeTime');
            if (wakeEl) wakeEl.value = settings.wakeTime || '06:00';
            const sleepEl = document.getElementById('settingSleepTime');
            if (sleepEl) sleepEl.value = settings.sleepTime || '23:00';
            const weekStartEl = document.getElementById('settingWeekStartsOn');
            if (weekStartEl) weekStartEl.value = String(settings.weekStartsOn !== undefined ? settings.weekStartsOn : 1);
            document.getElementById('settingsModal').classList.add('active');
        }

        function closeSettings() {
    document.getElementById('settingsModal').classList.remove('active');
    if (settings.gamificationEnabled) {
        calculateScores();
    }
    renderTodayView();
    renderHabitLog();
}

       function saveSettings() {
    const weekdayDefinition = [];
    if (document.getElementById('weekdayMonday')?.checked) weekdayDefinition.push('Monday');
    if (document.getElementById('weekdayTuesday')?.checked) weekdayDefinition.push('Tuesday');
    if (document.getElementById('weekdayWednesday')?.checked) weekdayDefinition.push('Wednesday');
    if (document.getElementById('weekdayThursday')?.checked) weekdayDefinition.push('Thursday');
    if (document.getElementById('weekdayFriday')?.checked) weekdayDefinition.push('Friday');
    if (document.getElementById('weekdaySaturday')?.checked) weekdayDefinition.push('Saturday');
    if (document.getElementById('weekdaySunday')?.checked) weekdayDefinition.push('Sunday');
    weeklySessionTargets = {
        weekdaysSessions: parseFloat(document.getElementById('settingWeekdaysSessions')?.value) || 0,
        weekendSessions: parseFloat(document.getElementById('settingWeekendSessions')?.value) || 0,
        weekdayDefinition: weekdayDefinition.length ? weekdayDefinition : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    };
    const today = new Date();
    const todayStr = getLocalDateStr(today, true);
    const dayName = getSessionDayKey(today);
    const configuredWeekdays = Array.isArray(weeklySessionTargets.weekdayDefinition) ? weeklySessionTargets.weekdayDefinition : [];
    const isWeekday = configuredWeekdays.includes(dayName);
    const todayDefault = isWeekday
        ? (Number.isFinite(weeklySessionTargets.weekdaysSessions) ? weeklySessionTargets.weekdaysSessions : 9)
        : (Number.isFinite(weeklySessionTargets.weekendSessions) ? weeklySessionTargets.weekendSessions : 4);
    const todayOverrideRaw = parseInt(document.getElementById('settingTodaySessionOverride')?.value);
    if (!Number.isFinite(todayOverrideRaw) || todayOverrideRaw === todayDefault) {
        delete dailySessionOverrides[todayStr];
    } else {
        dailySessionOverrides[todayStr] = todayOverrideRaw;
    }
    sessionEndSound = document.getElementById('settingSessionEndSound')?.value || 'bellChime';
    dayCutoffTime = document.getElementById('settingDayCutoffTime')?.value || '03:00';
    settings.wakeTime = document.getElementById('settingWakeTime')?.value || '';
    settings.sleepTime = document.getElementById('settingSleepTime')?.value || '';
    const weekStartVal = parseInt(document.getElementById('settingWeekStartsOn')?.value);
    settings.weekStartsOn = isNaN(weekStartVal) ? 1 : weekStartVal;

    localStorage.setItem('lifescore_settings_v4', JSON.stringify(settings));
    localStorage.setItem('lifescore_weekly_sessions_v4', JSON.stringify(weeklySessionTargets));
    localStorage.setItem('lifescore_session_end_sound_v4', sessionEndSound);
    localStorage.setItem('lifescore_day_cutoff_v4', dayCutoffTime);
    applySettings();
    renderTabs();
    renderTasks();
    renderHabitLog();
    renderTodayView();
    setTimeout(() => { calculateScores(); updateChart(); }, 100);
    closeSettings();
}
// ========================================
// NOTES
// ========================================

function renderLabels() {
    const labelSet = new Set();
    notes.forEach(note => {
        if (note.labels) {
            note.labels.split(',').forEach(label => {
                labelSet.add(label.trim());
            });
        }
    });
    
    const labelsList = document.getElementById('labelsList');
    if (!labelsList) return;
    
    const labels = Array.from(labelSet).sort();
    labelsList.innerHTML = labels.map(label => `
        <div class="project-item" data-label="${escapeHtml(label)}" onclick="filterNotesByLabel('${escapeHtml(label)}')">
            <span>🏷️</span> ${escapeHtml(label)}
            <span class="filter-count">${notes.filter(n => n.labels && n.labels.includes(label)).length}</span>
        </div>
    `).join('');
    
    const allCount = document.getElementById('allNotesCount');
    if (allCount) allCount.textContent = notes.length;
}

function filterNotesByLabel(label) {
    currentNoteLabel = label;
    document.querySelectorAll('#notesTab .project-item').forEach(item => item.classList.remove('active'));
    if (label === null) {
        document.querySelector('[data-label="all"]').classList.add('active');
    } else {
        document.querySelector(`[data-label="${label}"]`).classList.add('active');
    }
    renderNotes();
}

function renderNotes() {
    const list = document.getElementById('notesList');
    if (!list) return;
    
    let filteredNotes = notes;
    if (currentNoteLabel && currentNoteLabel !== 'all') {
        filteredNotes = notes.filter(n => n.project === parseInt(currentNoteLabel));
    }

    if (filteredNotes.length === 0) {
        list.innerHTML = '<div class="empty-state"><div>📝</div><div>No notes here!</div></div>';
        return;
    }

    list.innerHTML = filteredNotes.map(note => {
        const project = projects.find(p => p.id === note.project);
        const projectName = project ? project.name : 'No Project';
        
        return `
            <div class="task-item" style="border-left: 4px solid ${project?.color || 'var(--accent-color)'};">
                <div class="task-main">
                    <div class="task-content" style="flex: 1;">
                        <div class="task-text" style="font-weight: 600;">${escapeHtml(note.title)}</div>
                        ${note.content ? `<div class="details-section" style="margin-top: 8px; font-size: 13px; color: var(--text-secondary); line-height: 1.6;">${note.content}</div>` : ''}
                        <div class="task-meta">
                            <span>${new Date(note.createdAt).toLocaleDateString()}</span>
                            <span class="label-chip" style="background: ${project?.color || 'var(--accent-color)'}20; color: ${project?.color || 'var(--accent-color)'};">${project?.icon || '📁'} ${escapeHtml(projectName)}</span>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="more-btn" onclick="editNote(${note.id})">✏️</button>
                        <button class="more-btn" onclick="deleteNote(${note.id})">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function showAddNoteModal() {
    currentNoteId = null;
    document.getElementById('noteModalTitle').textContent = 'Add Note';
    document.getElementById('noteTitle').value = '';
    document.getElementById('noteContent').innerHTML = '';
    
    const projectSelect = document.getElementById('noteProject');
    projectSelect.innerHTML = projects.filter(p => !p.archived).map(p => 
        `<option value="${p.id}">${p.icon} ${escapeHtml(p.name)}</option>`
    ).join('');
    
    document.getElementById('deleteNoteBtn').style.display = 'none';
    document.getElementById('noteModal').classList.add('active');
}

function editNote(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    
    currentNoteId = id;
    document.getElementById('noteModalTitle').textContent = 'Edit Note';
    document.getElementById('noteTitle').value = note.title;
    document.getElementById('noteContent').innerHTML = note.content || '';
    
    const projectSelect = document.getElementById('noteProject');
    projectSelect.innerHTML = projects.filter(p => !p.archived).map(p => 
        `<option value="${p.id}">${p.icon} ${escapeHtml(p.name)}</option>`
    ).join('');
    projectSelect.value = note.project || '';
    
    document.getElementById('deleteNoteBtn').style.display = 'block';
    document.getElementById('noteModal').classList.add('active');
}

function saveNote() {
    const title = document.getElementById('noteTitle').value.trim();
    if (!title) return alert('Please enter a title');
    
    const content = document.getElementById('noteContent').innerHTML.trim();
    const projectId = parseInt(document.getElementById('noteProject').value);
    
    if (!projectId) return alert('Please select a project');
    
    if (currentNoteId) {
        const note = notes.find(n => n.id === currentNoteId);
        note.title = title;
        note.content = content;
        note.project = projectId;
        note.updatedAt = new Date().toISOString();
    } else {
        notes.unshift({
            id: Date.now(),
            title: title,
            content: content,
            project: projectId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }
    
    saveNotes();
    renderNotes();
    closeNoteModal();
}

function deleteNote(noteId) {
    if (!confirm('Delete this note?')) return;
    notes = notes.filter(n => n.id !== noteId);
    saveNotes();
    renderNotes();
}

function deleteCurrentNote() {
    deleteNote(currentNoteId);
    closeNoteModal();
}
let selectedNoteText = '';

function formatNote(command, value = null) {
    document.execCommand(command, false, value);
    document.getElementById('noteContent').focus();
}

function handleNoteSelection() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    const actionsDiv = document.getElementById('selectionActions');
    
    if (selectedText.length > 0) {
        selectedNoteText = selectedText;
        actionsDiv.style.display = 'flex';
    } else {
        selectedNoteText = '';
        actionsDiv.style.display = 'none';
    }
}

function createTaskFromSelection() {
    // Re-capture selection in case it was lost
    const textarea = document.getElementById('noteContent');
    const text = selectedNoteText || textarea.value.substring(window.noteSelectionStart || 0, window.noteSelectionEnd || 0).trim();
    
    if (!text) return alert('Please select text first');
    
    // Save note first
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').innerHTML.trim();
    const projectId = parseInt(document.getElementById('noteProject').value);
    
    if (currentNoteId) {
        const note = notes.find(n => n.id === currentNoteId);
        note.title = title;
        note.content = content;
        note.project = projectId;
        note.updatedAt = new Date().toISOString();
        saveNotes();
    }
    
    closeNoteModal();
    
    editingId = null;
    editingType = 'task';
    
    document.getElementById('itemModalTitle').textContent = 'Add Task';
    document.getElementById('modalTitleLabel').textContent = 'Title';
    document.getElementById('modalTitle').value = text;
    document.getElementById('modalProject').value = projectId || '';
    document.getElementById('modalDate').value = '';
    document.getElementById('modalTime').value = '';
    document.getElementById('modalTaskReminderTime').value = '';
    document.getElementById('modalRepeat').value = 'none';
    document.getElementById('modalTaskDetails').value = '';
    
    document.getElementById('taskSpecificFields').style.display = 'block';
    document.getElementById('habitSpecificFields').style.display = 'none';
    document.getElementById('deleteItemBtn').style.display = 'none';
    document.getElementById('itemModal').classList.remove('habit-mode');
    
    document.getElementById('itemModal').classList.add('active');
}

function createHabitFromSelection() {
    // Re-capture selection in case it was lost
    const textarea = document.getElementById('noteContent');
    const text = selectedNoteText || textarea.value.substring(window.noteSelectionStart || 0, window.noteSelectionEnd || 0).trim();
    
    if (!text) return alert('Please select text first');
    
    // Save note first
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').innerHTML.trim();
    const projectId = parseInt(document.getElementById('noteProject').value);
    
    if (currentNoteId) {
        const note = notes.find(n => n.id === currentNoteId);
        note.title = title;
        note.content = content;
        note.project = projectId;
        note.updatedAt = new Date().toISOString();
        saveNotes();
    }
    
    closeNoteModal();
    
    editingId = null;
    editingType = 'habit';
    
    document.getElementById('itemModalTitle').textContent = 'Add Habit';
    document.getElementById('modalTitleLabel').textContent = 'Habit Name';
    document.getElementById('modalTitle').value = text;
    document.getElementById('modalProject').value = projectId || '';
    document.getElementById('modalHabitType').value = 'positive';
    document.getElementById('modalDifficulty').value = 'medium';
    document.getElementById('modalMeasurable').checked = false;
    document.getElementById('modalHabitReminderTime').value = '';
    document.getElementById('modalHabitStartDate').value = getLocalDateStr();
    document.getElementById('modalTargetValue').value = '';
    document.getElementById('modalUnit').value = '';
    document.getElementById('modalPeriod').value = 'daily';
    document.getElementById('modalHabitDetails').value = '';
    
    document.getElementById('taskSpecificFields').style.display = 'none';
    document.getElementById('habitSpecificFields').style.display = 'block';
    document.getElementById('measurableFields').style.display = 'none';
    document.getElementById('deleteItemBtn').style.display = 'none';
    document.getElementById('itemModal').classList.add('habit-mode');
    
    document.querySelectorAll('#habitDaysSelector .day-chip').forEach(chip => {
        chip.classList.add('selected');
    });
    
    updateWeightDisplay();
    toggleMeasurableFields();
    document.getElementById('itemModal').classList.add('active');
}

function closeNoteModal() {
    document.getElementById('noteModal').classList.remove('active');
    currentNoteId = null;
}

function saveNotes() {
    localStorage.setItem('lifescore_notes_v4', JSON.stringify(notes));
}

// ===== PROJECTS TAB FUNCTIONS =====

var currentProjectId = null;
var projectShowCompletedMap = JSON.parse(localStorage.getItem('lifescore_project_show_completed_v4')) || {};

function refreshCurrentProjectView() {
    if (!currentProjectId) return;
    renderProjectTasks(currentProjectId);
    renderProjectNotes(currentProjectId);
    renderProjectHabits(currentProjectId);
    renderProjectDetailHeader(currentProjectId);
    renderProjectsTab();
    updateProjectCounts();
}

function toggleProjectShowCompleted(projectId, checked) {
    if (!projectId) return;
    projectShowCompletedMap[projectId] = Boolean(checked);
    localStorage.setItem('lifescore_project_show_completed_v4', JSON.stringify(projectShowCompletedMap));
    renderProjectTasks(projectId);
}

function updateProjectStatus(projectId, status) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    project.status = status;
    project.archived = status === 'archived';
    saveProjects();
    renderProjectsTab();
    if (currentProjectId === projectId) {
        renderProjectDetailHeader(projectId);
    }
}

function renderProjectsTab() {
    const container = document.getElementById('projectsListView');
    
    const allProjects = projects.filter(p => !p.archived);
    
    let html = '';
    
    if (allProjects.length > 0) {
        html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">';
        allProjects.forEach(project => {
            const taskCount = tasks.filter(t => t.project === project.id && !t.completed).length;
            const noteCount = notes.filter(n => n.project === project.id).length;
            const habitCount = habits.filter(h => h.project === project.id).length;
            html += `
                <div draggable="true" data-project-id="${project.id}" onclick="showProjectDetail(${project.id})" style="padding: 20px; background: var(--bg-tertiary); border-radius: 8px; border-left: 4px solid ${project.color}; cursor: move; transition: all 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px var(--shadow)'" onmouseout="this.style.transform=''; this.style.boxShadow=''">
                    <div style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px;">
                        <span style="font-size: 28px;">${project.icon}</span>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-weight: 600; font-size: 16px; margin-bottom: 2px;">${escapeHtml(project.name)}</div>
                            ${project.description ? `<div style="font-size: 14px; color: var(--text-secondary); line-height: 1.4;">${escapeHtml(project.description)}</div>` : `<div style="font-size: 14px; color: var(--text-secondary); line-height: 1.4;">No description</div>`}
                        </div>
                        <select onclick="event.stopPropagation();" onchange="event.stopPropagation(); updateProjectStatus(${project.id}, this.value)" style="font-size:12px; padding:4px 6px; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-primary);">
                            <option value="active" ${project.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="on-hold" ${project.status === 'on-hold' ? 'selected' : ''}>On Hold</option>
                            <option value="completed" ${project.status === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="archived" ${project.status === 'archived' ? 'selected' : ''}>Archived</option>
                        </select>
                        <button class="more-btn" title="Edit project" onclick="event.stopPropagation(); editProject(${project.id})">✏️</button>
                    </div>
                    <div style="display:flex; gap: 20px; font-size: 13px; color: var(--text-secondary); padding:10px 0; border-top:1px solid var(--border-color); border-bottom:1px solid var(--border-color); margin:10px 0;">
                        ${project.startDate ? `<span><strong>Started:</strong> ${new Date(project.startDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</span>` : '<span><strong>Started:</strong> -</span>'}
                        ${project.endDate ? `<span><strong>Target:</strong> ${new Date(project.endDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}</span>` : '<span><strong>Target:</strong> -</span>'}
                    </div>
                    <div style="display: flex; gap: 16px; font-size: 13px; color: var(--text-secondary);">
                        <span>📋 ${taskCount} tasks</span>
                        <span>📝 ${noteCount} notes</span>
                        <span>⭕ ${habitCount} habits</span>
                    </div>
                    ${(project.tools || []).length > 0 ? `<div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:8px;">${project.tools.map(tid => { const t = tools.find(x => x.id === tid); return t ? '<span style="padding:2px 8px; background:var(--bg-secondary); border-radius:12px; font-size:12px;">' + t.icon + ' ' + escapeHtml(t.name) + '</span>' : ''; }).join('')}</div>` : ''}
                </div>
            `;
        });
        html += '</div>';
    }
    
   
    if (projects.filter(p => !p.archived).length === 0) {
        html = '<div style="text-align: center; padding: 60px 20px; color: var(--text-secondary);">No projects yet. Click "+ New Project" to create one.</div>';
    }
    
    container.innerHTML = html;
    
    // Add drag and drop handlers
    const cards = container.querySelectorAll('[data-project-id]');
    let draggedElement = null;
    
    cards.forEach(card => {
        card.addEventListener('dragstart', function(e) {
            draggedElement = this;
            this.style.opacity = '0.5';
            e.dataTransfer.effectAllowed = 'move';
        });
        
        card.addEventListener('dragend', function(e) {
            this.style.opacity = '1';
        });
        
        card.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            if (this !== draggedElement) {
                const rect = this.getBoundingClientRect();
                const midpoint = rect.left + rect.width / 2;
                
                if (e.clientX < midpoint) {
                    this.parentNode.insertBefore(draggedElement, this);
                } else {
                    this.parentNode.insertBefore(draggedElement, this.nextSibling);
                }
            }
        });
        
        card.addEventListener('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Get new order from DOM
            const newOrder = Array.from(container.querySelectorAll('[data-project-id]')).map(card => 
                parseInt(card.dataset.projectId)
            );
            
            // Reorder projects array
            const reorderedProjects = [];
            newOrder.forEach(id => {
                const project = projects.find(p => p.id === id);
                if (project) reorderedProjects.push(project);
            });
            
            // Add any archived or missing projects at the end
            projects.forEach(p => {
                if (!reorderedProjects.includes(p)) {
                    reorderedProjects.push(p);
                }
            });
            
            projects = reorderedProjects;
            saveProjects();
        });
    });
}

function renderProjectDetailHeader(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const header = document.getElementById('projectDetailHeader');
    if (!header) return;
    header.innerHTML = `
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 14px;">
            <span style="font-size: 42px;">${project.icon}</span>
            <div style="flex: 1;">
                <h2 style="margin: 0 0 6px 0; font-size: 28px;">${escapeHtml(project.name)}</h2>
                ${project.description ? `<div style="font-size:14px; color:var(--text-secondary);">${escapeHtml(project.description)}</div>` : ''}
            </div>
            <select onchange="updateProjectStatus(${project.id}, this.value)" style="font-size:12px; padding:6px 8px; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-primary);">
                <option value="active" ${project.status === 'active' ? 'selected' : ''}>Active</option>
                <option value="on-hold" ${project.status === 'on-hold' ? 'selected' : ''}>On Hold</option>
                <option value="completed" ${project.status === 'completed' ? 'selected' : ''}>Completed</option>
                <option value="archived" ${project.status === 'archived' ? 'selected' : ''}>Archived</option>
            </select>
            <button onclick="editProject(${project.id})" class="more-btn" title="Edit">✏️</button>
        </div>
        <div style="display:flex; gap:24px; font-size:14px; color:var(--text-secondary); padding:12px; background:var(--bg-tertiary); border-radius:8px;">
            <div><strong>Started:</strong> ${project.startDate ? new Date(project.startDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : '-'}</div>
            <div><strong>Target:</strong> ${project.endDate ? new Date(project.endDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : '-'}</div>
        </div>
        ${(project.tools || []).length > 0 ? `<div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:10px;">${project.tools.map(tid => { const t = tools.find(x => x.id === tid); return t ? '<span style="padding:4px 10px; background:var(--bg-tertiary); border-radius:16px; font-size:13px;">' + t.icon + ' ' + escapeHtml(t.name) + '</span>' : ''; }).join('')}</div>` : ''}
    `;
}

function showProjectDetail(projectId) {
    currentProjectId = projectId;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    // Hide list + global sections, show detail
    document.getElementById('projectsListView').style.display = 'none';
    document.getElementById('projectDetailView').style.display = 'block';
    const globalSections = document.getElementById('projectTabSections');
    if (globalSections) globalSections.style.display = 'none';
    const projectsHeader = document.getElementById('projectsMainHeader');
    if (projectsHeader) projectsHeader.style.display = 'none';
    
    renderProjectDetailHeader(projectId);
    const toggle = document.getElementById('projectShowCompletedToggle');
    if (toggle) toggle.checked = Boolean(projectShowCompletedMap[projectId]);
    
    // Render tasks
    renderProjectTasks(projectId);
    renderProjectNotes(projectId);
    renderProjectHabits(projectId);
}

function closeProjectDetail() {
    currentProjectId = null;
    document.getElementById('projectsListView').style.display = 'block';
    document.getElementById('projectDetailView').style.display = 'none';
    const globalSections = document.getElementById('projectTabSections');
    if (globalSections) globalSections.style.display = 'block';
    const projectsHeader = document.getElementById('projectsMainHeader');
    if (projectsHeader) projectsHeader.style.display = '';
    renderProjectsTab();
    applyProjectSectionStates();
}

function renderProjectTasks(projectId) {
    let projectTasks = tasks.filter(t => t.project === projectId);
    const showCompletedForProject = Boolean(projectShowCompletedMap[projectId]);
    if (!showCompletedForProject) {
        projectTasks = projectTasks.filter(t => !t.completed);
    }
    const container = document.getElementById('projectTasks');
    
    if (projectTasks.length === 0) {
        container.innerHTML = '<div style="color: var(--text-secondary); padding: 20px; text-align: center;">No tasks in this project</div>';
        return;
    }
    
    container.innerHTML = projectTasks.map(task => renderTask(task)).join('');
}

function renderProjectNotes(projectId) {
    const projectNotes = notes.filter(n => n.project === projectId);
    const container = document.getElementById('projectNotes');
    
    if (projectNotes.length === 0) {
        container.innerHTML = '<div style="color: var(--text-secondary); padding: 20px; text-align: center;">No notes in this project</div>';
        return;
    }
    
    container.innerHTML = projectNotes.map(note => {
        const labels = note.labels || '';
        return `
            <div onclick="editNote(${note.id})" style="padding: 16px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.boxShadow='0 2px 8px var(--shadow)'" onmouseout="this.style.boxShadow=''">
                <div style="font-weight: 600; margin-bottom: 8px;">${escapeHtml(note.title)}</div>
                <div style="font-size: 13px; color: var(--text-secondary);">${escapeHtml(note.content.substring(0, 150))}${note.content.length > 150 ? '...' : ''}</div>
                ${labels ? `<div style="margin-top: 8px; font-size: 11px; color: var(--text-secondary);">${labels}</div>` : ''}
            </div>
        `;
    }).join('');
}

function renderProjectHabits(projectId) {
    const projectHabits = habits.filter(h => h.project === projectId);
    const container = document.getElementById('projectHabits');
    
    if (projectHabits.length === 0) {
        container.innerHTML = '<div style="color: var(--text-secondary); padding: 20px; text-align: center;">No habits in this project</div>';
        return;
    }
    
    const dateStr = getLocalDateStr(new Date(), true);
    container.innerHTML = projectHabits.map(habit => renderTodayHabit(habit, dateStr)).join('');
}

function addTaskToCurrentProject() {
    if (!currentProjectId) return;
    editingId = null;
    editingType = 'task';
    
    document.getElementById('itemModalTitle').textContent = 'Add Task';
    document.getElementById('modalTitle').value = '';
    document.getElementById('modalTaskDetails').value = '';
    document.getElementById('modalDate').value = '';
    document.getElementById('modalTime').value = '';
    document.getElementById('modalTaskReminderTime').value = '';
    document.getElementById('modalRepeat').value = 'none';
    document.getElementById('modalProject').value = currentProjectId;
    
    document.getElementById('taskSpecificFields').style.display = 'block';
    document.getElementById('habitSpecificFields').style.display = 'none';
    document.getElementById('deleteItemBtn').style.display = 'none';
    document.getElementById('itemModal').classList.remove('habit-mode');
    document.getElementById('itemModal').classList.add('active');
}

function addNoteToCurrentProject() {
    if (!currentProjectId) return;
    currentNoteId = null;
    
    document.getElementById('noteModalTitle').textContent = 'Add Note';
    document.getElementById('noteTitle').value = '';
    document.getElementById('noteContent').value = '';
    
    const projectSelect = document.getElementById('noteProject');
    projectSelect.innerHTML = projects.filter(p => !p.archived).map(p => 
        `<option value="${p.id}">${p.icon} ${escapeHtml(p.name)}</option>`
    ).join('');
    projectSelect.value = currentProjectId;
    
    document.getElementById('deleteNoteBtn').style.display = 'none';
    document.getElementById('noteModal').classList.add('active');
}
function addHabitToCurrentProject() {
    if (!currentProjectId) return;
    editingId = null;
    editingType = 'habit';
    
    document.getElementById('itemModalTitle').textContent = 'Add Habit';
    document.getElementById('modalTitle').value = '';
    document.getElementById('modalHabitDetails').value = '';
    document.getElementById('modalProject').value = currentProjectId;
    document.getElementById('habitDetailsContainer').style.display = 'block';
    document.getElementById('modalHabitType').value = 'positive';
    document.getElementById('modalMeasurable').checked = false;
    document.getElementById('modalDifficulty').value = 'medium';
    
    document.getElementById('taskSpecificFields').style.display = 'none';
    document.getElementById('habitSpecificFields').style.display = 'block';
    document.getElementById('deleteItemBtn').style.display = 'none';
    document.getElementById('itemModal').classList.add('habit-mode');
    document.getElementById('itemModal').classList.add('active');
    
    // Set initial visibility for measurable fields
    const measurableFields = document.getElementById('measurableFields');
    if (measurableFields) measurableFields.style.display = 'none';
    
    document.querySelectorAll('#habitDaysSelector .day-chip').forEach(chip => {
        chip.classList.add('selected');
    });
}

function showWeightAdjustmentModal() {}
function closeWeightAdjustmentModal() {}
function updateAdjustmentTotal() {}
function saveWeightAdjustments() {}

        // ========================================
        // STORAGE
        // ========================================
        
        function saveTasks() {
            localStorage.setItem('lifescore_tasks_v4', JSON.stringify(tasks));
        }

        function saveHabits() {
            localStorage.setItem('lifescore_habits_v4', JSON.stringify(habits));
        }

        function saveHabitLogs() {
            localStorage.setItem('lifescore_habit_logs_v4', JSON.stringify(habitLogs));
            refreshTotalXPDisplay();
        }

        function saveTaskLogs() {
            localStorage.setItem('lifescore_task_logs_v4', JSON.stringify(taskLogs));
        }

        function saveSessionLogs() {
            localStorage.setItem('lifescore_session_logs_v4', JSON.stringify(sessionLogs));
        }

        function getTodaysSessions(date = new Date()) {
            const dateStr = typeof date === 'string' ? date : getLocalDateStr(date);
            return sessionLogs.filter(session => session.date === dateStr);
        }

        function getSessionsForWeek(date = new Date()) {
            const baseDate = new Date(date);
            baseDate.setHours(0, 0, 0, 0);
            const weekStart = new Date(baseDate);
            weekStart.setDate(baseDate.getDate() - baseDate.getDay());
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);

            return sessionLogs.filter(session => {
                if (!session.date) return false;
                const sessionDate = new Date(session.date + 'T00:00:00');
                return sessionDate >= weekStart && sessionDate <= weekEnd;
            });
        }

        // Session object structure:
        // {
        //   id: timestamp,
        //   date: 'YYYY-MM-DD',
        //   projectId: number,
        //   projectName: string,
        //   duration: 60, // 15, 30, 60, 90
        //   startTime: timestamp,
        //   endTime: timestamp,
        //   tasksCompleted: [taskIds],
        //   notes: string,
        //   completed: boolean,
        //   interrupted: null
        // }

        function openFocusQuality() {
            document.getElementById('focusQualityModal').classList.add('active');
            renderFocusQuality();
        }
        function closeFocusQuality() {
            document.getElementById('focusQualityModal').classList.remove('active');
        }
        function renderFocusQuality() {
            const container = document.getElementById('focusQualityContent');
            if (!container) return;
            const completed = sessionLogs.filter(s => s.completed && !s.interrupted);
            const totalCreditMin = completed.reduce((sum, s) => {
                const wm = Math.round((s.endTime - s.startTime) / 60000);
                return sum + Math.floor(wm / 15) * 15;
            }, 0);
            const qualities = [
                { key: 'distractionFree', label: '🎯 Distraction Free', icon: '🎯' },
                { key: 'phoneAway', label: '📵 Phone Away', icon: '📵' },
                { key: 'deepFocus', label: '🧠 Deep Focus', icon: '🧠' },
                { key: 'completedIntent', label: '✅ Completed Intent', icon: '✅' }
            ];
            const stats = qualities.map(q => {
                const matching = completed.filter(s => s[q.key]);
                const mins = matching.reduce((sum, s) => {
                    const wm = Math.round((s.endTime - s.startTime) / 60000);
                    return sum + Math.floor(wm / 15) * 15;
                }, 0);
                const hours = (mins / 60).toFixed(1);
                const pct = totalCreditMin > 0 ? Math.round((mins / totalCreditMin) * 100) : 0;
                return { ...q, hours, mins, pct, count: matching.length };
            });
            const totalHours = (totalCreditMin / 60).toFixed(1);
            container.innerHTML = `
                <div style="padding: 14px; background: var(--bg-tertiary); border-radius: 8px; text-align: center;">
                    <div style="font-size: 13px; color: var(--text-secondary);">Total Focus Hours</div>
                    <div style="font-size: 32px; font-weight: 700;">${totalHours}h</div>
                    <div style="font-size: 13px; color: var(--text-secondary);">${completed.length} sessions</div>
                </div>
                ${stats.map(s => `
                    <div style="padding: 12px; background: var(--bg-tertiary); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 600; font-size: 14px;">${s.label}</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">${s.count} sessions • ${s.pct}% of total</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 22px; font-weight: 700; color: var(--accent-primary);">${s.hours}h</div>
                        </div>
                    </div>
                `).join('')}
            `;
        }
        function openToolRegistry() {
            document.getElementById('toolRegistryModal').classList.add('active');
            renderToolList();
        }
        function closeToolRegistry() {
            document.getElementById('toolRegistryModal').classList.remove('active');
        }
        function addToolFromRegistry() {
            const name = document.getElementById('toolNameInput').value.trim();
            const url = document.getElementById('toolUrlInput').value.trim();
            const category = document.getElementById('toolCategoryInput').value;
            const detail = document.getElementById('toolDetailInput').value.trim();
            if (!name) return;
            const categoryIcons = { AI: '🤖', Dev: '💻', Research: '🔍', Marketing: '📣', Finance: '💰', Communication: '💬', Design: '🎨', Other: '📦' };
            if (editingToolId) {
                const t = tools.find(x => x.id === editingToolId);
                if (t) { t.name = name; t.url = url; t.category = category; t.detail = detail; t.icon = categoryIcons[category] || '📦'; }
                editingToolId = null;
            } else {
                tools.push({ id: Date.now(), name, url, category, detail, icon: categoryIcons[category] || '📦' });
            }
            saveTools();
            document.getElementById('toolNameInput').value = '';
            document.getElementById('toolUrlInput').value = '';
            document.getElementById('toolDetailInput').value = '';
            renderToolList();
        }
        function deleteToolFromRegistry(toolId) {
            tools = tools.filter(t => t.id !== toolId);
            saveTools();
            renderToolList();
        }
        let toolSortKey = 'name';
        let toolSortAsc = true;
        function sortToolsBy(key) {
            if (toolSortKey === key) { toolSortAsc = !toolSortAsc; } else { toolSortKey = key; toolSortAsc = true; }
            renderToolList();
        }
        let editingToolId = null;
        function editToolInRegistry(toolId) {
            const t = tools.find(x => x.id === toolId);
            if (!t) return;
            editingToolId = toolId;
            document.getElementById('toolNameInput').value = t.name;
            document.getElementById('toolUrlInput').value = t.url || '';
            document.getElementById('toolCategoryInput').value = t.category;
            document.getElementById('toolDetailInput').value = t.detail || '';
        }
        function renderToolList() {
            const list = document.getElementById('toolRegistryList');
            if (!list) return;
            if (tools.length === 0) {
                list.innerHTML = '<div style="color: var(--text-secondary); font-size: 14px; padding: 20px; text-align: center;">No tools added yet. Add your first tool above.</div>';
                return;
            }
            const sorted = [...tools].sort((a, b) => {
                const va = (a[toolSortKey] || '').toString().toLowerCase();
                const vb = (b[toolSortKey] || '').toString().toLowerCase();
                return toolSortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
            });
            const arrow = (key) => toolSortKey === key ? (toolSortAsc ? ' ▲' : ' ▼') : '';
            list.innerHTML = `
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--border-color); text-align: left;">
                            <th style="padding: 8px 10px; font-weight: 600; color: var(--text-secondary); cursor: pointer;" onclick="sortToolsBy('name')">Name${arrow('name')}</th>
                            <th style="padding: 8px 10px; font-weight: 600; color: var(--text-secondary); cursor: pointer;" onclick="sortToolsBy('category')">Type${arrow('category')}</th>
                            <th style="padding: 8px 10px; font-weight: 600; color: var(--text-secondary);">Link</th>
                            <th style="padding: 8px 10px; font-weight: 600; color: var(--text-secondary);">Details</th>
                            <th style="padding: 8px 10px; width: 70px;"></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sorted.map(t => `
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <td style="padding: 10px;">${escapeHtml(t.name)}</td>
                                <td style="padding: 10px;">${t.icon} ${escapeHtml(t.category)}</td>
                                <td style="padding: 10px;">${t.url ? `<a href="${escapeHtml(t.url)}" target="_blank" style="color: var(--accent-primary);">↗ Open</a>` : '-'}</td>
                                <td style="padding: 10px; color: var(--text-secondary); font-size: 13px;">${escapeHtml(t.detail || '-')}</td>
                                <td style="padding: 10px; white-space: nowrap;">
                                    <button onclick="editToolInRegistry(${t.id})" style="background: none; border: none; cursor: pointer; color: var(--text-secondary); font-size: 14px;" title="Edit">✏️</button>
                                    <button onclick="deleteToolFromRegistry(${t.id})" style="background: none; border: none; cursor: pointer; color: var(--text-secondary); font-size: 16px;" title="Delete">✕</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`;
        }
        function saveTools() {
            localStorage.setItem('lifescore_tools_v4', JSON.stringify(tools));
        }
        function saveProjects() {
            localStorage.setItem('lifescore_projects_v4', JSON.stringify(projects));
        }

        // ── Project Registry ──────────────────────────────────────────────
        let _dragSrcProjectId = null;

        function openProjectRegistry() {
            renderProjectRegistry();
            document.getElementById('projectRegistryModal').classList.add('active');
        }
        function closeProjectRegistry() {
            closeAllProjectMenus();
            document.getElementById('projectRegistryModal').classList.remove('active');
            const inp = document.getElementById('projectRegistryNewName');
            if (inp) inp.value = '';
            updateProjectSelects();
            populateHabitFilterProjects();
        }
        function renderProjectRegistry() {
            const list = document.getElementById('projectRegistryList');
            if (!list) return;
            if (projects.length === 0) {
                list.innerHTML = '<div style="color:var(--text-secondary); text-align:center; padding:24px; font-size:14px;">No projects yet. Add one above.</div>';
                renderProjectRegistryTotal();
                return;
            }
            list.innerHTML = projects.map(p => `
                <div id="proj-entry-${p.id}">
                <div draggable="true"
                     ondragstart="projDragStart(${p.id})"
                     ondragover="projDragOver(event,${p.id})"
                     ondrop="projDrop(event,${p.id})"
                     ondragend="projDragEnd()"
                     ondragleave="projDragLeave(event,${p.id})"
                     style="display:flex; align-items:center; gap:10px; padding:12px 4px; border-bottom:1px solid var(--border-color);"
                     id="proj-row-${p.id}">
                    <span style="cursor:grab; color:var(--text-secondary); font-size:18px; padding:0 2px; flex-shrink:0; user-select:none;" title="Drag to reorder">⠿</span>
                    <span style="flex:1; font-size:15px; font-weight:500; min-width:80px;" id="proj-name-${p.id}">${escapeHtml(p.name)}</span>
                    <input type="text" class="modal-input" id="proj-edit-${p.id}" value="${escapeHtml(p.name)}" style="display:none; flex:1; padding:6px 10px; font-size:14px; margin-bottom:0;" onkeydown="if(event.key==='Enter')saveProjectEdit(${p.id}); else if(event.key==='Escape')cancelProjectEdit(${p.id})">
                    <div id="proj-edit-btns-${p.id}" style="display:none; gap:6px; flex-shrink:0;">
                        <button onclick="saveProjectEdit(${p.id})" style="padding:6px 16px; background:var(--accent-color); color:#fff; border:none; border-radius:6px; cursor:pointer; font-size:14px; font-weight:600;">Save</button>
                        <button onclick="cancelProjectEdit(${p.id})" style="padding:6px 12px; background:none; border:1px solid var(--border-color); border-radius:6px; cursor:pointer; font-size:14px; color:var(--text-secondary);">✕</button>
                    </div>
                    <div id="proj-controls-${p.id}" style="display:flex; align-items:center; gap:5px; flex-shrink:0;">
                        <div style="display:flex; align-items:center; gap:4px;">
                            <input type="number" min="0" max="168" step="0.5" id="proj-target-${p.id}" value="${p.weeklyTargetHours || ''}" placeholder="—" style="width:58px; padding:5px 8px; font-size:13px; border:1px solid var(--border-color); border-radius:6px; background:var(--bg-tertiary); color:var(--text-primary); text-align:center;" title="Weekly target hours"
                                oninput="renderProjectRegistryTotal()"
                                onblur="updateProjectTarget(${p.id}, this.value)"
                                onkeydown="if(event.key==='Enter'){updateProjectTarget(${p.id},this.value);this.blur();event.preventDefault();}">
                            <span style="font-size:12px; color:var(--text-secondary); white-space:nowrap;">hrs/wk</span>
                        </div>
                        <button onclick="toggleSchedulePanel(${p.id})" style="background:none; border:1px solid var(--border-color); border-radius:6px; cursor:pointer; font-size:16px; color:var(--text-secondary); padding:2px 8px; line-height:1.4;" title="Scheduled sessions">🕐</button>
                        <div style="position:relative; flex-shrink:0;">
                            <button onclick="toggleProjectMenu(${p.id})" style="background:none; border:1px solid transparent; border-radius:6px; cursor:pointer; font-size:20px; color:var(--text-secondary); padding:2px 8px; line-height:1.2;" title="Options">⋮</button>
                            <div id="proj-menu-${p.id}" style="display:none; position:absolute; right:0; top:100%; margin-top:4px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:8px; box-shadow:0 4px 16px var(--shadow); z-index:300; min-width:130px; overflow:hidden;">
                                <button onclick="startEditProject(${p.id})" style="display:block; width:100%; text-align:left; padding:10px 14px; font-size:14px; background:none; border:none; border-bottom:1px solid var(--border-color); cursor:pointer; color:var(--text-primary);">✏️ Edit Name</button>
                                <button onclick="deleteProjectFromRegistry(${p.id})" style="display:block; width:100%; text-align:left; padding:10px 14px; font-size:14px; background:none; border:none; cursor:pointer; color:#dc2626;">🗑 Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="proj-schedule-panel-${p.id}" style="display:none; padding:12px 8px 14px; background:var(--bg-tertiary); border-bottom:1px solid var(--border-color); border-left:3px solid var(--accent-color);">
                    <div id="proj-allocation-${p.id}" style="display:none; font-size:11px; color:var(--text-secondary); margin-bottom:8px; padding:5px 8px; background:var(--bg-secondary); border-radius:6px;"></div>
                    <div id="proj-alloc-warn-${p.id}" style="display:none; font-size:12px; color:#D93025; margin-bottom:6px; padding:4px 8px; background:rgba(220,38,38,0.08); border-radius:6px; border-left:2px solid #D93025;"></div>
                    <div id="proj-sessions-chips-${p.id}" style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px;"></div>
                    <div id="reg-sess-days-${p.id}" style="display:flex; gap:5px; flex-wrap:wrap; margin-bottom:8px;">
                        ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => `<button data-day="${d}" data-selected="0" onclick="toggleRegistryDayChip(this)" style="padding:4px 10px; font-size:12px; border:1px solid var(--border-color); border-radius:20px; cursor:pointer; background:var(--bg-secondary); color:var(--text-primary); font-weight:500;">${d}</button>`).join('')}
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr auto; gap:6px; align-items:end;">
                        <div>
                            <div style="font-size:11px; color:var(--text-secondary); margin-bottom:2px;">Start</div>
                            <input type="time" id="reg-sess-start-${p.id}" style="padding:5px 6px; font-size:13px; border:1px solid var(--border-color); border-radius:6px; background:var(--bg-secondary); color:var(--text-primary); width:100%;">
                        </div>
                        <div>
                            <div style="font-size:11px; color:var(--text-secondary); margin-bottom:2px;">End</div>
                            <input type="time" id="reg-sess-end-${p.id}" style="padding:5px 6px; font-size:13px; border:1px solid var(--border-color); border-radius:6px; background:var(--bg-secondary); color:var(--text-primary); width:100%;">
                        </div>
                        <button onclick="addRegistrySession(${p.id})" style="padding:5px 12px; font-size:13px; background:var(--accent-color); color:#fff; border:none; border-radius:6px; cursor:pointer; height:32px; align-self:end;">+ Add</button>
                    </div>
                </div>
                </div>`).join('');
            projects.forEach(p => renderRegistrySessions(p.id));
            renderProjectRegistryTotal();
        }

        function getProjectScheduledHours(p) {
            return (p.scheduledSessions || []).reduce((total, s) => {
                const [sh, sm] = s.startTime.split(':').map(Number);
                const [eh, em] = s.endTime.split(':').map(Number);
                return total + (eh * 60 + em - sh * 60 - sm) / 60;
            }, 0);
        }

        function renderScheduleAllocation(id) {
            const el = document.getElementById(`proj-allocation-${id}`);
            if (!el) return;
            const p = projects.find(x => x.id === id);
            if (!p) return;
            const planned = p.weeklyTargetHours || 0;
            const scheduled = getProjectScheduledHours(p);
            if (!planned) { el.style.display = 'none'; return; }
            const remaining = planned - scheduled;
            const remColor = remaining < 0 ? '#D93025' : remaining === 0 ? '#f59e0b' : 'var(--text-secondary)';
            el.style.display = '';
            el.innerHTML = `Planned: <b>${planned}h/wk</b> &nbsp;|&nbsp; Scheduled: <b>${scheduled.toFixed(1)}h</b> &nbsp;|&nbsp; <span style="color:${remColor}">Remaining: <b>${remaining.toFixed(1)}h</b></span>`;
        }

        function toggleSchedulePanel(id) {
            const panel = document.getElementById(`proj-schedule-panel-${id}`);
            if (!panel) return;
            const open = panel.style.display !== 'none';
            panel.style.display = open ? 'none' : 'block';
            if (!open) renderScheduleAllocation(id);
        }

        function renderRegistrySessions(id) {
            const el = document.getElementById(`proj-sessions-chips-${id}`);
            if (!el) return;
            const p = projects.find(x => x.id === id);
            if (!p || !(p.scheduledSessions || []).length) {
                el.innerHTML = '<span style="font-size:12px; color:var(--text-secondary);">No sessions yet.</span>';
                renderScheduleAllocation(id);
                return;
            }
            el.innerHTML = p.scheduledSessions.map((s, i) => {
                const blocks = expandTo60MinBlocks(s.startTime, s.endTime).length;
                const label = `${s.day} ${s.startTime}–${s.endTime}` + (blocks > 1 ? ` (${blocks})` : '');
                return `<span style="display:inline-flex; align-items:center; gap:5px; padding:3px 10px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:20px; font-size:12px;">${label}<button onclick="removeRegistrySession(${id},${i})" style="background:none; border:none; color:var(--text-secondary); cursor:pointer; font-size:14px; padding:0; line-height:1;">×</button></span>`;
            }).join('');
            renderScheduleAllocation(id);
        }

        function toggleRegistryDayChip(btn) {
            const sel = btn.dataset.selected === '1';
            btn.dataset.selected = sel ? '0' : '1';
            btn.style.background = sel ? 'var(--bg-secondary)' : 'var(--accent-color)';
            btn.style.color = sel ? 'var(--text-primary)' : '#fff';
            btn.style.borderColor = sel ? 'var(--border-color)' : 'var(--accent-color)';
        }

        function addRegistrySession(id) {
            const daysContainer = document.getElementById(`reg-sess-days-${id}`);
            const selectedDays = daysContainer
                ? Array.from(daysContainer.querySelectorAll('[data-selected="1"]')).map(b => b.dataset.day)
                : [];
            const startTime = document.getElementById(`reg-sess-start-${id}`)?.value;
            const endTime = document.getElementById(`reg-sess-end-${id}`)?.value;
            if (!selectedDays.length) return alert('Please select at least one day');
            if (!startTime || !endTime) return alert('Please set start and end times');
            if (startTime >= endTime) return alert('End time must be after start time');
            const p = projects.find(x => x.id === id);
            if (!p) return;
            if (!p.scheduledSessions) p.scheduledSessions = [];
            const [sh, sm] = startTime.split(':').map(Number);
            const [eh, em] = endTime.split(':').map(Number);
            const addedHours = selectedDays.length * (eh * 60 + em - sh * 60 - sm) / 60;
            const willSchedule = getProjectScheduledHours(p) + addedHours;
            if (p.weeklyTargetHours && willSchedule > p.weeklyTargetHours) {
                const overBy = (willSchedule - p.weeklyTargetHours).toFixed(1);
                const warnEl = document.getElementById(`proj-alloc-warn-${id}`);
                if (warnEl) {
                    warnEl.textContent = `⚠️ Exceeds planned ${p.weeklyTargetHours}h/wk by ${overBy}h`;
                    warnEl.style.display = '';
                    setTimeout(() => { warnEl.style.display = 'none'; }, 5000);
                }
            }
            selectedDays.forEach(day => p.scheduledSessions.push({ day, startTime, endTime }));
            saveProjects();
            renderRegistrySessions(id);
            // Reset day chips
            if (daysContainer) {
                daysContainer.querySelectorAll('[data-selected="1"]').forEach(b => {
                    b.dataset.selected = '0';
                    b.style.background = 'var(--bg-secondary)';
                    b.style.color = 'var(--text-primary)';
                    b.style.borderColor = 'var(--border-color)';
                });
            }
            const startEl = document.getElementById(`reg-sess-start-${id}`);
            const endEl = document.getElementById(`reg-sess-end-${id}`);
            if (startEl) startEl.value = '';
            if (endEl) endEl.value = '';
        }

        function removeRegistrySession(id, index) {
            const p = projects.find(x => x.id === id);
            if (!p || !p.scheduledSessions) return;
            p.scheduledSessions.splice(index, 1);
            saveProjects();
            renderRegistrySessions(id);
        }
        function addProjectToRegistry() {
            const inp = document.getElementById('projectRegistryNewName');
            const name = inp ? inp.value.trim() : '';
            if (!name) return;
            projects.push({ id: Date.now(), name, updatedAt: Date.now() });
            saveProjects();
            if (inp) inp.value = '';
            renderProjectRegistry();
        }
        function toggleProjectMenu(id) {
            const menu = document.getElementById(`proj-menu-${id}`);
            const isOpen = menu && menu.style.display !== 'none';
            closeAllProjectMenus();
            if (!isOpen && menu) menu.style.display = 'block';
        }
        function closeAllProjectMenus() {
            document.querySelectorAll('[id^="proj-menu-"]').forEach(el => { el.style.display = 'none'; });
        }
        function startEditProject(id) {
            closeAllProjectMenus();
            const nameEl = document.getElementById(`proj-name-${id}`);
            const editInput = document.getElementById(`proj-edit-${id}`);
            const editBtns = document.getElementById(`proj-edit-btns-${id}`);
            const controls = document.getElementById(`proj-controls-${id}`);
            if (!nameEl || !editInput) return;
            nameEl.style.display = 'none';
            if (controls) controls.style.display = 'none';
            editInput.style.display = 'block';
            if (editBtns) editBtns.style.display = 'flex';
            editInput.focus();
            editInput.select();
        }
        function cancelProjectEdit(id) {
            const p = projects.find(p => p.id === id);
            const nameEl = document.getElementById(`proj-name-${id}`);
            const editInput = document.getElementById(`proj-edit-${id}`);
            const editBtns = document.getElementById(`proj-edit-btns-${id}`);
            const controls = document.getElementById(`proj-controls-${id}`);
            if (!nameEl || !editInput) return;
            if (p) editInput.value = p.name;
            nameEl.style.display = '';
            editInput.style.display = 'none';
            if (editBtns) editBtns.style.display = 'none';
            if (controls) controls.style.display = 'flex';
        }
        function saveProjectEdit(id) {
            const editInput = document.getElementById(`proj-edit-${id}`);
            const editBtns = document.getElementById(`proj-edit-btns-${id}`);
            const controls = document.getElementById(`proj-controls-${id}`);
            const name = editInput ? editInput.value.trim() : '';
            if (!name) return;
            const p = projects.find(p => p.id === id);
            if (!p) return;
            p.name = name;
            p.updatedAt = Date.now();
            sessionLogs.forEach(s => { if (s.projectId === id) s.projectName = name; });
            saveProjects();
            saveSessionLogs();
            // Update in-place — avoid full re-render which would lose unsaved target inputs
            const nameEl = document.getElementById(`proj-name-${id}`);
            if (nameEl) { nameEl.textContent = name; nameEl.style.display = ''; }
            if (editInput) editInput.style.display = 'none';
            if (editBtns) editBtns.style.display = 'none';
            if (controls) controls.style.display = 'flex';
        }
        function deleteProjectFromRegistry(id) {
            closeAllProjectMenus();
            if (!confirm('Delete this project? Sessions using it keep their recorded name.')) return;
            projects = projects.filter(p => p.id !== id);
            saveProjects();
            renderProjectRegistry();
        }
        function updateProjectTarget(id, value) {
            const p = projects.find(p => p.id === id);
            if (!p) return;
            const hrs = parseFloat(value);
            p.weeklyTargetHours = isNaN(hrs) || hrs <= 0 ? 0 : hrs;
            p.updatedAt = Date.now();
            saveProjects();
            renderProjectRegistryTotal();
        }
        function renderProjectRegistryTotal() {
            const totalEl = document.getElementById('projectRegistryTotal');
            if (!totalEl) return;
            let total = 0;
            projects.forEach(p => {
                const input = document.getElementById(`proj-target-${p.id}`);
                const val = input ? parseFloat(input.value) : (p.weeklyTargetHours || 0);
                if (!isNaN(val) && val > 0) total += val;
            });
            if (total > 0) {
                const totalStr = total % 1 === 0 ? total.toFixed(0) : total.toFixed(1);
                totalEl.textContent = `Total: ${totalStr} hrs / week`;
                totalEl.style.display = 'block';
            } else {
                totalEl.style.display = 'none';
            }
        }
        function projDragStart(id) {
            _dragSrcProjectId = id;
            const row = document.getElementById(`proj-row-${id}`);
            if (row) row.classList.add('proj-row-dragging');
        }
        function projDragOver(e, id) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (id === _dragSrcProjectId) return;
            document.querySelectorAll('.proj-row-drag-over').forEach(el => el.classList.remove('proj-row-drag-over'));
            const row = document.getElementById(`proj-row-${id}`);
            if (row) row.classList.add('proj-row-drag-over');
        }
        function projDragLeave(e, id) {
            const row = document.getElementById(`proj-row-${id}`);
            if (row) row.classList.remove('proj-row-drag-over');
        }
        function projDrop(e, id) {
            e.preventDefault();
            const srcId = _dragSrcProjectId;
            if (!srcId || srcId === id) return;
            const srcIdx = projects.findIndex(p => p.id === srcId);
            const dstIdx = projects.findIndex(p => p.id === id);
            if (srcIdx === -1 || dstIdx === -1) return;
            const [moved] = projects.splice(srcIdx, 1);
            projects.splice(dstIdx, 0, moved);
            saveProjects();
            renderProjectRegistry();
        }
        function projDragEnd() {
            _dragSrcProjectId = null;
            document.querySelectorAll('.proj-row-dragging, .proj-row-drag-over').forEach(el => {
                el.classList.remove('proj-row-dragging', 'proj-row-drag-over');
            });
        }
        // ──────────────────────────────────────────────────────────────────

        function saveTabOrder() {
            localStorage.setItem('lifescore_tab_order_v4', JSON.stringify(tabOrder));
        }

      
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // ========================================
        // ISLAND TAB
        // ========================================

        // Fixed slot definitions — each position has a chain of upgrade tiers
        const ISLAND_IMG = 'public/assets/islands/tropical-island/';

        const ISLAND_SLOTS = [
            { pos: 'palm_left',   x: 28, y: 30, chain: [
                { id: 'palm1',    name: 'Palm Tree',   icon: '🌴', img: ISLAND_IMG + 'palm-tree.png.png',  cost: 200 },
            ]},
            { pos: 'palm_right',  x: 72, y: 30, chain: [
                { id: 'palm2',    name: 'Palm Tree',   icon: '🌴', img: ISLAND_IMG + 'palm-tree.png.png',  cost: 200 },
            ]},
            { pos: 'palm_top',    x: 50, y: 22, chain: [
                { id: 'palm3',    name: 'Palm Tree',   icon: '🌴', img: ISLAND_IMG + 'palm-tree.png.png',  cost: 300 },
            ]},
            { pos: 'fire',        x: 40, y: 52, chain: [
                { id: 'campfire', name: 'Campfire',    icon: '🔥', img: ISLAND_IMG + 'campfire.png.png',   cost: 150 },
                { id: 'stone_pit',name: 'Stone Firepit',icon: '🪨', img: ISLAND_IMG + 'stone-firepit.png', cost: 300 },
                { id: 'bonfire',  name: 'Bonfire',     icon: '🪵', img: ISLAND_IMG + 'campfire.png.png',   cost: 500 },
            ]},
            { pos: 'home',        x: 52, y: 48, chain: [
                { id: 'tent',     name: 'Tent',        icon: '⛺', img: ISLAND_IMG + 'tent.png',           cost: 300 },
                { id: 'cabin',    name: 'Cabin',       icon: '🏠', img: ISLAND_IMG + 'cabin.png',          cost: 500 },
                { id: 'house',    name: 'House',       icon: '🏡', img: ISLAND_IMG + 'house.png',          cost: 800 },
                { id: 'villa',    name: 'Villa',       icon: '🏰', img: ISLAND_IMG + 'villa.png',          cost: 1500 },
            ]},
            { pos: 'well',        x: 62, y: 50, chain: [
                { id: 'well',     name: 'Well',        icon: '🪣', cost: 250 },
            ]},
            { pos: 'farm',        x: 66, y: 38, chain: [
                { id: 'farm',     name: 'Farm',        icon: '🌾', cost: 400 },
            ]},
            { pos: 'port',        x: 28, y: 70, chain: [
                { id: 'dock',     name: 'Dock',        icon: '⚓', cost: 500 },
                { id: 'harbor',   name: 'Harbor',      icon: '🏗️', cost: 800 },
                { id: 'marina',   name: 'Marina',      icon: '⛵', cost: 1300 },
            ]},
            { pos: 'boat',        x: 18, y: 64, chain: [
                { id: 'boat',     name: 'Boat',        icon: '🚤', cost: 400 },
            ]},
            { pos: 'lighthouse',  x: 74, y: 61, chain: [
                { id: 'lighthouse', name: 'Lighthouse', icon: '🗼', cost: 700 },
            ]},
        ];

        const ISLAND_LEVELS = [
            { threshold: 0,    level: 1, name: 'Uncharted',      icon: '🌊', unlocks: ['Palm Trees', 'Campfire', 'Well'] },
            { threshold: 500,  level: 2, name: 'Sandy Shores',   icon: '🏖️', unlocks: ['Tent', 'Farm', 'Boat'] },
            { threshold: 1500, level: 3, name: 'Jungle Outpost', icon: '🌿', unlocks: ['Cabin', 'Stone Firepit', 'Dock'] },
            { threshold: 3500, level: 4, name: 'Tropical Haven', icon: '🏝️', unlocks: ['House', 'Harbor', 'Lighthouse'] },
            { threshold: 7000, level: 5, name: 'Paradise',       icon: '🌺', unlocks: ['Villa', 'Marina', 'Bonfire'] },
        ];

        const islandSpots = {
            palm1: { x: 18, y: 38 },
            palm2: { x: 73, y: 33 },
            palm3: { x: 52, y: 28 },
            tent: { x: 56, y: 55 },
            cabin: { x: 56, y: 55 },
            house: { x: 56, y: 55 },
            villa: { x: 56, y: 55 },
            campfire: { x: 47, y: 58 },
            stone_pit: { x: 47, y: 58 },
            bonfire: { x: 47, y: 58 },
            well: { x: 38, y: 50 },
            farm: { x: 72, y: 54 },
            dock: { x: 18, y: 78 },
            harbor: { x: 18, y: 78 },
            marina: { x: 18, y: 78 },
            boat: { x: 10, y: 84 },
            lighthouse: { x: 78, y: 62 }
        };

        let islandData = { xpSpent: 0, owned: [], positions: {}, celebratedComplete: false };
        let islandActiveSlotId = null;
        let islandPlacement = null;
        let islandDragging = null;

        function getIslandOwnedCost(owned = []) {
            const ownedSet = new Set(Array.isArray(owned) ? owned : []);
            return ISLAND_SLOTS
                .flatMap(slot => slot.chain)
                .filter(item => ownedSet.has(item.id))
                .reduce((sum, item) => sum + item.cost, 0);
        }

        function loadIslandData() {
            try {
                const raw = localStorage.getItem('lifescore_island_v4');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    // Migrate old free-placement format → new owned array format
                    if (parsed.items && !parsed.owned) {
                        const allIds = ISLAND_SLOTS.flatMap(s => s.chain.map(c => c.id));
                        const owned = (parsed.items || []).map(i => i.type).filter(t => allIds.includes(t));
                        islandData = { xpSpent: parsed.xpSpent || 0, owned };
                    } else {
                        islandData = { xpSpent: 0, owned: [], ...parsed };
                    }
                }
            } catch(e) { islandData = { xpSpent: 0, owned: [] }; }
            islandData.owned = Array.isArray(islandData.owned) ? islandData.owned : [];
            islandData.positions = islandData.positions && typeof islandData.positions === 'object' ? islandData.positions : {};
            islandData.celebratedComplete = Boolean(islandData.celebratedComplete);
            ISLAND_SLOTS.forEach(slot => {
                const cur = slotCurrentItem(slot);
                if (cur && !islandData.positions[slot.pos]) {
                    islandData.positions[slot.pos] = islandSpots[cur.id] || { x: slot.x, y: slot.y };
                }
            });
            const derivedSpent = getIslandOwnedCost(islandData.owned);
            if (islandData.xpSpent !== derivedSpent) {
                islandData.xpSpent = derivedSpent;
                saveIslandData();
            }
        }

        function saveIslandData() {
            localStorage.setItem('lifescore_island_v4', JSON.stringify(islandData));
        }

        function getIslandXPWallet() {
            return Math.max(0, getTotalXP() - islandData.xpSpent);
        }

        function getIslandLevelInfo() {
            let cur = ISLAND_LEVELS[0];
            for (const l of ISLAND_LEVELS) { if (islandData.xpSpent >= l.threshold) cur = l; }
            return cur;
        }

        // Returns the most advanced OWNED item in the slot's chain, or null
        function slotCurrentItem(slot) {
            for (let i = slot.chain.length - 1; i >= 0; i--) {
                if (islandData.owned.includes(slot.chain[i].id)) return slot.chain[i];
            }
            return null;
        }

        // Returns the next purchasable item (one tier above current), or null if maxed
        function slotNextItem(slot) {
            const cur = slotCurrentItem(slot);
            if (!cur) return slot.chain[0];
            const idx = slot.chain.findIndex(c => c.id === cur.id);
            return idx < slot.chain.length - 1 ? slot.chain[idx + 1] : null;
        }

        function slotIsComplete(slot) {
            return slot.chain.every(c => islandData.owned.includes(c.id));
        }

        function renderIslandTab() {
            const wallet = getIslandXPWallet();
            const lvl = getIslandLevelInfo();
            const wEl = document.getElementById('islandWalletVal');
            if (wEl) wEl.textContent = Math.floor(wallet) + ' XP';
            const sEl = document.getElementById('islandSpentVal');
            if (sEl) sEl.textContent = Math.floor(islandData.xpSpent) + ' XP';
            refreshTotalXPDisplay();
            const lEl = document.getElementById('islandLevelVal');
            if (lEl) lEl.textContent = `${lvl.icon} Lv.${lvl.level} · ${lvl.name}`;
            const nextLvl = ISLAND_LEVELS.find(l => l.threshold > islandData.xpSpent);
            const progEl = document.getElementById('islandLevelProgress');
            if (progEl) {
                if (nextLvl) {
                    const pct = Math.min(100, ((islandData.xpSpent - lvl.threshold) / (nextLvl.threshold - lvl.threshold)) * 100);
                    progEl.innerHTML = `<div style="height:4px;background:var(--border-color);border-radius:2px;margin-top:6px;overflow:hidden;"><div style="height:100%;width:${pct.toFixed(1)}%;background:var(--accent-color);border-radius:2px;transition:width 0.4s;"></div></div><div style="font-size:10px;color:var(--text-secondary);margin-top:3px;">${Math.floor(islandData.xpSpent)} / ${nextLvl.threshold} XP spent · Next: Lv.${nextLvl.level}</div>`;
                } else {
                    progEl.innerHTML = `<div style="font-size:10px;color:#00C853;margin-top:4px;font-weight:700;">🌺 Max Level Reached!</div>`;
                }
            }
            renderIslandItems();
            renderIslandShop();
        }

        function closeIslandItemPopup() {
            const p = document.getElementById('islandItemPopup');
            if (p) p.style.display = 'none';
            islandActiveSlotId = null;
        }


        function getIslandItemById(itemId) {
            return ISLAND_SLOTS.flatMap(slot => slot.chain).find(item => item.id === itemId) || null;
        }

        function getIslandCanvasPercent(event) {
            const canvas = document.getElementById('islandCanvas');
            const rect = canvas.getBoundingClientRect();
            const rawX = ((event.clientX - rect.left) / rect.width) * 100;
            const rawY = ((event.clientY - rect.top) / rect.height) * 100;
            const snap = value => Math.round(value / 2) * 2;
            return {
                x: Math.max(2, Math.min(98, snap(rawX))),
                y: Math.max(2, Math.min(98, snap(rawY)))
            };
        }

        function ensureIslandPlacementPreview() {
            const canvas = document.getElementById('islandCanvas');
            let preview = document.getElementById('islandPlacementPreview');
            if (!preview && canvas) {
                preview = document.createElement('div');
                preview.id = 'islandPlacementPreview';
                preview.className = 'island-item island-placement-preview';
                canvas.appendChild(preview);
            }
            return preview;
        }

        function updateIslandPlacementPreview(event) {
            if (!islandPlacement) return;
            const item = getIslandItemById(islandPlacement.itemId);
            const preview = ensureIslandPlacementPreview();
            if (!item || !preview) return;
            const point = getIslandCanvasPercent(event);
            preview.style.display = 'flex';
            preview.style.left = `${point.x}%`;
            preview.style.top = `${point.y}%`;
            preview.innerHTML = `
                ${item.img ? `<img class="island-item-img" src="${item.img}" alt="${item.name}" draggable="false">` : `<span class="island-item-icon">${item.icon}</span>`}
                <span class="island-item-label">${item.name}</span>
            `;
        }

        function clearIslandPlacement() {
            islandPlacement = null;
            const canvas = document.getElementById('islandCanvas');
            const hint = document.getElementById('islandCanvasHint');
            const preview = document.getElementById('islandPlacementPreview');
            if (canvas) canvas.classList.remove('placement-mode');
            if (hint) hint.textContent = '';
            if (preview) preview.style.display = 'none';
        }

        function beginIslandPlacement(slotPos, itemId) {
            const item = getIslandItemById(itemId);
            const canvas = document.getElementById('islandCanvas');
            const hint = document.getElementById('islandCanvasHint');
            if (!item || !canvas) return;
            closeIslandItemPopup();
            islandPlacement = { slotPos, itemId };
            canvas.classList.add('placement-mode');
            if (hint) hint.textContent = `Place ${item.name}: move over the island, then click to set it.`;
            ensureIslandPlacementPreview();
            renderIslandItems();
        }

        function placeIslandItem(event) {
            if (!islandPlacement) return;
            islandData.positions[islandPlacement.slotPos] = getIslandCanvasPercent(event);
            saveIslandData();
            clearIslandPlacement();
            renderIslandTab();
            checkIslandCompletion();
        }

        function setupIslandCanvasPlacement() {
            const canvas = document.getElementById('islandCanvas');
            if (!canvas || canvas.dataset.placementReady === 'true') return;
            canvas.dataset.placementReady = 'true';
            canvas.addEventListener('mousemove', updateIslandPlacementPreview);
            canvas.addEventListener('click', event => {
                if (islandPlacement) {
                    event.preventDefault();
                    event.stopPropagation();
                    placeIslandItem(event);
                } else if (event.target === canvas || event.target.id === 'islandItemsLayer') {
                    closeIslandItemPopup();
                }
            });
        }

        function isIslandComplete() {
            return ISLAND_SLOTS.every(slot => !slotNextItem(slot));
        }

        function showIslandCelebration() {
            const msg = document.createElement('div');
            msg.className = 'island-celebration';
            msg.textContent = 'New Island Unlocked';
            document.body.appendChild(msg);
            setTimeout(() => msg.classList.add('show'), 20);
            setTimeout(() => {
                msg.classList.remove('show');
                setTimeout(() => msg.remove(), 250);
            }, 2600);
        }

        function checkIslandCompletion() {
            if (isIslandComplete() && !islandData.celebratedComplete) {
                islandData.celebratedComplete = true;
                saveIslandData();
                showIslandCelebration();
            }
        }

        function unlockIslandSlot(posId) {
            const slot = ISLAND_SLOTS.find(s => s.pos === posId);
            if (!slot) return;
            const next = slotNextItem(slot);
            if (!next) return;
            if (getIslandXPWallet() < next.cost) {
                alert('Not enough XP!');
                return;
            }
            if (!islandData.owned.includes(next.id)) islandData.owned.push(next.id);
            islandData.xpSpent += next.cost;
            if (!islandData.positions) islandData.positions = {};
            saveIslandData();
            refreshTotalXPDisplay();
            renderIslandTab();
            checkIslandCompletion();
            beginIslandPlacement(posId, next.id);
        }

        function isPointOnIslandLand(x, y) {
            return x >= 6 && x <= 94 && y >= 16 && y <= 90;
        }

        function startIslandObjectDrag(e, slot, cur, el) {
            if (e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            closeIslandItemPopup();

            const canvas = document.getElementById('islandCanvas');
            const getRect = () => canvas.getBoundingClientRect();
            const rect = getRect();

            const curPos = islandData.positions?.[slot.pos] || islandSpots[cur.id] || { x: slot.x, y: slot.y };
            const offset = {
                x: ((e.clientX - rect.left) / rect.width) * 100 - curPos.x,
                y: ((e.clientY - rect.top) / rect.height) * 100 - curPos.y
            };

            let lastValidPos = { x: curPos.x, y: curPos.y };
            let moved = false;
            islandDragging = slot.pos;

            el.classList.add('island-item-dragging');
            document.body.style.userSelect = 'none';
            canvas.style.cursor = 'grabbing';

            function onMove(moveE) {
                const r = getRect();
                const nx = Math.max(2, Math.min(98, ((moveE.clientX - r.left) / r.width) * 100 - offset.x));
                const ny = Math.max(2, Math.min(98, ((moveE.clientY - r.top) / r.height) * 100 - offset.y));
                if (isPointOnIslandLand(nx, ny)) {
                    lastValidPos = { x: nx, y: ny };
                    el.style.left = `${nx}%`;
                    el.style.top = `${ny}%`;
                    moved = true;
                }
            }

            function onUp() {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                el.classList.remove('island-item-dragging');
                document.body.style.userSelect = '';
                canvas.style.cursor = '';
                islandDragging = null;
                if (moved) {
                    const snap = v => Math.round(v / 2) * 2;
                    islandData.positions[slot.pos] = { x: snap(lastValidPos.x), y: snap(lastValidPos.y) };
                    saveIslandData();
                    renderIslandItems();
                }
            }

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        }

        function renderIslandItems() {
            const layer = document.getElementById('islandItemsLayer');
            if (!layer) return;
            setupIslandCanvasPlacement();
            layer.innerHTML = '';

            ISLAND_SLOTS.forEach(slot => {
                const cur = slotCurrentItem(slot);
                if (!cur) return;
                if (islandPlacement?.slotPos === slot.pos) return;

                const point = islandData.positions?.[slot.pos] || islandSpots[cur.id] || { x: slot.x, y: slot.y };
                const el = document.createElement('div');
                el.className = 'island-item';
                el.style.cssText = `left:${point.x}%;top:${point.y}%;`;
                el.dataset.slot = slot.pos;
                el.innerHTML = `
                    ${cur.img ? `<img class="island-item-img" src="${cur.img}" alt="${cur.name}" draggable="false">` : `<span class="island-item-icon">${cur.icon}</span>`}
                    <span class="island-item-label">${cur.name}</span>
                    <span class="island-item-settings" title="Settings">⚙</span>
                `;

                el.querySelector('.island-item-settings').addEventListener('click', e => {
                    e.stopPropagation();
                    openIslandItemPopup(slot.pos);
                });

                el.addEventListener('contextmenu', e => {
                    e.preventDefault();
                    e.stopPropagation();
                    openIslandItemPopup(slot.pos);
                });

                el.addEventListener('mousedown', e => {
                    if (e.button !== 0) return;
                    startIslandObjectDrag(e, slot, cur, el);
                });

                layer.appendChild(el);
            });
        }

        function renderIslandShop() {
            const shopEl = document.getElementById('islandShopList');
            if (!shopEl) return;
            const wallet = getIslandXPWallet();

            shopEl.innerHTML = ISLAND_SLOTS.map(slot => {
                const cur = slotCurrentItem(slot);
                const next = slotNextItem(slot);

                const shopIcon = item => item.img
                    ? `<img class="island-shop-img" src="${item.img}" alt="${item.name}">`
                    : `<span class="island-shop-icon">${item.icon}</span>`;

                if (!next) {
                    const owned = cur || slot.chain[slot.chain.length - 1];
                    return `<div class="island-shop-item island-shop-complete">
                        ${shopIcon(owned)}
                        <div class="island-shop-info">
                            <div class="island-shop-name">${owned.name}</div>
                            <div class="island-shop-status-done">Owned</div>
                        </div>
                    </div>`;
                }

                const canBuy = wallet >= next.cost;
                const isUpgrade = !!cur;
                return `<div class="island-shop-item${canBuy ? '' : ' island-shop-locked'}">
                    ${shopIcon(next)}
                    <div class="island-shop-info">
                        <div class="island-shop-name">${next.name}</div>
                        <div class="island-shop-cost">${next.cost} XP</div>
                        ${isUpgrade ? `<div class="island-shop-from">Owned: ${cur.name}</div>` : ''}
                    </div>
                    <button class="island-buy-btn${isUpgrade ? ' island-upgrade-btn' : ''}"
                        onclick="unlockIslandSlot('${slot.pos}')"
                        ${canBuy ? '' : 'disabled'}>${isUpgrade ? 'Upgrade' : 'Unlock'}</button>
                </div>`;
            }).join('');
        }

        function openIslandItemPopup(posId) {
            const slot = ISLAND_SLOTS.find(s => s.pos === posId);
            if (!slot) return;
            const cur = slotCurrentItem(slot);
            if (!cur) return;
            const next = slotNextItem(slot);
            islandActiveSlotId = posId;

            const canvas = document.getElementById('islandCanvas');
            const point = islandData.positions?.[posId] || islandSpots[cur.id] || { x: slot.x, y: slot.y };
            const w = canvas.offsetWidth;
            const h = canvas.offsetHeight;
            let left = point.x / 100 * w + 28;
            let top = point.y / 100 * h - 110;
            if (left + 195 > w) left = point.x / 100 * w - 210;
            if (left < 4) left = 4;
            if (top < 4) top = point.y / 100 * h + 28;
            if (top + 220 > h) top = h - 224;

            const popup = document.getElementById('islandItemPopup');
            popup.style.cssText = `display:block;left:${left}px;top:${top}px;`;
            document.getElementById('islandItemPopupTitle').textContent = `${cur.icon} ${cur.name}`;

            const upBtn = document.getElementById('islandUpgradeBtn');
            upBtn.style.display = next ? 'block' : 'none';
            upBtn.textContent = next ? `Upgrade to ${next.name} · ${next.cost} XP` : '';
            upBtn.disabled = next ? getIslandXPWallet() < next.cost : true;
            upBtn.title = upBtn.disabled && next ? 'Not enough XP' : '';
        }

        function doUpgradeIslandItem() {
            if (!islandActiveSlotId) return;
            unlockIslandSlot(islandActiveSlotId);
        }

        function startApp() {
            try {
                init();
            } catch (e) {
                console.error('LifeScore startup failed', e);
                settings = normalizeSettings(settings || {});
                if (!Array.isArray(tabOrder) || tabOrder.length === 0) {
                    tabOrder = Object.keys(tabDefs);
                }
                applySettings();
                renderTabs();
                switchTab('today');
            }

            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    document.querySelectorAll('.modal.active').forEach(modal => {
                        modal.classList.remove('active');
                    });
                    editingId = null;
                    editingType = null;
                    currentHabitId = null;
                    currentHabitDate = null;
                    currentNoteId = null;
                }
            });
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', startApp);
        } else {
            startApp();
        }

// ========================================
// CLOUD SYNC — Firebase Realtime Database
// (firebase app + db initialized in index.html before this script)
// ========================================

const DB_PATH = 'users/default/data';

const SYNC_KEYS = [
    'lifescore_habits_v4',
    'lifescore_habit_logs_v4',
    'lifescore_session_logs_v4',
    'lifescore_streaks_v4',
    'lifescore_gems_v4',
    'lifescore_projects_v4',
    'lifescore_tools_v4',
    'lifescore_tab_order_v4',
    'lifescore_points_config_v4',
    'lifescore_weekly_sessions_v4',
    'lifescore_settings_v4',
    'lifescore_notes_v4',
    'lifescore_task_logs_v4',
    'lifescore_tasks_v4',
    'lifescore_island_v4',
    'lifescore_world_v4',
    'lifescore_daily_session_overrides_v4',
    'lifescore_weekoverrides_v4',
];

let _cloudSyncTimer = null;
let _isSyncing = false;
let _suppressSync = false;
let _realtimeListenerActive = false;
let _origSetItem = null;   // captured before intercept override
let _keyModTimes = {};     // key -> timestamp of last local user-driven write

function setSyncStatus(status) {
    const el = document.getElementById('syncStatusIndicator');
    const dot = document.getElementById('mobileSyncDot');
    const map = {
        syncing: { text: '⟳ Syncing…',   color: '#f59e0b', bg: '#fffbeb', dot: '#f59e0b' },
        synced:  { text: '✓ Synced',      color: '#10b981', bg: '#ecfdf5', dot: '#10b981' },
        offline: { text: '⚡ Offline',    color: '#6b7280', bg: '#f3f4f6', dot: '#6b7280' },
        error:   { text: '✗ Sync error',  color: '#ef4444', bg: '#fef2f2', dot: '#ef4444' },
    };
    const cfg = map[status];
    if (!cfg) return;
    if (el) {
        el.textContent = cfg.text;
        el.style.color = cfg.color;
        el.style.background = cfg.bg;
        el.style.display = 'block';
        if (status === 'synced') setTimeout(() => { if (el) el.style.display = 'none'; }, 3000);
    }
    if (dot) {
        dot.style.background = cfg.dot;
        dot.title = cfg.text;
    }
}

function _recordKeyTime(key) {
    _keyModTimes[key] = Date.now();
    if (_origSetItem) {
        try { _origSetItem.call(localStorage, 'lifescore_key_times_v4', JSON.stringify(_keyModTimes)); } catch(e) {}
    }
}

function mergeProjects(localJson, cloudJson) {
    let local = [], cloud = [];
    try { local = JSON.parse(localJson || '[]'); } catch(e) {}
    try { cloud = JSON.parse(cloudJson || '[]'); } catch(e) {}
    if (!Array.isArray(local)) local = [];
    if (!Array.isArray(cloud)) cloud = [];
    const merged = new Map();
    local.forEach(p => merged.set(String(p.id), p));
    cloud.forEach(cp => {
        const id = String(cp.id);
        const lp = merged.get(id);
        if (!lp) {
            merged.set(id, cp);
        } else {
            const lt = lp.updatedAt || 0;
            const ct = cp.updatedAt || 0;
            if (ct > lt || (ct === lt && (cp.weeklyTargetHours || 0) > (lp.weeklyTargetHours || 0))) {
                merged.set(id, cp);
            }
        }
    });
    return JSON.stringify([...merged.values()]);
}

function getCloudBundle() {
    const bundle = { lastModified: Date.now(), keyTimes: { ..._keyModTimes } };
    SYNC_KEYS.forEach(key => {
        const v = localStorage.getItem(key);
        if (v !== null) bundle[key] = v;
    });
    return bundle;
}

function applyCloudBundle(bundle) {
    if (!bundle || typeof bundle !== 'object') return false;
    const cloudKeyTimes = (bundle.keyTimes && typeof bundle.keyTimes === 'object') ? bundle.keyTimes : {};
    const hasKeyTimes = Object.keys(cloudKeyTimes).length > 0;

    _suppressSync = true;
    let anyChanged = false;

    SYNC_KEYS.forEach(key => {
        if (bundle[key] == null) return;

        if (key === 'lifescore_projects_v4') {
            // Always merge projects by ID using updatedAt
            const merged = mergeProjects(localStorage.getItem(key), bundle[key]);
            const current = localStorage.getItem(key);
            if (merged !== current) { localStorage.setItem(key, merged); anyChanged = true; }
            _keyModTimes[key] = Math.max(_keyModTimes[key] || 0, cloudKeyTimes[key] || 0);
        } else if (hasKeyTimes) {
            // Per-key merge: take cloud only if its timestamp is at least as new
            const localTime = _keyModTimes[key] || 0;
            const cloudTime = cloudKeyTimes[key] || 0;
            if (cloudTime >= localTime) {
                const current = localStorage.getItem(key);
                if (bundle[key] !== current) { localStorage.setItem(key, bundle[key]); anyChanged = true; }
                _keyModTimes[key] = cloudTime;
            }
            // else local is newer — keep it
        } else {
            // Bootstrap: old bundle with no keyTimes — apply everything (cloud wins)
            const current = localStorage.getItem(key);
            if (bundle[key] !== current) { localStorage.setItem(key, bundle[key]); anyChanged = true; }
        }
    });

    if (bundle.lastModified) localStorage.setItem('lifescore_last_modified_v4', String(bundle.lastModified));
    _suppressSync = false;

    // Persist updated key timestamps (bypass intercept directly)
    if (_origSetItem) {
        try { _origSetItem.call(localStorage, 'lifescore_key_times_v4', JSON.stringify(_keyModTimes)); } catch(e) {}
    }
    return anyChanged;
}

async function pushToCloud() {
    if (_isSyncing) return;
    _isSyncing = true;
    setSyncStatus('syncing');
    const ts = Date.now();
    _suppressSync = true;
    localStorage.setItem('lifescore_last_modified_v4', String(ts));
    _suppressSync = false;
    const bundle = getCloudBundle();
    bundle.lastModified = ts;
    try {
        await db.ref(DB_PATH).set(bundle);
        setSyncStatus('synced');
    } catch (e) {
        console.error('[Sync] Push error:', e.message);
        setSyncStatus(navigator.onLine ? 'error' : 'offline');
    } finally {
        _isSyncing = false;
    }
}

async function pullFromCloud() {
    setSyncStatus('syncing');
    try {
        const snap = await db.ref(DB_PATH).once('value');
        const cloudBundle = snap.val();
        if (!cloudBundle) { setSyncStatus('synced'); return false; }
        const localTs = parseInt(localStorage.getItem('lifescore_last_modified_v4') || '0', 10);
        const cloudTs = cloudBundle.lastModified || 0;
        const cloudHasKeyTimes = cloudBundle.keyTimes && Object.keys(cloudBundle.keyTimes).length > 0;
        if (cloudHasKeyTimes || cloudTs > localTs) {
            const changed = applyCloudBundle(cloudBundle);
            setSyncStatus('synced');
            return changed;
        }
        setSyncStatus('synced');
        return false;
    } catch (e) {
        console.error('[Sync] Pull error:', e.message);
        setSyncStatus(navigator.onLine ? 'error' : 'offline');
        return false;
    }
}

function scheduleCloudSync() {
    if (_suppressSync) return;
    if (_cloudSyncTimer) clearTimeout(_cloudSyncTimer);
    _cloudSyncTimer = setTimeout(() => {
        _cloudSyncTimer = null;
        pushToCloud();
    }, 3000);
}

function startRealtimeListener() {
    if (_realtimeListenerActive) return;
    _realtimeListenerActive = true;
    db.ref(DB_PATH).on('value', snap => {
        if (_suppressSync || _isSyncing) return;
        const cloudBundle = snap.val();
        if (!cloudBundle) return;
        const localTs = parseInt(localStorage.getItem('lifescore_last_modified_v4') || '0', 10);
        const cloudTs = cloudBundle.lastModified || 0;
        const cloudHasKeyTimes = cloudBundle.keyTimes && Object.keys(cloudBundle.keyTimes).length > 0;
        if (cloudTs > localTs + 1000 || cloudHasKeyTimes) {
            const changed = applyCloudBundle(cloudBundle);
            if (changed) {
                loadData();
                loadIslandData();
                loadWorldProgress();
                migrateData();
                recomputeAllStreaks();
                checkWorldIslandUnlocks(false);
                applySettings();
                renderTabs();
                updateProjectSelects();
                renderTodayView();
                renderHabitLog();
                if (settings.gamificationEnabled) calculateScores();
            }
        }
    }, e => {
        console.error('[Sync] Listener error:', e.message);
    });
}

async function initCloudSync() {
    // Load persisted per-key timestamps from previous session
    try {
        const saved = localStorage.getItem('lifescore_key_times_v4');
        if (saved) _keyModTimes = JSON.parse(saved);
    } catch(e) {}

    // Capture original setItem at module level, then install intercept
    _origSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
        _origSetItem.call(this, key, value);
        if (this === localStorage &&
            !_suppressSync &&
            key.startsWith('lifescore_') &&
            key !== 'lifescore_last_modified_v4' &&
            key !== 'lifescore_current_tab_v4' &&
            key !== 'lifescore_day_cutoff_v4' &&
            key !== 'lifescore_today_view_mode_v4' &&
            key !== 'lifescore_key_times_v4') {
            _recordKeyTime(key);
            scheduleCloudSync();
        }
    };

    const updated = await pullFromCloud();
    if (updated) {
        loadData();
        loadIslandData();
        loadWorldProgress();
        migrateData();
        recomputeAllStreaks();
        checkWorldIslandUnlocks(false);
        applySettings();
        renderTabs();
        updateProjectSelects();
        renderTodayView();
        renderHabitLog();
        if (settings.gamificationEnabled) calculateScores();
    }

    startRealtimeListener();
}

// ── Modal helpers ──────────────────────────────────────────────────────────────

function openSyncSettings() {
    document.getElementById('syncSettingsModal')?.classList.add('active');
}
function closeSyncSettings() {
    document.getElementById('syncSettingsModal')?.classList.remove('active');
}
async function syncNow() {
    closeSyncSettings();
    await pushToCloud();
}

// ── Pull-to-refresh: drag down on main content area → sync from cloud ──
(function initPullToRefresh() {
    let startY = 0, pulling = false, indicator = null;

    function getScrollEl() { return document.querySelector('.main-content-area'); }

    function createIndicator() {
        if (indicator) return;
        indicator = document.createElement('div');
        indicator.id = 'ptr-indicator';
        indicator.style.cssText = 'position:fixed;top:56px;left:50%;transform:translateX(-50%);background:var(--accent-color);color:#fff;font-size:12px;font-weight:700;padding:6px 16px;border-radius:0 0 20px 20px;z-index:9999;opacity:0;transition:opacity 0.2s;pointer-events:none;';
        document.body.appendChild(indicator);
    }

    document.addEventListener('touchstart', e => {
        const el = getScrollEl();
        if (!el || el.scrollTop > 0) return;
        startY = e.touches[0].clientY;
        pulling = true;
        createIndicator();
    }, { passive: true });

    document.addEventListener('touchmove', e => {
        if (!pulling || !indicator) return;
        const dy = e.touches[0].clientY - startY;
        if (dy > 10) {
            indicator.textContent = dy > 60 ? '↓ Release to refresh' : '↓ Pull to refresh';
            indicator.style.opacity = Math.min(dy / 60, 1).toString();
        }
    }, { passive: true });

    document.addEventListener('touchend', async e => {
        if (!pulling || !indicator) return;
        pulling = false;
        const dy = e.changedTouches[0].clientY - startY;
        if (dy > 60) {
            indicator.textContent = '⟳ Syncing…';
            indicator.style.opacity = '1';
            await pullFromCloud();
            indicator.textContent = '✓ Synced';
            setTimeout(() => { if (indicator) indicator.style.opacity = '0'; }, 1200);
        } else {
            if (indicator) indicator.style.opacity = '0';
        }
    });
})();

// ========================================
// MOBILE UI HELPERS
// ========================================

// ── ISSUE 1: Island shop bottom sheet ──────────────────────────────────────────
function toggleMobileShop() {
    const panel = document.querySelector('.island-shop-panel');
    const backdrop = document.getElementById('mobileShopBackdrop');
    if (!panel) return;
    const isOpen = panel.classList.contains('mobile-open');
    if (isOpen) { closeMobileShop(); return; }
    panel.classList.add('mobile-open');
    if (backdrop) backdrop.classList.add('open');
}
function closeMobileShop() {
    document.querySelector('.island-shop-panel')?.classList.remove('mobile-open');
    document.getElementById('mobileShopBackdrop')?.classList.remove('open');
}

// ── ISSUE 2: Active session slim bar ───────────────────────────────────────────
function toggleMobileSessionExpand() {
    const view = document.getElementById('activeSessionView');
    if (!view) return;
    view.classList.toggle('mobile-expanded');
}

// ── ISSUE 3 & 4: Habits mobile card view ──────────────────────────────────────
function toggleMobileHabitCard(habitId) {
    const card = document.querySelector(`.mobile-habit-card[data-habit-id="${habitId}"]`);
    if (card) card.classList.toggle('expanded');
}

function renderMobileHabitCards(last7Days, filteredHabits, todayStr) {
    const container = document.getElementById('mobileHabitCards');
    if (!container) return;
    if (!last7Days || !filteredHabits) { container.innerHTML = ''; return; }

    container.innerHTML = filteredHabits.map(habit => {
        const timeLabel = formatReminderTime(habit.reminderTime);
        const todayLog = habitLogs[habit.id]?.[todayStr];
        const todayState = getHabitLogState(todayLog);
        const stateClass = todayState === 'done' ? 'done' : todayState === 'failed' ? 'failed' : 'pending';
        const stateChar = todayState === 'done' ? '✓' : todayState === 'failed' ? '✗' : '○';

        const today = new Date(todayStr + 'T12:00:00');
        const trackStart = habit.startTrackingDate || '1900-01-01';
        const habitDays = habit.customDays || [0,1,2,3,4,5,6];

        const weekCells = last7Days.map(date => {
            const dateStr = date.toISOString().split('T')[0];
            const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = date.getDate();
            const isToday = date.toDateString() === today.toDateString();
            const isFuture = dateStr > todayStr;
            const dayOfWeek = date.getDay();
            const isApplicable = habitDays.includes(dayOfWeek);
            const beforeTracking = dateStr < trackStart;

            let cellClass = '', cellText = '·', clickable = false;
            if (!isApplicable || beforeTracking) {
                cellClass = 'na'; cellText = '·';
            } else if (isFuture) {
                cellText = '·';
            } else {
                clickable = true;
                const log = habitLogs[habit.id]?.[dateStr];
                const st = getHabitLogState(log);
                if (st === 'done') { cellClass = 'completed'; cellText = '✓'; }
                else if (st === 'failed') { cellClass = 'failed'; cellText = '✗'; }
                else { cellClass = 'failed'; cellText = '✗'; }
            }
            if (isToday) cellClass += ' today-hl';

            const onclick = clickable ? `onclick="showHabitValueModal(${habit.id},'${dateStr}')"` : '';
            return `<div class="mobile-habit-day">
                <span class="mobile-habit-day-label" style="${isToday ? 'color:var(--accent-color);' : ''}">${dayLabel}</span>
                <span class="mobile-habit-day-num">${dayNum}</span>
                <div class="mobile-habit-day-cell ${cellClass}" ${onclick}>${cellText}</div>
            </div>`;
        }).join('');

        return `<div class="mobile-habit-card" data-habit-id="${habit.id}">
            <div class="mobile-habit-card-main" onclick="toggleMobileHabitCard(${habit.id})">
                <span style="font-size:22px;flex-shrink:0;">${habit.icon || '🎯'}</span>
                <span class="mobile-habit-card-name">${escapeHtml(habit.name)}</span>
                ${timeLabel ? `<span class="time-chip-sm">${timeLabel}</span>` : ''}
                <div class="mobile-habit-today-status ${stateClass}" onclick="event.stopPropagation();showHabitValueModal(${habit.id},'${todayStr}')">${stateChar}</div>
                <button class="more-btn" onclick="event.stopPropagation();editHabit(${habit.id})" style="flex-shrink:0;">⋮</button>
                <span class="mobile-habit-chevron">▼</span>
            </div>
            <div class="mobile-habit-week">
                <div class="mobile-habit-week-grid">${weekCells}</div>
            </div>
        </div>`;
    }).join('');
}

