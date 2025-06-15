/**
 * Simple RTC Client for Volcano Engine RTC SDK
 * Handles basic video calling functionality
 */
class SimpleRTCClient {
    constructor(config) {
        this.config = config;
        this.engine = null;
        this.localStream = null;
        this.remoteStreams = new Map();
        this.currentRoomId = null;
        this.currentUserId = null;
        this.isJoined = false;
        this.devices = {
            cameras: [],
            microphones: [],
            speakers: []
        };
        
        // Event callbacks
        this.callbacks = {
            onUserJoined: null,
            onUserLeft: null,
            onStreamAdd: null,
            onStreamRemove: null,
            onConnectionStateChanged: null,
            onError: null
        };
        
        this.log('SimpleRTCClient initialized');
    }
    
    /**
     * Initialize RTC Engine
     */
    async init() {
        try {
            this.log('Initializing RTC Engine...');
            
            // Check if RTC SDK is available
            if (typeof RTC === 'undefined') {
                throw new Error('Volcano Engine RTC SDK not loaded');
            }
            
            // Create RTC Engine
            this.engine = RTC.createEngine();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Get available devices
            await this.getDevices();
            
            this.log('RTC Engine initialized successfully');
            return true;
            
        } catch (error) {
            this.logError('Failed to initialize RTC Engine:', error);
            this.notifyError('INIT_FAILED', error.message);
            return false;
        }
    }
    
    /**
     * Setup event listeners for RTC engine
     */
    setupEventListeners() {
        if (!this.engine) return;
        
        // User events
        this.engine.on('user-joined', (event) => {
            this.log('User joined:', event.user);
            if (this.callbacks.onUserJoined) {
                this.callbacks.onUserJoined(event.user);
            }
        });
        
        this.engine.on('user-left', (event) => {
            this.log('User left:', event.user);
            this.remoteStreams.delete(event.user.userId);
            if (this.callbacks.onUserLeft) {
                this.callbacks.onUserLeft(event.user);
            }
        });
        
        // Stream events
        this.engine.on('stream-add', (event) => {
            this.log('Stream added:', event.stream);
            this.handleRemoteStream(event.stream);
        });
        
        this.engine.on('stream-remove', (event) => {
            this.log('Stream removed:', event.stream);
            this.remoteStreams.delete(event.stream.userId);
            if (this.callbacks.onStreamRemove) {
                this.callbacks.onStreamRemove(event.stream);
            }
        });
        
        // Connection events
        this.engine.on('connection-state-changed', (event) => {
            this.log('Connection state changed:', event.state);
            if (this.callbacks.onConnectionStateChanged) {
                this.callbacks.onConnectionStateChanged(event.state);
            }
        });
        
        // Error events
        this.engine.on('error', (error) => {
            this.logError('RTC Engine error:', error);
            this.notifyError('ENGINE_ERROR', error.message);
        });
        
        this.log('Event listeners setup complete');
    }
    
