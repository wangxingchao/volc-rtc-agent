/**
 * Simple Express Server for RTC Agent Test
 * Provides basic proxy and token services
 */
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuration from environment
const CONFIG = {
    RTC: {
        appId: process.env.RTC_APP_ID || 'your_app_id',
        appKey: process.env.RTC_APP_KEY || 'your_app_key',
        appSecret: process.env.RTC_APP_SECRET || 'your_app_secret'
    }
};

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

/**
 * Generate RTC token (simplified implementation)
 * In production, use Volcano Engine's token generation service
 */
app.post('/api/rtc/token', async (req, res) => {
    try {
        const { roomId, userId, expireTime = 3600 } = req.body;
        
        if (!roomId || !userId) {
            return res.status(400).json({
                error: 'Missing required parameters: roomId, userId'
            });
        }
        
        // For demo purposes, generate a mock token
        // In production, use Volcano Engine SDK to generate real tokens
        const mockToken = generateMockToken(roomId, userId, expireTime);
        
        res.json({
            token: mockToken,
            roomId,
            userId,
            expireTime: Date.now() + (expireTime * 1000)
        });
        
        console.log(`Generated token for room: ${roomId}, user: ${userId}`);
        
    } catch (error) {
        console.error('Token generation error:', error);
        res.status(500).json({
            error: 'Failed to generate token',
            message: error.message
        });
    }
});

/**
 * Get room information
 */
app.get('/api/rtc/room/:roomId', async (req, res) => {
    try {
        const { roomId } = req.params;
        
        // Mock room information
        // In production, fetch from Volcano Engine API
        const roomInfo = {
            roomId,
            participants: [],
            createdAt: new Date().toISOString(),
            isActive: true,
            maxParticipants: 10
        };
        
        res.json(roomInfo);
        
    } catch (error) {
        console.error('Room info error:', error);
        res.status(500).json({
            error: 'Failed to get room information',
            message: error.message
        });
    }
});

/**
 * Proxy endpoint for Volcano Engine API calls
 * Use this to avoid CORS issues in development
 */
app.post('/api/proxy/volcengine', async (req, res) => {
    try {
        const { url, method = 'POST', headers = {}, body } = req.body;
        
        // Add authentication headers
        const authHeaders = {
            'Authorization': `Bearer ${CONFIG.RTC.appKey}`,
            'Content-Type': 'application/json',
            ...headers
        };
        
        // Make request to Volcano Engine API
        const fetch = require('node-fetch');
        const response = await fetch(url, {
            method,
            headers: authHeaders,
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        res.json(data);
        
    } catch (error) {
        console.error('Proxy request error:', error);
        res.status(500).json({
            error: 'Proxy request failed',
            message: error.message
        });
    }
});

/**
 * Configuration endpoint
 */
app.get('/api/config', (req, res) => {
    res.json({
        rtc: {
            appId: CONFIG.RTC.appId,
            // Don't expose sensitive information
            hasAppKey: !!CONFIG.RTC.appKey,
            hasAppSecret: !!CONFIG.RTC.appSecret
        },
        server: {
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development'
        }
    });
});

/**
 * Error handling middleware
 */
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message
    });
});

/**
 * 404 handler
 */
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        path: req.path
    });
});

/**
 * Utility functions
 */

/**
 * Generate mock token for development
 * Replace with real Volcano Engine token generation
 */
function generateMockToken(roomId, userId, expireTime) {
    const timestamp = Date.now();
    const payload = {
        roomId,
        userId,
        timestamp,
        expireTime
    };
    
    // Simple base64 encoding for demo
    // In production, use proper JWT with signing
    const token = Buffer.from(JSON.stringify(payload)).toString('base64');
    
    return `mock_${token}`;
}

/**
 * Validate token (for mock tokens)
 */
function validateMockToken(token) {
    try {
        if (!token.startsWith('mock_')) {
            return { valid: false, error: 'Invalid token format' };
        }
        
        const payload = JSON.parse(
            Buffer.from(token.substring(5), 'base64').toString()
        );
        
        const now = Date.now();
        const expireTime = payload.timestamp + (payload.expireTime * 1000);
        
        if (now > expireTime) {
            return { valid: false, error: 'Token expired' };
        }
        
        return { valid: true, payload };
        
    } catch (error) {
        return { valid: false, error: 'Invalid token' };
    }
}

// Start server
app.listen(PORT, () => {
    console.log(`🚀 RTC Agent Server running on port ${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
    console.log(`🔧 Config: http://localhost:${PORT}/api/config`);
    
    if (process.env.NODE_ENV !== 'production') {
        console.log('🔍 Development mode - using mock tokens');
    }
});

module.exports = app;