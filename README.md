# RTC Agent Test

A simple web demo showcasing Volcano Engine RTC functionality for video calling.

## 🎯 Features

- **Basic Video Calling**: 1-on-1 and multi-participant video calls
- **Device Controls**: Camera/microphone toggle, device selection
- **Screen Sharing**: Share your screen with other participants
- **Responsive Design**: Works on desktop and mobile browsers
- **Real-time Communication**: Low-latency audio/video streaming

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- Modern browser with WebRTC support
- Volcano Engine RTC account and AppId

### Installation

1. **Clone and setup**:
```bash
git clone <your-repo-url>
cd rtc-agent-test
npm install
```

2. **Configure RTC credentials**:
Edit `src/js/config.js` and replace:
```javascript
RTC: {
    appId: 'YOUR_ACTUAL_APP_ID', // Get from Volcano Engine Console
    // ...
}
```

3. **Start development servers**:
```bash
npm run dev
```

This starts:
- Frontend server on http://localhost:8080
- Backend proxy on http://localhost:3000

### Usage

1. Open http://localhost:8080 in multiple browser windows
2. Enter a room ID and your name
3. Click "Join Room" to start video calling
4. Share the room ID with others to join

## 📁 Project Structure

```
├── src/                    # Frontend application
│   ├── index.html         # Main demo page
│   ├── css/style.css      # Responsive styles
│   └── js/
│       ├── config.js      # Configuration management
│       ├── rtc-client.js  # Core RTC wrapper
│       ├── ui-controller.js # UI state management
│       └── app.js         # Application entry point
├── server/                # Backend proxy server
│   ├── app.js            # Express server
│   └── package.json      # Server dependencies
└── package.json          # Main project dependencies
```

## 🔧 Configuration

### Environment Variables (Optional)
```bash
RTC_APP_ID=your_volcano_engine_app_id
RTC_APP_KEY=your_app_key
RTC_APP_SECRET=your_app_secret
```

### URL Parameters
Direct room joining:
```
http://localhost:8080?room=my-room&user=john
```

## 🧪 Development

### Testing
- Use multiple browser tabs for local testing
- Test with different devices and network conditions
- Enable debug logging in `config.js`

### Mock Mode
For development without RTC service:
```javascript
DEV: {
    mockMode: true, // Enable mock mode
    enableDebugLog: true
}
```

## 📱 Browser Support

- Chrome 60+
- Firefox 60+
- Safari 14+
- Edge 80+
- Mobile browsers with WebRTC support

## 🔗 Integration

### Adding Real Token Service
Replace mock token generation in `server/app.js`:

```javascript
// Replace with actual Volcano Engine SDK
const token = await volcengineRTC.generateToken({
    appId: CONFIG.RTC.appId,
    appKey: CONFIG.RTC.appKey,
    roomId,
    userId,
    expireTime
});
```

### Custom Features
- Extend `SimpleRTCClient` class for additional RTC features
- Modify `UIController` for custom UI components
- Add new endpoints in `server/app.js` for backend services

## 🐛 Troubleshooting

### Common Issues

1. **"Configuration Error"**: Update `appId` in `config.js`
2. **Camera/Mic access denied**: Allow permissions in browser
3. **Connection failed**: Check network and firewall settings
4. **Token expired**: Implement proper token refresh

### Debug Mode
Enable detailed logging:
```javascript
DEV: {
    enableDebugLog: true
}
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📚 Resources

- [Volcano Engine RTC Documentation](https://www.volcengine.com/docs/6348/75707)
- [Official Demo Repository](https://github.com/volcengine/rtc-aigc-demo)
- [WebRTC API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)