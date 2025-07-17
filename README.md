# WhereIsAvailable

A modern web app to find out **where a movie or series is available for streaming by subscription** (no rental or purchase) across the world, for major platforms (Netflix, Prime Video, Disney+, Apple TV+, Max). Built with React + Vite.

---

## ✨ Features
- Search for a movie or series by name and type (movie/series)
- Select one or more streaming platforms
- Checks all countries (from `countries.json`) and stops at the first where the title is available by subscription
- Only shows results available **with a subscription** (no extra cost, no rental/buy)
- Real-time mini-console showing tested countries
- Cancel search at any time
- Beautiful, responsive UI with icons and clear feedback

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm
- A [RapidAPI](https://rapidapi.com/) account and a valid API key for [streaming-availability.p.rapidapi.com](https://rapidapi.com/movie-of-the-night-movie-of-the-night-default/api/streaming-availability)

### Installation
```sh
npm install
```

### Configuration
1. **API Key**
   - Create a `.env` file at the project root:
     ```env
     VITE_RAPIDAPI_KEY=your_rapidapi_key_here
     ```
   - Restart the dev server after any change to `.env`.

2. **Countries and Platforms**
   - `countries.json` (at project root): List of country codes and names (ISO 3166-1 alpha-2)
   - `src/platforms.json`: List of supported platforms (id, name, icon)

### Run the app (development)
```sh
npm run dev
```
Then open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🖥️ Usage
- Select one or more platforms (checkboxes)
- Choose Movie or Series (radio)
- Enter the title
- Click **Search**
- Watch the tested countries in real time in the mini-console
- Cancel at any time with the **Cancel** button
- If found, the result shows the country, platform, and raw API data

---

## ⚠️ Notes & Limitations
- **CORS**: The app makes direct calls to RapidAPI. If you get CORS errors, you may need to use a backend proxy.
- **API Quota**: Free RapidAPI plans have a limited number of requests per day.
- **Speed**: The app stops at the first country where the title is found, but may take time if the title is rare.
- **Subscription only**: Only results with `type: 'subscription'` are shown (no rental/buy).
- **Data freshness**: Results depend on the accuracy and update frequency of the RapidAPI provider.

---

## 📁 Project Structure
```
/whereisavailable-web
  |-- src/
      |-- App.jsx           # Main React app
      |-- platforms.json    # List of streaming platforms
  |-- countries.json        # List of countries (root)
  |-- .env                 # API key (not committed)
  |-- README.md
```

---

## 🙏 Credits
- [Streaming Availability API (RapidAPI)](https://rapidapi.com/movie-of-the-night-movie-of-the-night-default/api/streaming-availability)
- [React](https://react.dev/), [Vite](https://vitejs.dev/)
- UI/UX: @QuentinHelion

## 📝 License
MIT
