/**
 * Simple RTC Client for Jitsi Meet
 * Handles basic video calling functionality using Jitsi Meet External API
 */
class SimpleRTCClient {
    constructor(config) {
        this.config = config;
        this.api = null;
        this.currentRoomId = null;
        this.currentUserId = null;
        this.isJoined = false;
        this.participantCount = 0;
        this.jitsiContainer = null;
        
        // Event callbacks
        this.callbacks = {
            onUserJoined: null,
            onUserLeft: null,
            onStreamAdd: null,
            onStreamRemove: null,
            onConnectionStateChanged: null,
            onError: null
        };
        
        this.log('SimpleRTCClient (Jitsi) initialized');
    }
    
    /**
     * Initialize Jitsi Meet API
     */
    async init() {
        try {
            this.log('Initializing Jitsi Meet...');
            
            // Check if Jitsi External API is available
            if (typeof JitsiMeetExternalAPI === 'undefined') {
                throw new Error('Jitsi Meet External API not loaded');
            }
            
            // Create container for Jitsi Meet
            this.createJitsiContainer();
            
            this.log('Jitsi Meet initialized successfully');
            return true;
            
        } catch (error) {
            this.logError('Failed to initialize Jitsi Meet:', error);
            this.notifyError('INIT_FAILED', error.message);
            return false;
        }
    }
    
