const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// choose a different port than the main API server
const PORT = process.env.YT_PORT || 5001;

// 🔑 Replace with your API key or set YOUTUBE_API_KEY environment variable
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "AIzaSyCh1lDNgOO2rfD5APS-ybbhsuFvKDGYQXo";

// Function to extract playlist ID from URL
function extractPlaylistId(url) {
  const regex = /[?&]list=([^#\&\?]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

app.post("/get-playlist", async (req, res) => {
  try {
    const { playlistUrl } = req.body;

    const playlistId = extractPlaylistId(playlistUrl);

    if (!playlistId) {
      return res.status(400).json({ error: "Invalid Playlist URL" });
    }

    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/playlistItems`,
      {
        params: {
          part: "snippet",
          maxResults: 50,
          playlistId: playlistId,
          key: YOUTUBE_API_KEY,
        },
      }
    );

    const videos = response.data.items.map((item) => {
      return {
        title: item.snippet.title,
        videoUrl: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
      };
    });

    res.json(videos);
  } catch (error) {
    // Provide clearer debug info when the YouTube API call fails
    const status = error.response?.status || 500;
    const body = error.response?.data || { message: error.message };
    console.error('Playlist fetch error:', status, body);
    res.status(status).json({ error: body });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
