 class GabrielaAI {
    constructor() {
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.messagesContainer = document.getElementById('messages');
        this.typingIndicator = document.getElementById('typingIndicator');
        // Session management elements

        this.sessionDropdown = document.getElementById('sessionDropdown');
        this.sessionCurrent = document.getElementById('sessionCurrent');
        this.currentSessionName = document.getElementById('currentSessionName');
        this.sessionList = document.getElementById('sessionList');
        this.sessionCount = document.getElementById('sessionCount');
        this.newChatButton = document.getElementById('newChatButton');
        this.tempChatButton = document.getElementById('tempChatButton');

        // Hamburger menu and sidebar elements
        this.hamburgerMenu = document.getElementById('hamburgerMenu');
        this.chatHistorySidebar = document.getElementById('chatHistorySidebar');
        this.sidebarOverlay = document.getElementById('sidebarOverlay');
        this.chatContainer = document.getElementById('chatContainer');

        // Mobile chat action elements
        this.mobileChatActions = document.getElementById('mobileChatActions');
        this.mobileChatActionsTitle = document.getElementById('mobileChatActionsTitle');
        this.mobileRenameBtn = document.getElementById('mobileRenameBtn');
        this.mobileDeleteBtn = document.getElementById('mobileDeleteBtn');

        // Sidebar session controls (duplicated for mobile)
        this.sidebarSessionDropdown = document.getElementById('sidebarSessionDropdown');
        this.sidebarSessionCurrent = document.getElementById('sidebarSessionCurrent');
        this.sidebarCurrentSessionName = document.getElementById('sidebarCurrentSessionName');
        this.sidebarSessionList = document.getElementById('sidebarSessionList');
        this.sidebarSessionCount = document.getElementById('sidebarSessionCount');
        this.sidebarNewChatButton = document.getElementById('sidebarNewChatButton');
        this.sidebarTempChatButton = document.getElementById('sidebarTempChatButton');

        // Sidebar state
        this.isSidebarOpen = false;

        // Твоят OpenRouter API ключ (замени с валиден)
        this.apiKey = ".................................................";

        this.conversationHistory = [];

        // Multi-session management
        this.SESSIONS_KEY = 'gabriela_ai_sessions';
        this.CURRENT_SESSION_KEY = 'gabriela_ai_current_session';
        this.currentSessionId = null;
        this.sessions = {};
        this.isTemporarySession = false; // Track if current session is temporary

        // Chat persistence settings (now per session)
        this.STORAGE_KEY = 'gabriela_ai_chat_history'; // Legacy key for migration
        this.MAX_MESSAGES = 100; // Limit to last 100 messages
        this.MAX_AGE_DAYS = 30; // Keep messages for 30 days
        this.autoSaveEnabled = true;
        this.saveTimeout = null;

        this.initializeSessionManagement();
        this.initializeChatPersistence();
        this.initializeEventListeners();
        this.initializeVisualEffects();
        this.initializeHamburgerMenu();
    }
    
    initializeSessionManagement() {
        // Load existing sessions or create default
        this.loadSessions();

        // Migrate legacy single-session data if exists
        this.migrateLegacyData();

        // Set current session or create new one
        this.setCurrentSession();

        // Update UI
        this.updateSessionUI();
    }

    initializeChatPersistence() {
        this.loadCurrentSessionData();

        // Auto-save on page unload (only for non-temporary sessions)
        window.addEventListener('beforeunload', () => {
            if (this.autoSaveEnabled && !this.isTemporarySession) {
                this.saveCurrentSession();
            }
        });
    }

    initializeEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Session management controls
        this.newChatButton.addEventListener('click', () => this.createNewSession());
        this.tempChatButton.addEventListener('click', () => this.createTemporarySession());
        this.sessionCurrent.addEventListener('click', () => this.toggleSessionDropdown());

        // Mobile chat action buttons
        if (this.mobileRenameBtn) {
            this.mobileRenameBtn.addEventListener('click', () => this.handleMobileRename());
        }
        if (this.mobileDeleteBtn) {
            this.mobileDeleteBtn.addEventListener('click', () => this.handleMobileDelete());
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.sessionDropdown.contains(e.target)) {
                this.closeSessionDropdown();
            }
        });

        // Auto-save on input (debounced) - only for non-temporary sessions
        this.messageInput.addEventListener('input', () => {
            if (this.autoSaveEnabled && !this.isTemporarySession) {
                this.debouncedAutoSave();
            }
        });

        // Sidebar session controls (duplicated functionality for mobile)
        this.sidebarNewChatButton.addEventListener('click', () => {
            this.createNewSession();
            this.closeSidebar();
        });
        this.sidebarTempChatButton.addEventListener('click', () => {
            this.createTemporarySession();
            this.closeSidebar();
        });
        this.sidebarSessionCurrent.addEventListener('click', () => this.toggleSidebarSessionDropdown());

        // Close sidebar dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.sidebarSessionDropdown.contains(e.target)) {
                this.closeSidebarSessionDropdown();
            }
        });

        // Add ripple effect to buttons
        this.sendButton.addEventListener('click', this.createRipple.bind(this));
        this.newChatButton.addEventListener('click', this.createRipple.bind(this));
        this.tempChatButton.addEventListener('click', this.createRipple.bind(this));
        this.sidebarNewChatButton.addEventListener('click', this.createRipple.bind(this));
        this.sidebarTempChatButton.addEventListener('click', this.createRipple.bind(this));
    }

    initializeVisualEffects() {
        // Add ripple class to interactive elements
        this.sendButton.classList.add('ripple');

        // Add hover effects to suggestions
        document.querySelectorAll('.suggestion').forEach(suggestion => {
            suggestion.classList.add('ripple');
            suggestion.addEventListener('click', this.createRipple.bind(this));
        });

        // Add typing effect to input field
        this.messageInput.addEventListener('input', this.handleInputTyping.bind(this));

        // Add focus glow effect
        this.messageInput.addEventListener('focus', this.addInputGlow.bind(this));
        this.messageInput.addEventListener('blur', this.removeInputGlow.bind(this));
    }

    initializeHamburgerMenu() {
        // Hamburger menu only opens sidebar, never closes it
        this.hamburgerMenu.addEventListener('click', () => {
            if (!this.isSidebarOpen) {
                this.openSidebar();
            }
        });
        this.sidebarOverlay.addEventListener('click', () => this.closeSidebar());

        // Keyboard accessibility - only opens sidebar
        this.hamburgerMenu.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!this.isSidebarOpen) {
                    this.openSidebar();
                }
            }
        });

        // Close sidebar on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isSidebarOpen) {
                this.closeSidebar();
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 1024 && this.isSidebarOpen) {
                this.closeSidebar();
            }
            // Hide mobile actions when switching to desktop view
            if (!this.isMobileView()) {
                this.hideMobileChatActions();
            }
        });

        // Initialize touch/drag functionality for mobile
        this.initializeTouchGestures();
    }

    initializeTouchGestures() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;
        let isDragging = false;
        let startTime = 0;

        // Touch events for sidebar - swipe left to close
        this.chatHistorySidebar.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            startTime = Date.now();
            isDragging = false;
        }, { passive: true });

        this.chatHistorySidebar.addEventListener('touchmove', (e) => {
            if (!this.isSidebarOpen) return;

            const touchCurrentX = e.touches[0].clientX;
            const touchCurrentY = e.touches[0].clientY;
            const deltaX = touchCurrentX - touchStartX;
            const deltaY = Math.abs(touchCurrentY - touchStartY);

            // Only consider horizontal swipes (ignore vertical scrolling)
            if (Math.abs(deltaX) > 10 && deltaY < 50) {
                isDragging = true;

                // Swipe left to close (negative deltaX)
                if (deltaX < -50) {
                    // Add visual feedback during drag
                    const dragDistance = Math.max(deltaX, -300);
                    this.chatHistorySidebar.style.transform = `translateX(${dragDistance}px)`;
                    this.chatHistorySidebar.style.transition = 'none';
                }
            }
        }, { passive: true });

        this.chatHistorySidebar.addEventListener('touchend', (e) => {
            if (!this.isSidebarOpen || !isDragging) {
                // Reset any transforms
                this.chatHistorySidebar.style.transform = '';
                this.chatHistorySidebar.style.transition = '';
                return;
            }

            touchEndX = e.changedTouches[0].clientX;
            touchEndY = e.changedTouches[0].clientY;
            const deltaX = touchEndX - touchStartX;
            const deltaY = Math.abs(touchEndY - touchStartY);
            const deltaTime = Date.now() - startTime;

            // Reset transform and transition
            this.chatHistorySidebar.style.transform = '';
            this.chatHistorySidebar.style.transition = '';

            // Determine if it's a swipe gesture or drag
            const isSwipe = Math.abs(deltaX) > 50 && deltaY < 100 && deltaTime < 300;
            const isDrag = Math.abs(deltaX) > 100;

            // Close sidebar on left swipe or significant left drag
            if ((isSwipe && deltaX < -50) || (isDrag && deltaX < -100)) {
                this.closeSidebar();
            }

            isDragging = false;
        }, { passive: true });

        // Touch events for overlay - tap to close
        this.sidebarOverlay.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            startTime = Date.now();
        }, { passive: true });

        this.sidebarOverlay.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].clientX;
            touchEndY = e.changedTouches[0].clientY;
            const deltaTime = Date.now() - startTime;
            const deltaX = Math.abs(touchEndX - touchStartX);
            const deltaY = Math.abs(touchEndY - touchStartY);

            // Close on tap (not drag) on overlay
            if (deltaX < 10 && deltaY < 10 && deltaTime < 300) {
                this.closeSidebar();
            }
        }, { passive: true });
    }



    openSidebar() {
        this.isSidebarOpen = true;
        this.chatHistorySidebar.classList.add('open');
        this.sidebarOverlay.classList.add('active');
        this.chatContainer.classList.add('sidebar-open');
        this.hamburgerMenu.classList.add('active');
        this.hamburgerMenu.setAttribute('aria-expanded', 'true');

        // Update sidebar session UI to match main UI
        this.updateSidebarSessionUI();

        // Show mobile chat actions if on mobile and a session is selected
        if (this.isMobileView() && this.currentSessionId && !this.isTemporarySession) {
            this.showMobileChatActions(this.currentSessionId);
        }

        // Setup focus trap for accessibility
        setTimeout(() => this.setupFocusTrap(), 100);

        // Prevent body scroll on mobile
        document.body.style.overflow = 'hidden';
    }

    closeSidebar() {
        this.isSidebarOpen = false;
        this.chatHistorySidebar.classList.remove('open');
        this.sidebarOverlay.classList.remove('active');
        this.chatContainer.classList.remove('sidebar-open');
        this.hamburgerMenu.classList.remove('active');
        this.hamburgerMenu.setAttribute('aria-expanded', 'false');

        // Close any open dropdowns in sidebar
        this.closeSidebarSessionDropdown();

        // Hide mobile chat actions when sidebar closes
        this.hideMobileChatActions();

        // Restore body scroll
        document.body.style.overflow = '';
    }

    createRipple(e) {
        const button = e.currentTarget;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple-effect');

        button.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    handleInputTyping() {
        // Add subtle glow when typing
        this.messageInput.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1), 0 0 20px rgba(102, 126, 234, 0.05)';

        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.messageInput.style.boxShadow = '';
        }, 1000);
    }

    addInputGlow() {
        this.messageInput.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(102, 126, 234, 0.02) 100%)';
    }

    removeInputGlow() {
        this.messageInput.style.background = 'rgba(255, 255, 255, 0.9)';
    }

    // Sidebar Session Management Methods
    updateSidebarSessionUI() {
        // Sync sidebar session name with main session
        this.sidebarCurrentSessionName.textContent = this.currentSessionName.textContent;
        this.sidebarCurrentSessionName.style.color = this.currentSessionName.style.color;

        // Update session count
        this.sidebarSessionCount.textContent = this.sessionCount.textContent;

        // Update session list
        this.updateSidebarSessionList();
    }

    updateSidebarSessionList() {
        this.sidebarSessionList.innerHTML = '';

        const sortedSessions = Object.values(this.sessions).sort((a, b) => b.timestamp - a.timestamp);

        sortedSessions.forEach(session => {
            const sessionItem = document.createElement('div');
            sessionItem.className = `session-item ${session.id === this.currentSessionId ? 'active' : ''}`;

            const preview = this.getSessionPreview(session);

            sessionItem.innerHTML = `
                <div class="session-info">
                    <div class="session-title">${session.name}</div>
                    <div class="session-preview">${preview}</div>
                </div>
                <div class="session-actions">
                    <button class="session-action-btn rename-btn" onclick="gabrielaAI.promptRenameSession('${session.id}')">✏️</button>
                    ${Object.keys(this.sessions).length > 1 ? `<button class="session-action-btn delete-btn" onclick="gabrielaAI.deleteSession('${session.id}')">🗑️</button>` : ''}
                </div>
            `;

            // Add click handler for session switching
            sessionItem.addEventListener('click', (e) => {
                if (!e.target.classList.contains('session-action-btn')) {
                    this.switchToSession(session.id);
                    // On mobile, show actions instead of closing sidebar
                    if (this.isMobileView()) {
                        this.showMobileChatActions(session.id);
                    } else {
                        this.closeSidebar(); // Close sidebar after switching on desktop
                    }
                }
            });

            this.sidebarSessionList.appendChild(sessionItem);
        });
    }

    toggleSidebarSessionDropdown() {
        this.sidebarSessionDropdown.classList.toggle('open');
        if (this.sidebarSessionDropdown.classList.contains('open')) {
            this.updateSidebarSessionList();
        }
    }

    closeSidebarSessionDropdown() {
        this.sidebarSessionDropdown.classList.remove('open');
    }

    // Mobile Chat Actions Methods
    showMobileChatActions(sessionId) {
        if (!this.mobileChatActions || !sessionId || this.isTemporarySession) {
            this.hideMobileChatActions();
            return;
        }

        const session = this.sessions[sessionId];
        if (!session) {
            this.hideMobileChatActions();
            return;
        }

        // Update the title to show which chat is selected
        if (this.mobileChatActionsTitle) {
            this.mobileChatActionsTitle.textContent = `Actions for "${session.name}"`;
        }

        // Show/hide delete button based on session count
        if (this.mobileDeleteBtn) {
            const sessionCount = Object.keys(this.sessions).length;
            this.mobileDeleteBtn.style.display = sessionCount > 1 ? 'flex' : 'none';
        }

        // Store current session ID for mobile actions
        this.mobileChatActions.dataset.sessionId = sessionId;

        // Show the mobile actions container
        this.mobileChatActions.style.display = 'block';
    }

    hideMobileChatActions() {
        if (this.mobileChatActions) {
            this.mobileChatActions.style.display = 'none';
            delete this.mobileChatActions.dataset.sessionId;
        }
    }

    handleMobileRename() {
        const sessionId = this.mobileChatActions?.dataset.sessionId;
        if (sessionId) {
            this.promptRenameSession(sessionId);
        }
    }

    handleMobileDelete() {
        const sessionId = this.mobileChatActions?.dataset.sessionId;
        if (sessionId) {
            this.deleteSession(sessionId);
            // Hide mobile actions after deletion
            this.hideMobileChatActions();
        }
    }

    // Check if we should show mobile actions based on screen size
    isMobileView() {
        return window.innerWidth <= 767;
    }

    // Temporary Session Methods
    createTemporarySession() {
        // Clear current messages without saving
        this.conversationHistory = [];
        this.clearDisplayedMessages();
        this.clearWelcomeMessage();

        // Set temporary session flag
        this.isTemporarySession = true;

        // Update UI to show temporary session
        this.currentSessionName.textContent = "Temporary Chat";
        this.currentSessionName.style.color = "#f59e0b";

        // Add temporary indicator
        const tempIndicator = document.createElement('span');
        tempIndicator.textContent = ' (Temp)';
        tempIndicator.style.fontSize = '0.8em';
        tempIndicator.style.opacity = '0.8';
        tempIndicator.id = 'tempIndicator';

        // Remove existing temp indicator if present
        const existingIndicator = document.getElementById('tempIndicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        this.currentSessionName.appendChild(tempIndicator);

        // Update sidebar to match
        if (this.sidebarCurrentSessionName) {
            this.sidebarCurrentSessionName.textContent = "Temporary Chat";
            this.sidebarCurrentSessionName.style.color = "#f59e0b";

            // Add temporary indicator to sidebar
            const sidebarTempIndicator = document.createElement('span');
            sidebarTempIndicator.textContent = ' (Temp)';
            sidebarTempIndicator.style.fontSize = '0.8em';
            sidebarTempIndicator.style.opacity = '0.8';
            sidebarTempIndicator.id = 'sidebarTempIndicator';

            // Remove existing temp indicator if present
            const existingSidebarIndicator = document.getElementById('sidebarTempIndicator');
            if (existingSidebarIndicator) {
                existingSidebarIndicator.remove();
            }

            this.sidebarCurrentSessionName.appendChild(sidebarTempIndicator);
        }

        // Show welcome message for temporary session
        this.showWelcomeMessage(true);

        // Hide mobile chat actions for temporary sessions
        this.hideMobileChatActions();
    }

    // Override session switching to handle temporary sessions
    switchToSession(sessionId) {
        if (!this.sessions[sessionId]) {
            console.error('Session not found:', sessionId);
            return;
        }

        // Save current session before switching (only if not temporary)
        if (this.currentSessionId && this.currentSessionId !== sessionId && !this.isTemporarySession) {
            this.saveCurrentSession();
        }

        // Reset temporary session flag
        this.isTemporarySession = false;

        // Remove temporary indicator
        const tempIndicator = document.getElementById('tempIndicator');
        if (tempIndicator) {
            tempIndicator.remove();
        }

        // Remove sidebar temporary indicator
        const sidebarTempIndicator = document.getElementById('sidebarTempIndicator');
        if (sidebarTempIndicator) {
            sidebarTempIndicator.remove();
        }

        // Reset session name color
        this.currentSessionName.style.color = '';

        // Reset sidebar session name color
        if (this.sidebarCurrentSessionName) {
            this.sidebarCurrentSessionName.style.color = '';
        }

        // Switch to new session
        this.currentSessionId = sessionId;
        localStorage.setItem(this.CURRENT_SESSION_KEY, sessionId);

        // Load new session data
        this.loadCurrentSessionData();

        // Update UI
        this.updateSessionUI();
        this.closeSessionDropdown();

        // Show mobile chat actions if on mobile and sidebar is open
        if (this.isMobileView() && this.isSidebarOpen) {
            this.showMobileChatActions(sessionId);
        }
    }

    // Session Management Methods
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateSessionName(sessionId) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
        return `Chat ${dateStr} ${timeStr}`;
    }

    loadSessions() {
        try {
            const savedSessions = localStorage.getItem(this.SESSIONS_KEY);
            this.sessions = savedSessions ? JSON.parse(savedSessions) : {};
        } catch (error) {
            console.error('Failed to load sessions:', error);
            this.sessions = {};
        }
    }

    saveSessions() {
        try {
            localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(this.sessions));
        } catch (error) {
            console.error('Failed to save sessions:', error);
            this.handleStorageError(error);
        }
    }

    migrateLegacyData() {
        try {
            const legacyData = localStorage.getItem(this.STORAGE_KEY);
            if (legacyData && Object.keys(this.sessions).length === 0) {
                const sessionId = this.generateSessionId();
                const parsedData = JSON.parse(legacyData);

                this.sessions[sessionId] = {
                    id: sessionId,
                    name: 'Main Chat',
                    messages: parsedData.messages || [],
                    conversationHistory: parsedData.conversationHistory || [],
                    timestamp: parsedData.timestamp || Date.now(),
                    created: Date.now()
                };

                this.saveSessions();
                localStorage.removeItem(this.STORAGE_KEY); // Clean up legacy data
                console.log('Migrated legacy chat data to new session system');
            }
        } catch (error) {
            console.error('Failed to migrate legacy data:', error);
        }
    }

    setCurrentSession() {
        try {
            const savedCurrentId = localStorage.getItem(this.CURRENT_SESSION_KEY);

            // Check if saved session still exists
            if (savedCurrentId && this.sessions[savedCurrentId]) {
                this.currentSessionId = savedCurrentId;
            } else {
                // Create new session if none exists or saved session is missing
                if (Object.keys(this.sessions).length === 0) {
                    this.createNewSession(false); // Don't switch UI yet
                } else {
                    // Use the first available session
                    this.currentSessionId = Object.keys(this.sessions)[0];
                }
            }

            // Save current session ID
            if (this.currentSessionId) {
                localStorage.setItem(this.CURRENT_SESSION_KEY, this.currentSessionId);
            }
        } catch (error) {
            console.error('Failed to set current session:', error);
            this.createNewSession(false);
        }
    }

    createNewSession(switchToNew = true) {
        const sessionId = this.generateSessionId();
        const sessionName = this.generateSessionName(sessionId);

        // Save current session before creating new one (only if not temporary)
        if (this.currentSessionId && switchToNew && !this.isTemporarySession) {
            this.saveCurrentSession();
        }

        // Reset temporary session flag
        this.isTemporarySession = false;

        // Remove temporary indicator
        const tempIndicator = document.getElementById('tempIndicator');
        if (tempIndicator) {
            tempIndicator.remove();
        }

        // Reset session name color
        this.currentSessionName.style.color = '';

        // Create new session
        this.sessions[sessionId] = {
            id: sessionId,
            name: sessionName,
            messages: [],
            conversationHistory: [],
            timestamp: Date.now(),
            created: Date.now()
        };

        this.saveSessions();

        if (switchToNew) {
            // Switch to new session
            this.switchToSession(sessionId);
        } else {
            // Just set as current without UI update
            this.currentSessionId = sessionId;
            localStorage.setItem(this.CURRENT_SESSION_KEY, sessionId);
        }

        return sessionId;
    }

    switchToSession(sessionId) {
        if (!this.sessions[sessionId]) {
            console.error('Session not found:', sessionId);
            return;
        }

        // Save current session before switching
        if (this.currentSessionId && this.currentSessionId !== sessionId) {
            this.saveCurrentSession();
        }

        // Switch to new session
        this.currentSessionId = sessionId;
        localStorage.setItem(this.CURRENT_SESSION_KEY, sessionId);

        // Load new session data
        this.loadCurrentSessionData();

        // Update UI
        this.updateSessionUI();
        this.closeSessionDropdown();
    }

    deleteSession(sessionId) {
        if (!this.sessions[sessionId]) return;

        const sessionName = this.sessions[sessionId].name;
        if (!confirm(`Are you sure you want to delete "${sessionName}"? This action cannot be undone.`)) {
            return;
        }

        delete this.sessions[sessionId];
        this.saveSessions();

        // If we deleted the current session, switch to another or create new
        if (this.currentSessionId === sessionId) {
            const remainingSessions = Object.keys(this.sessions);
            if (remainingSessions.length > 0) {
                this.switchToSession(remainingSessions[0]);
            } else {
                this.createNewSession();
            }
        } else {
            this.updateSessionUI();
        }
    }

    renameSession(sessionId, newName) {
        if (!this.sessions[sessionId] || !newName.trim()) return;

        this.sessions[sessionId].name = newName.trim();
        this.sessions[sessionId].timestamp = Date.now();
        this.saveSessions();
        this.updateSessionUI();
    }

    // Session UI Management
    updateSessionUI() {
        if (!this.currentSessionId || !this.sessions[this.currentSessionId]) return;

        const currentSession = this.sessions[this.currentSessionId];
        this.currentSessionName.textContent = currentSession.name;

        // Update session count
        const sessionCount = Object.keys(this.sessions).length;
        this.sessionCount.textContent = `${sessionCount} session${sessionCount !== 1 ? 's' : ''}`;

        // Update session list
        this.updateSessionList();

        // Update sidebar UI if it exists
        if (this.sidebarCurrentSessionName) {
            this.updateSidebarSessionUI();
        }

        // Update mobile chat actions if visible
        if (this.mobileChatActions && this.mobileChatActions.style.display !== 'none' && this.currentSessionId) {
            this.showMobileChatActions(this.currentSessionId);
        }
    }

    updateSessionList() {
        this.sessionList.innerHTML = '';

        const sortedSessions = Object.values(this.sessions).sort((a, b) => b.timestamp - a.timestamp);

        sortedSessions.forEach(session => {
            const sessionItem = document.createElement('div');
            sessionItem.className = `session-item ${session.id === this.currentSessionId ? 'active' : ''}`;

            const preview = this.getSessionPreview(session);

            sessionItem.innerHTML = `
                <div class="session-info">
                    <div class="session-title">${session.name}</div>
                    <div class="session-preview">${preview}</div>
                </div>
                <div class="session-actions">
                    <button class="session-action-btn rename-btn" onclick="gabrielaAI.promptRenameSession('${session.id}')">✏️</button>
                    ${Object.keys(this.sessions).length > 1 ? `<button class="session-action-btn delete-btn" onclick="gabrielaAI.deleteSession('${session.id}')">🗑️</button>` : ''}
                </div>
            `;

            // Add click handler for session switching
            sessionItem.addEventListener('click', (e) => {
                if (!e.target.classList.contains('session-action-btn')) {
                    this.switchToSession(session.id);
                }
            });

            this.sessionList.appendChild(sessionItem);
        });
    }

    getSessionPreview(session) {
        if (!session.messages || session.messages.length === 0) {
            return 'No messages yet';
        }

        const lastMessage = session.messages[session.messages.length - 1];
        const preview = lastMessage.content.substring(0, 50);
        return preview + (lastMessage.content.length > 50 ? '...' : '');
    }

    toggleSessionDropdown() {
        this.sessionDropdown.classList.toggle('open');
        if (this.sessionDropdown.classList.contains('open')) {
            this.updateSessionList();
        }
    }

    closeSessionDropdown() {
        this.sessionDropdown.classList.remove('open');
    }

    promptRenameSession(sessionId) {
        const session = this.sessions[sessionId];
        if (!session) return;

        const newName = prompt('Enter new name for this chat:', session.name);
        if (newName && newName.trim() !== session.name) {
            this.renameSession(sessionId, newName);
        }
    }

    // Modified Chat Persistence Methods for Multi-Session
    saveCurrentSession() {
        // Skip saving for temporary sessions
        if (this.isTemporarySession) return;

        if (!this.currentSessionId || !this.sessions[this.currentSessionId]) return;

        try {
            // Update current session data
            this.sessions[this.currentSessionId].messages = this.getDisplayMessages();
            this.sessions[this.currentSessionId].conversationHistory = this.conversationHistory;
            this.sessions[this.currentSessionId].timestamp = Date.now();

            // Clean old messages before saving
            this.cleanOldSessionMessages(this.sessions[this.currentSessionId]);

            // Save all sessions
            this.saveSessions();

        } catch (error) {
            console.error('Failed to save current session:', error);
            this.handleStorageError(error);
        }
    }

    loadCurrentSessionData() {
        if (!this.currentSessionId || !this.sessions[this.currentSessionId]) {

            return;
        }

        try {
            const sessionData = this.sessions[this.currentSessionId];

            // Check if data is too old
            const daysSinceLastSave = (Date.now() - sessionData.timestamp) / (1000 * 60 * 60 * 24);
            if (daysSinceLastSave > this.MAX_AGE_DAYS) {
                console.log('Session data too old, starting fresh');
                this.clearCurrentSessionData();
                return;
            }

            // Clear current display
            this.clearDisplayedMessages();
            this.clearWelcomeMessage();

            // Restore conversation history
            this.conversationHistory = sessionData.conversationHistory || [];

            // Restore displayed messages
            if (sessionData.messages && sessionData.messages.length > 0) {
                sessionData.messages.forEach(msg => {
                    this.addMessageFromHistory(msg.content, msg.type, msg.timestamp);
                });
            } else {
                this.showWelcomeMessage();
            }

        } catch (error) {
            console.error('Failed to load session data:', error);
            this.clearCurrentSessionData();
        }
    }

    debouncedAutoSave() {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            this.saveCurrentSession();
        }, 1000); // Save 1 second after user stops typing
    }



    clearCurrentSessionHistory() {
        if (!this.currentSessionId || !this.sessions[this.currentSessionId]) return;

        const sessionName = this.sessions[this.currentSessionId].name;
        if (confirm(`Are you sure you want to clear the history for "${sessionName}"? This action cannot be undone.`)) {
            this.clearCurrentSessionData();
            this.clearDisplayedMessages();
            this.conversationHistory = [];
            this.showWelcomeMessage();
            this.saveCurrentSession();

        }
    }
    
    // Helper methods for chat persistence
    getDisplayMessages() {
        const messages = [];
        const messageElements = this.messagesContainer.querySelectorAll('.message');

        messageElements.forEach(element => {
            const isUser = element.classList.contains('user');
            const content = element.querySelector('.message-content').textContent;
            const timestamp = element.dataset.timestamp || Date.now();

            messages.push({
                content: content,
                type: isUser ? 'user' : 'bot',
                timestamp: parseInt(timestamp)
            });
        });

        return messages;
    }

    addMessageFromHistory(content, type, timestamp) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.dataset.timestamp = timestamp;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = type === 'user' ? 'G' : '🤖';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = content;

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        this.messagesContainer.appendChild(messageDiv);
    }

    cleanOldSessionMessages(sessionData) {
        // Remove messages older than MAX_AGE_DAYS
        const cutoffTime = Date.now() - (this.MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
        if (sessionData.messages) {
            sessionData.messages = sessionData.messages.filter(msg => msg.timestamp > cutoffTime);
        }

        // Limit to MAX_MESSAGES
        if (sessionData.messages && sessionData.messages.length > this.MAX_MESSAGES) {
            sessionData.messages = sessionData.messages.slice(-this.MAX_MESSAGES);
        }

        // Also clean conversation history
        if (sessionData.conversationHistory && sessionData.conversationHistory.length > this.MAX_MESSAGES) {
            sessionData.conversationHistory = sessionData.conversationHistory.slice(-this.MAX_MESSAGES);
        }
    }

    clearCurrentSessionData() {
        if (!this.currentSessionId || !this.sessions[this.currentSessionId]) return;

        this.sessions[this.currentSessionId].messages = [];
        this.sessions[this.currentSessionId].conversationHistory = [];
        this.sessions[this.currentSessionId].timestamp = Date.now();
        this.saveSessions();
    }

    clearDisplayedMessages() {
        const messages = this.messagesContainer.querySelectorAll('.message');
        messages.forEach(msg => msg.remove());
    }

    clearWelcomeMessage() {
        const welcomeMsg = this.messagesContainer.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }
    }

    showWelcomeMessage(isTemporary = false) {
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'welcome-message';

        const welcomeText = isTemporary
            ? "⚡ Temporary Chat Started! This conversation won't be saved to your history."
            : "Hello Gabriela! 👋 I'm your AI-powered assistant. I can help with questions, creative tasks, analysis, and much more!";

        welcomeDiv.innerHTML = `
            <p>${welcomeText}</p>
            <div class="suggestions">
                <div class="suggestion" onclick="sendSuggestion('Explain quantum physics simply')">Explain quantum physics</div>
                <div class="suggestion" onclick="sendSuggestion('Write a creative story')">Write a story</div>
                <div class="suggestion" onclick="sendSuggestion('Help me solve a problem')">Problem solving</div>
                <div class="suggestion" onclick="sendSuggestion('Analyze this text')">Text analysis</div>
            </div>
        `;
        this.messagesContainer.insertBefore(welcomeDiv, this.typingIndicator);
    }



    handleStorageError(error) {
        if (error.name === 'QuotaExceededError') {
            // Storage quota exceeded - try to free up space by removing old messages
            setTimeout(() => {
                this.cleanupOldStorage();
            }, 1000);
        }
        console.error('Storage error:', error);
    }

    cleanupOldStorage() {
        try {
            // Clean up all sessions
            Object.keys(this.sessions).forEach(sessionId => {
                const session = this.sessions[sessionId];
                // Keep only the last 50 messages per session
                if (session.messages && session.messages.length > 50) {
                    session.messages = session.messages.slice(-50);
                }
                if (session.conversationHistory && session.conversationHistory.length > 50) {
                    session.conversationHistory = session.conversationHistory.slice(-50);
                }
            });

            this.saveSessions();

        } catch (error) {
            console.error('Failed to cleanup storage:', error);
        }
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.sendButton.disabled = true;

        this.conversationHistory.push({
            role: 'user',
            content: message
        });

        // Auto-save after user message
        if (this.autoSaveEnabled) {
            this.debouncedAutoSave();
        }

        this.showTypingIndicator();

        try {
            const response = await this.callOpenRouter();

            this.hideTypingIndicator();
            this.addMessage(response, 'bot');

            this.conversationHistory.push({
                role: 'assistant',
                content: response
            });

            // Auto-save after bot response
            if (this.autoSaveEnabled) {
                this.debouncedAutoSave();
            }

        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage(`Sorry Gabriela, I encountered an error: ${error.message}`, 'bot');
        } finally {
            this.sendButton.disabled = false;
        }
    }
    
    async callOpenRouter() {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${this.apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini', // примерен модел OpenRouter
                messages: [
                    {
                        role: 'system',
                        content: "Ти си персонализиран асистент на Габриела Стефанова - ученичка в СУ 'Йордан Йовков', Сливен. Тя ще бъде 11 клас. Има интерес към WebDevelopment-a. На 17 години е."
                    },
                    ...this.conversationHistory.slice(-10)
                ],
                max_tokens: 500,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`OpenRouter API error: ${response.status} ${errorData.error?.message || ''}`);
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    }
    
    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.dataset.timestamp = Date.now(); // Add timestamp for persistence

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = type === 'user' ? 'G' : '🤖';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        // Add typewriter effect for bot messages
        if (type === 'bot') {
            this.typewriterEffect(messageContent, content);
        } else {
            messageContent.textContent = content;
        }

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);

        // Add entrance animation
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(20px)';

        this.messagesContainer.appendChild(messageDiv);

        // Trigger entrance animation
        requestAnimationFrame(() => {
            messageDiv.style.transition = 'all 0.5s ease';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        });

        this.scrollToBottom();
    }

    typewriterEffect(element, text) {
        let i = 0;
        element.textContent = '';

        const typeInterval = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                this.scrollToBottom();
            } else {
                clearInterval(typeInterval);
            }
        }, 30);
    }
    
    showTypingIndicator() {
        this.typingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        this.typingIndicator.style.display = 'none';
    }
    
    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    // Focus management for accessibility
    setupFocusTrap() {
        if (!this.isSidebarOpen) return;

        const focusableElements = this.chatHistorySidebar.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Focus the first element when sidebar opens
        firstElement.focus();

        // Handle tab navigation
        this.chatHistorySidebar.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    // Shift + Tab
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    // Tab
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        });
    }
}

// Инициализиране на бота
const gabrielaAI = new GabrielaAI();

function sendSuggestion(suggestion) {
    const messageInput = document.getElementById('messageInput');
    messageInput.value = suggestion;
    gabrielaAI.sendMessage();

}
