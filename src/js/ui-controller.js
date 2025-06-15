/**
 * UI Controller for RTC Agent Test Demo
 * Handles all UI interactions and state management
 */
class UIController {
    constructor(rtcClient) {
        this.rtcClient = rtcClient;
        this.elements = {};
        this.state = {
            isJoined: false,
            isMicOn: true,
            isCameraOn: true,
            isScreenSharing: false,
            participants: new Map()
        };
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupRTCCallbacks();
        
        this.log('UIController initialized');
    }
    
    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.elements = {
            // Main containers
            joinForm: document.getElementById('joinForm'),
            videoContainer: document.querySelector('.video-container'),
            
            // Videos
            localVideo: document.getElementById('localVideo'),
            remoteVideos: document.getElementById('remoteVideos'),
            
            // Form elements
            roomInput: document.getElementById('roomInput'),
            userInput: document.getElementById('userInput'),
            joinBtn: document.getElementById('joinBtn'),
            
            // Control buttons
            micBtn: document.getElementById('micBtn'),
            cameraBtn: document.getElementById('cameraBtn'),
            screenBtn: document.getElementById('screenBtn'),
            hangupBtn: document.getElementById('hangupBtn'),
            
            // Status displays
            connectionStatus: document.getElementById('connectionStatus'),
            roomId: document.getElementById('roomId'),
            shareRoomId: document.getElementById('shareRoomId'),
            participantCount: document.getElementById('participantCount'),
            participantsList: document.getElementById('participantsList')
        };
        
