// Configuration for RTC Agent Test Demo
const CONFIG = {
    // Volcano Engine RTC Configuration
    RTC: {
        // TODO: Replace with your actual AppId from Volcano Engine Console
        appId: 'YOUR_RTC_APP_ID',
        
        // Server configuration
        serverUrl: 'wss://rtc-ws-sg.volcengineapi.com',
        
        // Default room settings
        defaultRoomId: 'demo-room',
        
        // Video configuration
        video: {
            width: 1280,
            height: 720,
            frameRate: 30,
            bitrate: 1000
        },
        
        // Audio configuration
        audio: {
            sampleRate: 48000,
            channels: 2,
            bitrate: 128
        }
    },
    
    // UI Configuration
    UI: {
        maxParticipants: 4,
        autoJoin: false,
        showControls: true,
        enableScreenShare: true,
        
        // Theme
        theme: {
            primaryColor: '#667eea',
            secondaryColor: '#764ba2'
        }
    },
    
    // Development settings
    DEV: {
        enableDebugLog: true,
        mockMode: false, // Set to true for development without RTC service
        autoGenerateUserId: true
    },
    
    // Server configuration for proxy
    SERVER: {
        baseUrl: 'http://localhost:3000',
        endpoints: {
            token: '/api/rtc/token',
            roomInfo: '/api/rtc/room'
        }
    }
};

// Utility functions for configuration
const ConfigUtils = {
    // Generate random user ID if needed
    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    },
    
    // Validate configuration
    validate() {
        const errors = [];
        
        if (!CONFIG.RTC.appId || CONFIG.RTC.appId === 'YOUR_RTC_APP_ID') {
            errors.push('RTC AppId is not configured');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    },
    
    // Get configuration with environment overrides
    getConfig() {
        // In production, these could come from environment variables
        const config = { ...CONFIG };
        
        // Override with environment variables if available
        if (typeof window !== 'undefined' && window.RTC_CONFIG) {
            Object.assign(config.RTC, window.RTC_CONFIG);
        }
        
        return config;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, ConfigUtils };
}