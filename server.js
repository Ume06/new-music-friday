const express = require("express");
const path = require("path");
const request = require("request-promise");
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(express.json());

const address = process.env.ADDRESS;
const port = 80;

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

let globalAccessToken = null;
let tokenExpiryTime = 0;

app.use(express.static(path.join(__dirname, "public")));

// ─────────────────────────────────────────────────────────────────────────────
//    Helper function to request a Client Credentials access token
// ─────────────────────────────────────────────────────────────────────────────
async function getClientAccessToken() {
  const currentTime = Date.now() / 1000; 
  if (globalAccessToken && currentTime < tokenExpiryTime) {
    return globalAccessToken;
  }

  const tokenOptions = {
    url: "https://accounts.spotify.com/api/token",
    form: {
      grant_type: "client_credentials"
    },
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    json: true
  };

  try {
    const body = await request.post(tokenOptions);
    // Save token and expiry
    globalAccessToken = body.access_token;
    // Expires in body.expires_in (in seconds); store future time
    tokenExpiryTime = currentTime + body.expires_in;
    return globalAccessToken;
  } catch (error) {
    console.error("Error getting client credentials token:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//    API to get tracks, based on music.json
//    This no longer needs to know about user playback devices
// ─────────────────────────────────────────────────────────────────────────────
app.get("/tracks", async (req, res) => {
  try {
    const music = getMusic();
    if (!music.tracks) {
      return res.status(404).json({ error: "No tracks found." });
    }

    const accessToken = await getClientAccessToken();

    const trackRequest = {
      url: "https://api.spotify.com/v1/tracks",
      qs: { ids: music.tracks },
      headers: { Authorization: `Bearer ${accessToken}` },
      json: true
    };

    const body = await request.get(trackRequest);
    return res.json(body);
  } catch (err) {
    console.error("Error in /tracks route:", err);
    return res.status(500).json({ error: "Failed to fetch tracks." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//    API to get albums, based on music.json
// ─────────────────────────────────────────────────────────────────────────────
app.get("/albums", async (req, res) => {
  try {
    const music = getMusic();
    if (!music.albums) {
      return res.status(404).json({ error: "No albums found." });
    }

    const accessToken = await getClientAccessToken();

    const options = {
      url: "https://api.spotify.com/v1/albums",
      qs: { ids: music.albums },
      headers: { Authorization: `Bearer ${accessToken}` },
      json: true
    };

    const body = await request.get(options);
    return res.json(body);
  } catch (err) {
    console.error("Error in /albums route:", err);
    return res.status(500).json({ error: "Failed to fetch albums." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//    Endpoint to serve your local music.json
// ─────────────────────────────────────────────────────────────────────────────
app.get("/music.json", (req, res) => {
  res.sendFile(path.join(__dirname, "music.json"));
});

// ─────────────────────────────────────────────────────────────────────────────
//    A small helper to read music.json and build the comma-separated IDs
// ─────────────────────────────────────────────────────────────────────────────
function getMusic() {
  try {
    const rawData = JSON.parse(fs.readFileSync("./music.json"));
    let tracks = [];
    let albums = [];

    rawData.music.forEach((spotifyUrl) => {
      const item = extractSpotifyId(spotifyUrl);
      if (item.type === "track") {
        tracks.push(item.id);
      } else if (item.type === "album") {
        albums.push(item.id);
      }
    });

    return { tracks: tracks.join(","), albums: albums.join(",") };
  } catch (error) {
    console.error("Error reading music.json:", error);
    return { tracks: "", albums: "" };
  }
}

function extractSpotifyId(spotifyUrl) {
  try {
    const urlObj = new URL(spotifyUrl);
    const pathSegments = urlObj.pathname.split("/");

    if (
      urlObj.hostname.includes("spotify.com") &&
      (pathSegments[1] === "track" || pathSegments[1] === "album")
    ) {
      return { type: pathSegments[1], id: pathSegments[2].split("?")[0] };
    } else {
      throw new Error("Invalid Spotify URL.");
    }
  } catch (error) {
    return { type: "error", id: "" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//    Serve index.html by default
// ─────────────────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ─────────────────────────────────────────────────────────────────────────────
//    Start the server
// ─────────────────────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`Server is running on http://${address}:${port}`);
});
