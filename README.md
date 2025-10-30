# 🎮 I-Spy-Smokey 🐱

A fun and interactive I-Spy game where you find Smokey the cat hidden in different scenes! Features mobile touch controls, penalty-based scoring, dramatic particle effects, and a playful whimsical design.

## ✨ Features

### 🎯 Core Gameplay
- **Find Smokey**: Locate the hidden cat in each level by clicking on him
- **Multiple Levels**: Progress through different scenes with increasing difficulty
- **Timer System**: Track your completion time with millisecond precision
- **Leaderboard**: Save and compare your best times

### 📱 Mobile-Friendly Controls
- **Drag to Pan**: Click and drag to move around large images
- **Long Press to Select**: Hold your finger in place to select Smokey
- **Touch Optimized**: Responsive design that works great on phones and tablets
- **Gesture Support**: Intuitive touch controls for easy navigation

### 🎨 Visual "Wow Factor"
- **Particle Explosions**: Dramatic effects when you find Smokey
- **Confetti Bursts**: Colorful celebration animations
- **Sparkle Effects**: Twinkling stars and visual flourishes
- **Level Transitions**: Smooth fade effects between levels
- **Screen Effects**: Glowing and flash effects for correct finds

### 🏆 Enhanced Scoring System
- **Penalty System**: Wrong clicks add 5 seconds to your time
- **Accuracy Tracking**: See your click accuracy percentage
- **Score Breakdown**: View base time, penalties, and total time
- **Real-time Feedback**: Instant penalty notifications

### 🎨 Playful Design
- **Whimsical Theme**: Cartoon-style with vibrant colors
- **Bouncy Animations**: Spring-loaded UI elements
- **Gradient Backgrounds**: Animated rainbow backgrounds
- **Emoji Decorations**: Fun visual elements throughout
- **Rounded Corners**: Soft, friendly design language

### 🛠️ Level Editor
- **Visual Editor**: Click and drag to define click regions
- **Image Upload**: Easy image management
- **Live Preview**: Test levels before saving
- **Export/Import**: Share level configurations
- **Zoom Controls**: Detailed region editing

## 🚀 Quick Start

### Prerequisites
- Node.js (for running the development server)
- A modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/i-spy-smokey.git
   cd i-spy-smokey
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the game**
   ```bash
   npm start
   ```
   The game will open at `http://localhost:3000`

4. **Open the level editor**
   ```bash
   npm run editor
   ```
   The editor will open at `http://localhost:3001`

## 🎮 How to Play

### Basic Gameplay
1. **Start the Game**: Click "Play" to begin your adventure
2. **Find Smokey**: Look carefully at the image and find the hidden cat
3. **Click to Select**: 
   - **Desktop**: Click on Smokey to select him
   - **Mobile**: Long press (hold) on Smokey to select him
4. **Pan Around**: Drag to move around large images
5. **Complete Levels**: Find Smokey in all levels to win!

### Controls
- **Mouse/Touch**: Click and drag to pan around images
- **Long Press**: Hold your finger/mouse on Smokey to select him
- **Zoom**: Use the level editor's zoom controls for detailed editing

### Scoring
- **Base Time**: Your actual completion time
- **Penalties**: +5 seconds for each wrong click
- **Total Time**: Base time + penalties
- **Accuracy**: Percentage of correct clicks

## 🛠️ Level Editor Usage

### Creating New Levels
1. **Open Editor**: Run `npm run editor`
2. **Add Level**: Click "➕ Add New Level"
3. **Upload Image**: Select an image from the dropdown
4. **Define Region**: 
   - Switch to "📐 Region" tool
   - Click and drag to create a clickable area
   - Adjust the region using the corner handles
5. **Save Level**: Fill in the level name and click "💾 Save Level"

### Editing Existing Levels
1. **Select Level**: Click on a level in the sidebar
2. **Modify Region**: Use the region tool to adjust the clickable area
3. **Update Settings**: Change the level name or other properties
4. **Save Changes**: Click "💾 Save Level"

### Exporting Levels
1. **Save All**: Click "💾 Save Levels" to copy JSON to clipboard
2. **Export File**: Click "📤 Export JSON" to download levels.json
3. **Import Levels**: Click "📥 Import JSON" to load from file

## 📁 Project Structure

```
i-spy-smokey/
├── index.html              # Main game interface
├── editor.html             # Level editor interface
├── package.json            # NPM configuration
├── css/
│   ├── style.css          # Main game styles
│   └── editor.css         # Editor styles
├── js/
│   ├── game.js            # Main game logic
│   ├── level.js           # Level management
│   ├── leaderboard.js     # Scoring system
│   ├── devMode.js         # Development tools
│   └── editor.js          # Level editor logic
├── levels/
│   ├── levels.json        # Level configuration
│   └── pic.jpeg          # Sample level image
└── assets/
    └── loading.gif        # Loading animation
```

## 🎨 Customization

### Adding New Images
1. Place image files in the `levels/` directory
2. Update the image dropdown in the level editor
3. Create new levels using your images

### Modifying Game Settings
- **Penalty Time**: Change `penaltyPerClick` in `game.js` (default: 5000ms)
- **Long Press Duration**: Modify `longPressThreshold` in `game.js` (default: 500ms)
- **Visual Effects**: Adjust particle counts and colors in `level.js`

### Styling Changes
- **Colors**: Update CSS custom properties in `style.css`
- **Animations**: Modify keyframe animations for different effects
- **Layout**: Adjust responsive breakpoints for different screen sizes

## 🐛 Troubleshooting

### Common Issues
1. **Images not loading**: Check that image files are in the `levels/` directory
2. **Touch not working**: Ensure you're using a modern browser with touch support
3. **Editor not saving**: Check browser console for errors and ensure proper JSON format

### Browser Compatibility
- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 12+)
- **Edge**: Full support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **p5.js**: For the amazing graphics library
- **Comic Sans MS**: For the playful font
- **Smokey**: The star of the show! 🐱

## 📞 Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Check the troubleshooting section above
- Review the browser console for error messages

---

**Happy hunting! 🎯🐱✨**