    /**
     * Create container element for Jitsi Meet
     */
    createJitsiContainer() {
        // Remove existing container if any
        const existing = document.getElementById('jitsi-container');
        if (existing) {
            existing.remove();
        }
        
        // Create new container
        this.jitsiContainer = document.createElement('div');
        this.jitsiContainer.id = 'jitsi-container';
        this.jitsiContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1000;
            background: #000;
            display: none;
        `;
        
        document.body.appendChild(this.jitsiContainer);
    }
    
    /**
     * Setup event listeners for Jitsi API
     */
    setupEventListeners() {
        if (!this.api) return;
        
        // Participant events
        this.api.addEventListeners({
            participantJoined: (participant) => {
                this.log('Participant joined:', participant);
                this.participantCount++;
                if (this.callbacks.onUserJoined) {
                    this.callbacks.onUserJoined({
                        userId: participant.id,
                        displayName: participant.displayName
                    });
                }
            },
            
            participantLeft: (participant) => {
                this.log('Participant left:', participant);
                this.participantCount--;
                if (this.callbacks.onUserLeft) {
                    this.callbacks.onUserLeft({
                        userId: participant.id,
                        displayName: participant.displayName
                    });
                }
            },
            
            videoConferenceJoined: (participant) => {
                this.log('Conference joined:', participant);
                this.isJoined = true;
                this.currentUserId = participant.id;
                if (this.callbacks.onConnectionStateChanged) {
                    this.callbacks.onConnectionStateChanged('connected');
                }
            },
            
            videoConferenceLeft: () => {
                this.log('Conference left');
                this.isJoined = false;
                this.participantCount = 0;
                if (this.callbacks.onConnectionStateChanged) {
                    this.callbacks.onConnectionStateChanged('disconnected');
                }
            },
            
            readyToClose: () => {
                this.log('Ready to close');
                this.cleanup();
            },
            
            // Error handling
            error: (error) => {
                this.logError('Jitsi error:', error);
                this.notifyError('JITSI_ERROR', error.message || 'Unknown error');
            }
        });
        
        this.log('Event listeners setup complete');
    }
    
    /**
     * Join room with Jitsi Meet
     */
    async joinRoom(roomId, userId, token = null) {
        try {
            this.log(`Joining room: ${roomId} as ${userId}`);
            
            if (this.api) {
                // Clean up existing session
                await this.leaveRoom();
            }
            
            // Prepare Jitsi options
            const options = {
                ...this.config.RTC.options,
                roomName: roomId,
                parentNode: this.jitsiContainer,
                userInfo: {
                    displayName: userId
                }
            };
            
            // Create Jitsi Meet API instance
            this.api = new JitsiMeetExternalAPI(this.config.RTC.domain, options);
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Show Jitsi container
            this.jitsiContainer.style.display = 'block';
            
            // Hide our custom UI elements
            this.hideCustomUI();
            
            this.currentRoomId = roomId;
            this.currentUserId = userId;
            
            this.log('Successfully joined room with Jitsi');
            return true;
            
        } catch (error) {
            this.logError('Failed to join room:', error);
            this.notifyError('JOIN_FAILED', error.message);
            throw error;
        }
    }
    
    /**
     * Leave current room
     */
    async leaveRoom() {
        try {
            this.log('Leaving room...');
            
            if (this.api) {
                this.api.dispose();
                this.api = null;
            }
            
            // Hide Jitsi container
            if (this.jitsiContainer) {
                this.jitsiContainer.style.display = 'none';
            }
            
            // Show our custom UI elements
            this.showCustomUI();
            
            this.isJoined = false;
            this.currentRoomId = null;
            this.currentUserId = null;
            this.participantCount = 0;
            
            this.log('Successfully left room');
            
        } catch (error) {
            this.logError('Failed to leave room:', error);
            this.notifyError('LEAVE_FAILED', error.message);
        }
    }
    
    /**
     * Toggle microphone mute
     */
    async toggleMicrophone() {
        try {
            if (!this.api) return false;
            
            const isMuted = await this.api.isAudioMuted();
            if (isMuted) {
                await this.api.executeCommand('toggleAudio');
            } else {
                await this.api.executeCommand('toggleAudio');
            }
            
            this.log('Microphone toggled:', !isMuted ? 'off' : 'on');
            return !isMuted;
            
        } catch (error) {
            this.logError('Failed to toggle microphone:', error);
            return false;
        }
    }
    
    /**
     * Toggle camera
     */
    async toggleCamera() {
        try {
            if (!this.api) return false;
            
            const isMuted = await this.api.isVideoMuted();
            if (isMuted) {
                await this.api.executeCommand('toggleVideo');
            } else {
                await this.api.executeCommand('toggleVideo');
            }
            
            this.log('Camera toggled:', !isMuted ? 'off' : 'on');
            return !isMuted;
            
        } catch (error) {
            this.logError('Failed to toggle camera:', error);
            return false;
        }
    }
    
    /**
     * Start screen sharing
     */
    async startScreenShare() {
        try {
            this.log('Starting screen share...');
            
            if (!this.api) return false;
            
            await this.api.executeCommand('toggleShareScreen');
            
            this.log('Screen share toggled');
            return true;
            
        } catch (error) {
            this.logError('Failed to toggle screen share:', error);
            return false;
        }
    }
    
    /**
     * Stop screen sharing (same as start for Jitsi - it toggles)
     */
    async stopScreenShare() {
        return await this.startScreenShare();
    }
    
    /**
     * Hide custom UI elements when Jitsi is active
     */
    hideCustomUI() {
        const elements = [
            '.video-container',
            '.controls',
            '.participants-panel'
        ];
        
        elements.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.style.display = 'none';
            }
        });
    }
    
    /**
     * Show custom UI elements when Jitsi is not active
     */
    showCustomUI() {
        const elements = [
            '.video-container',
            '.controls',
            '.participants-panel'
        ];
        
        elements.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.style.display = '';
            }
        });
    }
    
    /**
     * Get available media devices (fallback implementation)
     */
    async getDevices() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                throw new Error('Media devices not supported');
            }
            
            const devices = await navigator.mediaDevices.enumerateDevices();
            
            this.devices = {
                cameras: devices.filter(device => device.kind === 'videoinput'),
                microphones: devices.filter(device => device.kind === 'audioinput'),
                speakers: devices.filter(device => device.kind === 'audiooutput')
            };
            
            this.log('Devices found:', this.devices);
            
        } catch (error) {
            this.logError('Failed to get devices:', error);
        }
    }
    
    /**
     * Set event callback
     */
    on(event, callback) {
        if (this.callbacks.hasOwnProperty(`on${event.charAt(0).toUpperCase()}${event.slice(1)}`)) {
            this.callbacks[`on${event.charAt(0).toUpperCase()}${event.slice(1)}`] = callback;
        }
    }
    
    /**
     * Get current room info
     */
    getRoomInfo() {
        return {
            roomId: this.currentRoomId,
            userId: this.currentUserId,
            isJoined: this.isJoined,
            participantCount: this.participantCount
        };
    }
    
    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.jitsiContainer) {
            this.jitsiContainer.style.display = 'none';
        }
        this.showCustomUI();
    }
    
    /**
     * Cleanup resources
     */
    destroy() {
        this.log('Destroying Jitsi client...');
        
        if (this.isJoined) {
            this.leaveRoom();
        }
        
        if (this.api) {
            this.api.dispose();
            this.api = null;
        }
        
        if (this.jitsiContainer) {
            this.jitsiContainer.remove();
            this.jitsiContainer = null;
        }
        
        this.callbacks = {};
    }
    
    /**
     * Logging utilities
     */
    log(...args) {
        if (this.config.DEV.enableDebugLog) {
            console.log('[Jitsi Client]', ...args);
        }
    }
    
    logError(...args) {
        console.error('[Jitsi Client Error]', ...args);
    }
    
    notifyError(type, message) {
        if (this.callbacks.onError) {
            this.callbacks.onError({ type, message });
        }
    }
}