# SkyBlock Stats Viewer

A beautiful and feature-rich Hypixel SkyBlock stats viewer with stunning animations and real-time data fetching.

## Features

- 🎮 Real-time player stats fetching
- ✨ Beautiful animations and modern UI
- 📊 Comprehensive stats display (Skills, Slayers, Dungeons, Wealth)
- 🎨 Gradient animations and 3D cube loaders
- 📱 Fully responsive design
- 🔍 Search history
- ⚡ Fast and optimized

## Setup

1. Clone this repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Add your Hypixel API key to the `.env` file:
```
HYPIXEL_API_KEY=your_hypixel_api_key_here
```

You can get a Hypixel API key by running `/api new` on the Hypixel server.

5. Start the server:
```bash
npm start
```

6. Open your browser and navigate to `http://localhost:3000`

## Technologies Used

- Node.js & Express for the backend
- Vanilla JavaScript for the frontend
- CSS3 with animations and gradients
- Hypixel API for data fetching
- SkyHelper NetWorth calculator

## API Routes

- `GET /api/stats/:username` - Fetch player stats

## Features Breakdown

### Player Statistics
- SkyBlock Level
- Net Worth calculation
- Purse and Bank balance
- Fairy Souls collected
- Last active status

### Skills
- All 11 skills with levels
- Skill average calculation
- Beautiful skill icons

### Slayers
- All 6 slayer types
- Total slayer level
- Progress tracking

### Dungeons
- Catacombs level
- Progress visualization

## Styling Features

- 3D animated cube loader
- Floating background cubes with rotation
- Gradient text animations
- Hover effects and transitions
- Card-based layout with depth
- Responsive grid system

## Browser Support

Works on all modern browsers (Chrome, Firefox, Safari, Edge)

## License

MIT