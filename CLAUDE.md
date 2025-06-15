# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **simple web RTC demo** using Volcano Engine RTC SDK for basic video calling functionality. The project demonstrates core WebRTC features including room management, audio/video streaming, and device controls in a clean, responsive web interface.

## Architecture

### Core Components
- **Frontend**: Vanilla HTML/CSS/JavaScript (no framework dependencies)
- **RTC SDK**: @volcengine/rtc ~4.66.15 for WebRTC functionality  
- **Backend**: Simple Express proxy server for token generation
- **UI**: Clean, responsive design with mobile support

### File Structure
```
src/
├── index.html          # Main demo page
├── css/style.css       # Responsive styles
└── js/
    ├── config.js       # Configuration management
    ├── rtc-client.js   # Core RTC wrapper class
    ├── ui-controller.js # UI state management
    └── app.js          # Main application entry point
server/
├── app.js              # Express proxy server
└── package.json        # Server dependencies
```

## Key Classes

### SimpleRTCClient (`src/js/rtc-client.js`)
Core WebRTC wrapper handling:
- Engine initialization and room management
- Local/remote stream management
- Device controls (camera, microphone)
- Screen sharing functionality
- Event handling for user join/leave

### UIController (`src/js/ui-controller.js`)
UI state management:
- DOM event handling
- Video element management
- Button state updates
- Participant list management
- Error display and loading states

## Common Commands

### Development
```bash
# Install dependencies
npm install

# Start development server (frontend + backend)
npm run dev

# Or manually:
# Frontend (serves static files on :8080)
npm run serve

# Backend (proxy server on :3000)
npm run server
cd server && node app.js
```

### Configuration Setup
1. **Update RTC credentials** in `src/js/config.js`:
   ```javascript
   RTC: {
       appId: 'YOUR_ACTUAL_APP_ID', // Replace with Volcano Engine AppId
       // ... other config
   }
   ```

2. **Environment variables** for server (optional):
   ```bash
   RTC_APP_ID=your_app_id
   RTC_APP_KEY=your_app_key
   RTC_APP_SECRET=your_app_secret
   ```

## Key Implementation Patterns

### Event-Driven Architecture
- RTC events (user join/leave, stream add/remove)
- UI events (button clicks, form submissions)
- Error handling with user feedback

### Configuration Management
- Centralized config in `config.js`
- Environment variable overrides
- Validation and error handling

### Device Management
- Permission handling for camera/microphone
- Device enumeration and selection
- Toggle controls with visual feedback

## Development Workflow

### Testing Setup
- Use multiple browser windows/tabs for local testing
- Room ID sharing for multi-participant testing
- Mock mode available for development without RTC service

### URL Parameters
- `?room=ROOM_ID&user=USER_NAME` for direct room joining
- Supports auto-join configuration

## Integration Notes

### Volcano Engine RTC SDK
- Requires valid AppId and token for production use
- Mock token generation available for development
- Event-based API with promise support

### Browser Compatibility
- Modern browsers with WebRTC support
- Mobile responsive design
- Progressive enhancement for unsupported features