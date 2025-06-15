/**
 * Main Application Entry Point
 * RTC Agent Test Demo
 */
class RTCAgentApp {
    constructor() {
        this.rtcClient = null;
        this.uiController = null;
        this.isInitialized = false;
        
        this.log('RTC Agent App starting...');
        this.init();
    }
    
    /**
     * Initialize the application
     */
    async init() {
        try {
            // Validate configuration
            const validation = ConfigUtils.validate();
            if (!validation.isValid) {
                this.showConfigurationError(validation.errors);
                return;
            }
            
            // Get configuration
            const config = ConfigUtils.getConfig();
            
            // Initialize RTC Client
            this.rtcClient = new SimpleRTCClient(config);
            
            // Initialize UI Controller
            this.uiController = new UIController(this.rtcClient);
            
            // Setup global error handling
            this.setupGlobalErrorHandling();
            
            // Check for URL parameters (room joining)
            this.handleUrlParameters();
            
            this.isInitialized = true;
            this.log('Application initialized successfully');
            
        } catch (error) {
            this.logError('Failed to initialize application:', error);
            this.showInitializationError(error);
        }
    }
    
    /**
     * Handle URL parameters for direct room joining
     */
    handleUrlParameters() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const roomId = urlParams.get('room');
            const userId = urlParams.get('user');
            
            if (roomId) {
                const roomInput = document.getElementById('roomInput');
                if (roomInput) {
                    roomInput.value = roomId;
                }
                
                this.log('Room ID from URL:', roomId);
            }
            
            if (userId) {
                const userInput = document.getElementById('userInput');
                if (userInput) {
                    userInput.value = userId;
                }
                
                this.log('User ID from URL:', userId);
            }
            
            // Auto-join if both parameters are present
            if (roomId && userId && CONFIG.UI.autoJoin) {
                setTimeout(() => {
                    this.uiController.handleJoinRoom();
                }, 1000);
            }
            
        } catch (error) {
            this.logError('Failed to handle URL parameters:', error);
        }
    }
    
    /**
     * Setup global error handling
     */
    setupGlobalErrorHandling() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.logError('Unhandled promise rejection:', event.reason);
            
            // Check if it's an RTC related error
            if (event.reason && typeof event.reason === 'object') {
                if (event.reason.code || event.reason.type) {
                    this.handleRTCError(event.reason);
                }
            }
        });
        
        // Handle general JavaScript errors
        window.addEventListener('error', (event) => {
            this.logError('JavaScript error:', event.error);
        });
        
        // Handle media device errors
        if (navigator.mediaDevices) {
            navigator.mediaDevices.addEventListener('devicechange', () => {
                this.log('Media devices changed');
                if (this.rtcClient) {
                    this.rtcClient.getDevices();
                }
            });
        }
    }
    
    /**
     * Handle RTC specific errors
     */
    handleRTCError(error) {
        const errorHandlers = {
            'PERMISSION_DENIED': () => {
                this.showUserMessage(
                    'Camera/Microphone Access Denied',
                    'Please allow camera and microphone access to use video calling features.',
                    'warning'
                );
            },
            
            'NETWORK_ERROR': () => {
                this.showUserMessage(
                    'Network Connection Error',
                    'Please check your internet connection and try again.',
                    'error'
                );
            },
            
            'TOKEN_EXPIRED': () => {
                this.showUserMessage(
                    'Session Expired',
                    'Your session has expired. Please rejoin the room.',
                    'warning'
                );
                if (this.uiController) {
                    this.uiController.handleLeaveRoom();
                }
            },
            
            'ROOM_FULL': () => {
                this.showUserMessage(
                    'Room Full',
                    'The room has reached its maximum capacity. Please try again later.',
                    'error'
                );
            }
        };
        
        const handler = errorHandlers[error.type || error.code];
        if (handler) {
            handler();
        } else {
            this.showUserMessage(
                'Connection Error',
                `An error occurred: ${error.message || 'Unknown error'}`,
                'error'
            );
        }
    }
    
    /**
     * Show configuration error
     */
    showConfigurationError(errors) {
        const errorList = errors.map(error => `• ${error}`).join('\n');
        
        const message = `Configuration Error:\n\n${errorList}\n\nPlease check your configuration in config.js`;
        
        this.showUserMessage('Configuration Error', message, 'error');
    }
    
    /**
     * Show initialization error
     */
    showInitializationError(error) {
        const message = `Failed to initialize the application.\n\nError: ${error.message}\n\nPlease refresh the page and try again.`;
        
        this.showUserMessage('Initialization Error', message, 'error');
    }
    
    /**
     * Show user message (enhanced alert)
     */
    showUserMessage(title, message, type = 'info') {
        // For now, use console and alert
        // In a real app, this would be a proper modal/notification
        console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
        
        const icon = {
            'info': 'ℹ️',
            'warning': '⚠️',
            'error': '❌',
            'success': '✅'
        }[type] || 'ℹ️';
        
        alert(`${icon} ${title}\n\n${message}`);
    }
    
    /**
     * Get application status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            rtcConnected: this.rtcClient?.isJoined || false,
            roomInfo: this.rtcClient?.getRoomInfo() || null,
            config: CONFIG
        };
    }
    
    /**
     * Cleanup on page unload
     */
    cleanup() {
        this.log('Cleaning up application...');
        
        if (this.rtcClient) {
            this.rtcClient.destroy();
        }
        
        if (this.uiController) {
            // UI cleanup if needed
        }
    }
    
    /**
     * Logging utilities
     */
    log(...args) {
        if (CONFIG.DEV.enableDebugLog) {
            console.log('[RTC Agent App]', ...args);
        }
    }
    
    logError(...args) {
        console.error('[RTC Agent App Error]', ...args);
    }
}

// Global application instance
let app = null;

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app = new RTCAgentApp();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (app) {
        app.cleanup();
    }
});

// Export for debugging
if (CONFIG.DEV.enableDebugLog) {
    window.RTCAgentApp = app;
    window.CONFIG = CONFIG;
}