        // Validate all elements exist
        for (const [key, element] of Object.entries(this.elements)) {
            if (!element) {
                console.warn(`Element not found: ${key}`);
            }
        }
    }
    
    /**
     * Setup DOM event listeners
     */
    setupEventListeners() {
        // Join form
        if (this.elements.joinBtn) {
            this.elements.joinBtn.addEventListener('click', () => this.handleJoinRoom());
        }
        
        if (this.elements.roomInput) {
            this.elements.roomInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleJoinRoom();
            });
        }
        
        if (this.elements.userInput) {
            this.elements.userInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleJoinRoom();
            });
        }
        
        // Control buttons
        if (this.elements.micBtn) {
            this.elements.micBtn.addEventListener('click', () => this.handleToggleMic());
        }
        
        if (this.elements.cameraBtn) {
            this.elements.cameraBtn.addEventListener('click', () => this.handleToggleCamera());
        }
        
        if (this.elements.screenBtn) {
            this.elements.screenBtn.addEventListener('click', () => this.handleToggleScreenShare());
        }
        
        if (this.elements.hangupBtn) {
            this.elements.hangupBtn.addEventListener('click', () => this.handleLeaveRoom());
        }
        
        // Window events
        window.addEventListener('beforeunload', () => {
            if (this.state.isJoined) {
                this.rtcClient.leaveRoom();
            }
        });
        
        this.log('Event listeners setup complete');
    }
    
    /**
     * Setup RTC client callbacks
     */
    setupRTCCallbacks() {
        this.rtcClient.on('userJoined', (user) => {
            this.handleUserJoined(user);
        });
        
        this.rtcClient.on('userLeft', (user) => {
            this.handleUserLeft(user);
        });
        
        this.rtcClient.on('streamAdd', (userId, stream) => {
            this.handleStreamAdd(userId, stream);
        });
        
        this.rtcClient.on('streamRemove', (stream) => {
            this.handleStreamRemove(stream);
        });
        
        this.rtcClient.on('connectionStateChanged', (state) => {
            this.updateConnectionStatus(state);
        });
        
        this.rtcClient.on('error', (error) => {
            this.handleError(error);
        });
        
        this.log('RTC callbacks setup complete');
    }
    
    /**
     * Handle join room button click
     */
    async handleJoinRoom() {
        try {
            const roomId = this.elements.roomInput?.value?.trim() || 'demo-room';
            const userId = this.elements.userInput?.value?.trim() || this.generateUserId();
            
            if (!roomId || !userId) {
                this.showError('Please enter both room ID and your name');
                return;
            }
            
            this.setLoadingState(true);
            this.updateConnectionStatus('connecting');
            
            // Initialize RTC if not already done
            if (!this.rtcClient.engine) {
                await this.rtcClient.init();
            }
            
            // Join room
            await this.rtcClient.joinRoom(roomId, userId);
            
            // Update UI
            this.state.isJoined = true;
            this.hideJoinForm();
            this.updateRoomInfo(roomId);
            this.updateConnectionStatus('connected');
            
            // Setup local video
            this.setupLocalVideo();
            
            this.log('Successfully joined room:', roomId);
            
        } catch (error) {
            this.logError('Failed to join room:', error);
            this.showError('Failed to join room: ' + error.message);
            this.updateConnectionStatus('disconnected');
        } finally {
            this.setLoadingState(false);
        }
    }
    
    /**
     * Handle leave room
     */
    async handleLeaveRoom() {
        try {
            this.setLoadingState(true);
            
            await this.rtcClient.leaveRoom();
            
            // Update UI
            this.state.isJoined = false;
            this.showJoinForm();
            this.clearVideoStreams();
            this.updateConnectionStatus('disconnected');
            this.updateParticipantsList();
            
            this.log('Successfully left room');
            
        } catch (error) {
            this.logError('Failed to leave room:', error);
            this.showError('Failed to leave room: ' + error.message);
        } finally {
            this.setLoadingState(false);
        }
    }
    
    /**
     * Handle microphone toggle
     */
    async handleToggleMic() {
        try {
            const isOn = await this.rtcClient.toggleMicrophone();
            this.state.isMicOn = isOn;
            this.updateMicButton();
            
        } catch (error) {
            this.logError('Failed to toggle microphone:', error);
            this.showError('Failed to toggle microphone');
        }
    }
    
    /**
     * Handle camera toggle
     */
    async handleToggleCamera() {
        try {
            const isOn = await this.rtcClient.toggleCamera();
            this.state.isCameraOn = isOn;
            this.updateCameraButton();
            
        } catch (error) {
            this.logError('Failed to toggle camera:', error);
            this.showError('Failed to toggle camera');
        }
    }
    
    /**
     * Handle screen share toggle
     */
    async handleToggleScreenShare() {
        try {
            if (this.state.isScreenSharing) {
                await this.rtcClient.stopScreenShare();
                this.state.isScreenSharing = false;
            } else {
                const success = await this.rtcClient.startScreenShare();
                this.state.isScreenSharing = success;
            }
            
            this.updateScreenShareButton();
            
        } catch (error) {
            this.logError('Failed to toggle screen share:', error);
            this.showError('Failed to toggle screen share');
        }
    }
    
    /**
     * Setup local video display
     */
    async setupLocalVideo() {
        try {
            if (this.rtcClient.localStream && this.elements.localVideo) {
                this.elements.localVideo.srcObject = this.rtcClient.localStream;
                this.log('Local video setup complete');
            }
        } catch (error) {
            this.logError('Failed to setup local video:', error);
        }
    }
    
    /**
     * Handle user joined event
     */
    handleUserJoined(user) {
        this.state.participants.set(user.userId, user);
        this.updateParticipantsList();
        this.log('User joined UI update:', user.userId);
    }
    
    /**
     * Handle user left event
     */
    handleUserLeft(user) {
        this.state.participants.delete(user.userId);
        this.removeRemoteVideo(user.userId);
        this.updateParticipantsList();
        this.log('User left UI update:', user.userId);
    }
    
    /**
     * Handle stream add event
     */
    handleStreamAdd(userId, stream) {
        this.addRemoteVideo(userId, stream);
        this.log('Stream add UI update:', userId);
    }
    
    /**
     * Handle stream remove event
     */
    handleStreamRemove(stream) {
        this.removeRemoteVideo(stream.userId);
        this.log('Stream remove UI update:', stream.userId);
    }
    
    /**
     * Add remote video to UI
     */
    addRemoteVideo(userId, stream) {
        try {
            // Remove existing video if any
            this.removeRemoteVideo(userId);
            
            // Create video element
            const videoWrapper = document.createElement('div');
            videoWrapper.className = 'remote-video-item';
            videoWrapper.id = `remote-${userId}`;
            
            const video = document.createElement('video');
            video.autoplay = true;
            video.playsInline = true;
            video.srcObject = stream;
            
            const label = document.createElement('div');
            label.className = 'video-label';
            label.textContent = userId;
            
            videoWrapper.appendChild(video);
            videoWrapper.appendChild(label);
            
            // Add to remote videos container
            if (this.elements.remoteVideos) {
                // Remove placeholder if exists
                const placeholder = this.elements.remoteVideos.querySelector('.remote-video-placeholder');
                if (placeholder) {
                    placeholder.remove();
                }
                
                this.elements.remoteVideos.appendChild(videoWrapper);
                this.updateRemoteVideoLayout();
            }
            
            this.log('Remote video added:', userId);
            
        } catch (error) {
            this.logError('Failed to add remote video:', error);
        }
    }
    
    /**
     * Remove remote video from UI
     */
    removeRemoteVideo(userId) {
        try {
            const videoElement = document.getElementById(`remote-${userId}`);
            if (videoElement) {
                videoElement.remove();
                this.updateRemoteVideoLayout();
                this.log('Remote video removed:', userId);
            }
            
            // Show placeholder if no remote videos
            const remoteVideos = this.elements.remoteVideos?.querySelectorAll('.remote-video-item');
            if (!remoteVideos || remoteVideos.length === 0) {
                this.showRemoteVideoPlaceholder();
            }
            
        } catch (error) {
            this.logError('Failed to remove remote video:', error);
        }
    }
    
    /**
     * Update remote video layout
     */
    updateRemoteVideoLayout() {
        if (!this.elements.remoteVideos) return;
        
        const videos = this.elements.remoteVideos.querySelectorAll('.remote-video-item');
        const count = videos.length;
        
        // Update grid layout based on participant count
        if (count === 1) {
            this.elements.remoteVideos.style.gridTemplateColumns = '1fr';
        } else if (count === 2) {
            this.elements.remoteVideos.style.gridTemplateColumns = '1fr 1fr';
        } else if (count <= 4) {
            this.elements.remoteVideos.style.gridTemplateColumns = '1fr 1fr';
            this.elements.remoteVideos.style.gridTemplateRows = '1fr 1fr';
        }
    }
    
    /**
     * Show remote video placeholder
     */
    showRemoteVideoPlaceholder() {
        if (!this.elements.remoteVideos) return;
        
        const placeholder = document.createElement('div');
        placeholder.className = 'remote-video-placeholder';
        placeholder.innerHTML = `
            <div class="placeholder-content">
                <h3>Waiting for participants...</h3>
                <p>Share room ID: <strong>${this.rtcClient.currentRoomId || 'demo-room'}</strong></p>
            </div>
        `;
        
        this.elements.remoteVideos.appendChild(placeholder);
    }
    
    /**
     * Clear all video streams
     */
    clearVideoStreams() {
        // Clear local video
        if (this.elements.localVideo) {
            this.elements.localVideo.srcObject = null;
        }
        
        // Clear remote videos
        if (this.elements.remoteVideos) {
            this.elements.remoteVideos.innerHTML = '';
            this.showRemoteVideoPlaceholder();
        }
        
        this.state.participants.clear();
    }
    
    /**
     * Update UI button states
     */
    updateMicButton() {
        if (!this.elements.micBtn) return;
        
        this.elements.micBtn.classList.toggle('active', this.state.isMicOn);
        const icon = this.elements.micBtn.querySelector('.icon');
        if (icon) {
            icon.textContent = this.state.isMicOn ? '🎤' : '🔇';
        }
    }
    
    updateCameraButton() {
        if (!this.elements.cameraBtn) return;
        
        this.elements.cameraBtn.classList.toggle('active', this.state.isCameraOn);
        const icon = this.elements.cameraBtn.querySelector('.icon');
        if (icon) {
            icon.textContent = this.state.isCameraOn ? '📹' : '📷';
        }
    }
    
    updateScreenShareButton() {
        if (!this.elements.screenBtn) return;
        
        this.elements.screenBtn.classList.toggle('active', this.state.isScreenSharing);
        const label = this.elements.screenBtn.querySelector('.label');
        if (label) {
            label.textContent = this.state.isScreenSharing ? 'Stop Share' : 'Screen';
        }
    }
    
    /**
     * Update connection status
     */
    updateConnectionStatus(status) {
        if (!this.elements.connectionStatus) return;
        
        this.elements.connectionStatus.className = `connection-status ${status}`;
        
        const statusText = {
            'connected': 'Connected',
            'connecting': 'Connecting...',
            'disconnected': 'Disconnected',
            'reconnecting': 'Reconnecting...',
            'failed': 'Connection Failed'
        };
        
        this.elements.connectionStatus.textContent = statusText[status] || status;
    }
    
    /**
     * Update room information
     */
    updateRoomInfo(roomId) {
        if (this.elements.roomId) {
            this.elements.roomId.textContent = roomId;
        }
        if (this.elements.shareRoomId) {
            this.elements.shareRoomId.textContent = roomId;
        }
    }
    
    /**
     * Update participants list
     */
    updateParticipantsList() {
        if (!this.elements.participantsList || !this.elements.participantCount) return;
        
        const count = this.state.participants.size + (this.state.isJoined ? 1 : 0);
        this.elements.participantCount.textContent = count;
        
        this.elements.participantsList.innerHTML = '';
        
        // Add current user
        if (this.state.isJoined) {
            const item = document.createElement('li');
            item.className = 'participant-item';
            item.textContent = `${this.rtcClient.currentUserId} (You)`;
            this.elements.participantsList.appendChild(item);
        }
        
        // Add other participants
        this.state.participants.forEach((user, userId) => {
            const item = document.createElement('li');
            item.className = 'participant-item';
            item.textContent = userId;
            this.elements.participantsList.appendChild(item);
        });
    }
    
    /**
     * UI utility methods
     */
    showJoinForm() {
        if (this.elements.joinForm) {
            this.elements.joinForm.classList.remove('hidden');
        }
    }
    
    hideJoinForm() {
        if (this.elements.joinForm) {
            this.elements.joinForm.classList.add('hidden');
        }
    }
    
    setLoadingState(loading) {
        if (this.elements.joinBtn) {
            this.elements.joinBtn.disabled = loading;
            this.elements.joinBtn.textContent = loading ? 'Joining...' : 'Join Room';
        }
    }
    
    generateUserId() {
        return CONFIG.DEV.autoGenerateUserId ? 
            ConfigUtils.generateUserId() : 
            `user_${Date.now()}`;
    }
    
    showError(message) {
        // Simple alert for now - could be enhanced with better UI
        alert('Error: ' + message);
    }
    
    handleError(error) {
        this.logError('RTC Error:', error);
        this.showError(error.message);
        this.updateConnectionStatus('failed');
    }
    
    /**
     * Logging utilities
     */
    log(...args) {
        if (CONFIG.DEV.enableDebugLog) {
            console.log('[UI Controller]', ...args);
        }
    }
    
    logError(...args) {
        console.error('[UI Controller Error]', ...args);
    }
}