    /**
     * Get available media devices
     */
    async getDevices() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                throw new Error('Media devices not supported');
            }
            
            const devices = await navigator.mediaDevices.enumerateDevices();
            
            this.devices.cameras = devices.filter(device => device.kind === 'videoinput');
            this.devices.microphones = devices.filter(device => device.kind === 'audioinput');
            this.devices.speakers = devices.filter(device => device.kind === 'audiooutput');
            
            this.log('Devices found:', this.devices);
            
        } catch (error) {
            this.logError('Failed to get devices:', error);
        }
    }
    
    /**
     * Join room with authentication
     */
    async joinRoom(roomId, userId, token = null) {
        try {
            this.log(`Joining room: ${roomId} as ${userId}`);
            
            if (!this.engine) {
                throw new Error('RTC Engine not initialized');
            }
            
            // Generate token if not provided (for demo purposes)
            if (!token) {
                token = await this.generateToken(roomId, userId);
            }
            
            // Join room
            const result = await this.engine.joinRoom({
                roomId,
                userId,
                token,
                // Additional options
                isAutoPublish: true,
                isAutoSubscribe: true
            });
            
            this.currentRoomId = roomId;
            this.currentUserId = userId;
            this.isJoined = true;
            
            // Start local stream
            await this.startLocalStream();
            
            this.log('Successfully joined room');
            return result;
            
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
            
            if (!this.isJoined || !this.engine) {
                return;
            }
            
            // Stop local stream
            await this.stopLocalStream();
            
            // Leave room
            await this.engine.leaveRoom();
            
            this.isJoined = false;
            this.currentRoomId = null;
            this.currentUserId = null;
            this.remoteStreams.clear();
            
            this.log('Successfully left room');
            
        } catch (error) {
            this.logError('Failed to leave room:', error);
            this.notifyError('LEAVE_FAILED', error.message);
        }
    }
    
    /**
     * Start local video/audio stream
     */
    async startLocalStream() {
        try {
            this.log('Starting local stream...');
            
            // Get user media
            const stream = await navigator.mediaDevices.getUserMedia({
                video: this.config.RTC.video,
                audio: this.config.RTC.audio
            });
            
            this.localStream = stream;
            
            // Publish stream to room
            if (this.engine && this.isJoined) {
                await this.engine.publish(stream);
            }
            
            this.log('Local stream started');
            return stream;
            
        } catch (error) {
            this.logError('Failed to start local stream:', error);
            this.notifyError('STREAM_FAILED', error.message);
            throw error;
        }
    }
    
    /**
     * Stop local stream
     */
    async stopLocalStream() {
        try {
            if (this.localStream) {
                // Stop all tracks
                this.localStream.getTracks().forEach(track => {
                    track.stop();
                });
                
                // Unpublish from room
                if (this.engine && this.isJoined) {
                    await this.engine.unpublish();
                }
                
                this.localStream = null;
                this.log('Local stream stopped');
            }
        } catch (error) {
            this.logError('Failed to stop local stream:', error);
        }
    }
    
    /**
     * Handle remote stream
     */
    async handleRemoteStream(stream) {
        try {
            this.log('Handling remote stream:', stream.userId);
            
            // Subscribe to remote stream
            const mediaStream = await this.engine.subscribe(stream);
            
            // Store remote stream
            this.remoteStreams.set(stream.userId, {
                stream: mediaStream,
                info: stream
            });
            
            // Notify UI
            if (this.callbacks.onStreamAdd) {
                this.callbacks.onStreamAdd(stream.userId, mediaStream);
            }
            
        } catch (error) {
            this.logError('Failed to handle remote stream:', error);
        }
    }
    
    /**
     * Toggle microphone mute
     */
    async toggleMicrophone() {
        try {
            if (!this.localStream) return false;
            
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                this.log('Microphone toggled:', audioTrack.enabled ? 'on' : 'off');
                return audioTrack.enabled;
            }
            
            return false;
            
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
            if (!this.localStream) return false;
            
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                this.log('Camera toggled:', videoTrack.enabled ? 'on' : 'off');
                return videoTrack.enabled;
            }
            
            return false;
            
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
            
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });
            
            // Replace video track
            if (this.localStream && this.engine) {
                const videoTrack = screenStream.getVideoTracks()[0];
                await this.engine.replaceTrack(videoTrack);
                
                // Handle screen share end
                videoTrack.onended = () => {
                    this.stopScreenShare();
                };
            }
            
            this.log('Screen share started');
            return true;
            
        } catch (error) {
            this.logError('Failed to start screen share:', error);
            return false;
        }
    }
    
    /**
     * Stop screen sharing
     */
    async stopScreenShare() {
        try {
            this.log('Stopping screen share...');
            
            // Restart camera
            const videoStream = await navigator.mediaDevices.getUserMedia({
                video: this.config.RTC.video
            });
            
            if (this.localStream && this.engine) {
                const videoTrack = videoStream.getVideoTracks()[0];
                await this.engine.replaceTrack(videoTrack);
            }
            
            this.log('Screen share stopped');
            
        } catch (error) {
            this.logError('Failed to stop screen share:', error);
        }
    }
    
    /**
     * Generate demo token (replace with real token service)
     */
    async generateToken(roomId, userId) {
        // In a real application, this should call your token server
        // For demo purposes, we'll return a mock token
        const mockToken = `mock_token_${roomId}_${userId}_${Date.now()}`;
        this.log('Generated mock token:', mockToken);
        return mockToken;
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
            participantCount: this.remoteStreams.size + (this.isJoined ? 1 : 0)
        };
    }
    
    /**
     * Cleanup resources
     */
    destroy() {
        this.log('Destroying RTC client...');
        
        if (this.isJoined) {
            this.leaveRoom();
        }
        
        if (this.engine) {
            this.engine.destroy();
            this.engine = null;
        }
        
        this.callbacks = {};
        this.remoteStreams.clear();
    }
    
    /**
     * Logging utilities
     */
    log(...args) {
        if (this.config.DEV.enableDebugLog) {
            console.log('[RTC Client]', ...args);
        }
    }
    
    logError(...args) {
        console.error('[RTC Client Error]', ...args);
    }
    
    notifyError(type, message) {
        if (this.callbacks.onError) {
            this.callbacks.onError({ type, message });
        }
    }
}