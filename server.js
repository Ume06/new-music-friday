const express = require("express");
const path = require("path");
const request = require("request-promise");
const querystring = require("querystring");
const crypto = require("crypto");
const fs = require("fs");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cookieParser());

const ip = "10.10.1.184";
const port = 8080;

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirectUri = `http://${ip}:${port}/callback`;

app.get("/login", (req, res) => {
  var state = generateRandomString(16);
  var scope =
    "user-read-private user-read-email user-modify-playback-state user-read-playback-state";

  const authUrl =
    "https://accounts.spotify.com/authorize?" +
    querystring.stringify({
      response_type: "code",
      client_id: clientId,
      scope: scope,
      redirect_uri: redirectUri,
      state: state
    });

  res.json({url: authUrl}); // Send JSON response with URL
});

app.get("/callback", (req, res) => {
  var code = req.query.code || null;
  var state = req.query.state || null;

  if (state === null) {
    res.send(`
            <script>
                window.opener.postMessage("spotify-auth-failed", window.location.origin);
                window.close();
            </script>
        `);
  } else {
    var authOptions = {
      url: "https://accounts.spotify.com/api/token",
      form: {
        code: code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      },
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          new Buffer.from(clientId + ":" + clientSecret).toString("base64")
      },
      json: true
    };

    request.post(authOptions, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        const accessToken = body.access_token;
        const refreshToken = body.refresh_token;

        res.cookie("spotify_access_token", accessToken, {
          httpOnly: true,
          secure: false,
          sameSite: "strict",
          maxAge: 60 * 60 * 1000
        });
        res.cookie("spotify_refresh_token", refreshToken, {
          httpOnly: true,
          secure: false,
          sameSite: "strict",
          maxAge: 60 * 60 * 1000
        });
        // Send message to parent window to update Vue data
        res.send(`
                    <script>
                        window.opener.postMessage(
                            { status: "success" },
                            window.location.origin
                        );
                        window.close();
                    </script>
                `);
      } else {
        res.send(`
                    <script>
                        window.opener.postMessage("spotify-auth-failed", window.location.origin);
                        window.close();
                    </script>
                `);
      }
    });
  }
});

app.get("/my-profile", (req, res) => {
  const accessToken = req.cookies.spotify_access_token;

  if (!accessToken) {
    return res.status(401).json({error: "No access token. Please log in."});
  }

  const options = {
    url: "https://api.spotify.com/v1/me",
    headers: {Authorization: "Bearer " + accessToken},
    json: true
  };

  request.get(options, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      res.json(body);
    } else {
      res.status(400).json({error: "Unable to fetch user profile"});
    }
  });
});

app.get("/tracks", (req, res) => {
  const music = getMusic();
  if (music.tracks.length < 1) {
    return res.status(404).json({error: "No albums found"});
  } else {
    const accessToken = req.cookies.spotify_access_token;
    const trackRequest = {
      url: "https://api.spotify.com/v1/tracks?ids=" + music.tracks,
      headers: {Authorization: "Bearer " + accessToken},
      json: true
    };

    request.get(trackRequest, async (error, response, body) => {
      if (!error && response.statusCode === 200) {
        res.json(body);
      } else {
        res.status(400).json({error: "Unable to fetch user profile"});
      }
    });
  }
});

app.get("/albums", (req, res) => {
  const music = getMusic();
  if (music.albums.length < 1) {
    return res.status(404).json({error: "No albums found"});
  } else {
    const accessToken = req.cookies.spotify_access_token;
    const options = {
      url: "https://api.spotify.com/v1/albums?ids=" + music.albums,
      headers: {Authorization: "Bearer " + accessToken},
      json: true
    };

    request.get(options, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        res.json(body);
      } else {
        res.status(400).json({error: "Unable to fetch user profile"});
      }
    });
  }
});

app.get("/playMusic", (req, res) => {
  let type = req.query.type;
  let id = req.query.id;

  const accessToken = req.cookies.spotify_access_token;
  const options = {
    url: "https://api.spotify.com/v1/me/player/devices",
    headers: {Authorization: "Bearer " + accessToken},
    json: true
  };

  request.get(options, (error, response, body) => {
    let selectedDevice = null;

    for (const device of body.devices) {
      if (device.is_active) {
        selectedDevice = device;
        break;
      }
    }

    if (!selectedDevice && body.devices.length > 0) {
      selectedDevice = body.devices[0];
    }

    // If we found a device, send the play request
    if (selectedDevice) {
      options.url = `https://api.spotify.com/v1/me/player/play?device_id=${selectedDevice.id}`;

      if (type === "track") {
        options.body = {uris: [`spotify:${type}:${id}`]};
      } else if (type === "album") {
        options.body = {context_uri: `spotify:${type}:${id}`};
      }

      request.put(options, (error, response, body) => {
        res.status(200).send();
      });
    } else {
      url = `spotify:${type}:${id}`;
      res.status(200).send({url: url});
    }
  });
});

app.get("/music.json", (req, res) => {
  res.sendFile(path.join(__dirname, "music.json"));
});

app.post("/add-track", (req, res) => {
  try {
    const newTrack = req.body.track; // Expecting a single track URL
    if (typeof newTrack !== "string") {
      return res
        .status(400)
        .json({error: "Invalid track format. Expected a string."});
    }

    const rawData = fs.readFileSync("./music.json");
    const musicData = JSON.parse(rawData);
    if (!musicData.music.includes(newTrack)) {
      musicData.music.push(newTrack);
      fs.writeFileSync("./music.json", JSON.stringify(musicData, null, 2));
      return res.json({success: true, message: "Track added successfully!"});
    }

    res.json({success: false, message: "Track already exists."});
  } catch (error) {
    console.error("Error updating music.json:", error);
    res.status(500).json({error: "Failed to update music file."});
  }
});

app.post("/remove-track", (req, res) => {
  try {
    const trackToRemove = req.body.track;
    if (typeof trackToRemove !== "string") {
      return res
        .status(400)
        .json({error: "Invalid track format. Expected a string."});
    }

    const rawData = fs.readFileSync("./music.json");
    const musicData = JSON.parse(rawData);
    const updatedMusic = musicData.music.filter(
      (track) => track !== trackToRemove
    );

    if (updatedMusic.length === musicData.music.length) {
      return res.json({
        success: false,
        message: "Track not found in the list."
      });
    }

    fs.writeFileSync(
      "./music.json",
      JSON.stringify({music: updatedMusic}, null, 2)
    );
    res.json({success: true, message: "Track removed successfully!"});
  } catch (error) {
    console.error("Error updating music.json:", error);
    res.status(500).json({error: "Failed to update music file."});
  }
});

app.get("/refresh-token", async (req, res) => {
  try {
    const refreshToken = req.cookies.spotify_refresh_token;
    if (!refreshToken) {
      return res
        .status(401)
        .json({error: "No refresh token. Please log in again."});
    }

    const authOptions = {
      url: "https://accounts.spotify.com/api/token",
      form: {
        grant_type: "refresh_token",
        refresh_token: refreshToken
      },
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(clientId + ":" + clientSecret).toString("base64")
      },
      json: true
    };

    const body = await request.post(authOptions);

    if (body.error) {
      // e.g. invalid_grant if the refresh token is no longer valid
      return res.status(400).json({error: body.error});
    }

    // Update the access token cookie
    res.cookie("spotify_access_token", body.access_token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 60 * 60 * 1000 // 1 hour
    });

    return res.json({success: true});
  } catch (error) {
    console.error("Refresh error:", error);
    res.status(500).json({error: "Failed to refresh token"});
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/update", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "manage.html"));
});

app.get("/check-auth", async (req, res) => {
  try {
    const accessToken = req.cookies.spotify_access_token;
    const refreshToken = req.cookies.spotify_refresh_token;

    if (!accessToken && !refreshToken) {
      return res.json({authenticated: false});
    }

    if (!accessToken) {
      if (!refreshToken) {
        return res.json({authenticated: false});
      }
    }

    return res.json({authenticated: true});
  } catch (error) {
    console.error(error);
    return res.json({authenticated: false});
  }
});

app.use(express.static(path.join(__dirname, "public")));

app.listen(port, () => {
  console.log(`Server is running on http://${ip}:${port}`);
});

const generateRandomString = (length) => {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

const getMusic = () => {
  try {
    const rawData = JSON.parse(fs.readFileSync("./music.json"));
    var songQueryString = "";
    var albumQueryString = "";

    rawData.music.forEach((spotifyRef) => {
      const item = extractSpotifyId(spotifyRef);
      if (item.type == "track") {
        if (songQueryString.length > 1) {
          songQueryString += ",";
        }
        songQueryString += item.id;
      } else if (item.type == "album") {
        if (albumQueryString.length > 1) {
          albumQueryString += ",";
        }
        albumQueryString += item.id;
      }
    });
    return {tracks: songQueryString, albums: albumQueryString};
  } catch (error) {
    console.error("Error reading data file:", error);
    return {tracks: "", albums: ""}; // Return empty structure on error
  }
};

const extractSpotifyId = (spotifyUrl) => {
  try {
    const url = new URL(spotifyUrl);
    const pathSegments = url.pathname.split("/");

    // Ensure it's a Spotify link with a valid type (track or album)
    if (url.hostname.includes("spotify.com") && pathSegments.length >= 3) {
      const type = pathSegments[1];
      const id = pathSegments[2].split("?")[0]; // Remove parameters if any

      if (type === "track" || type === "album") {
        return {type: type, id: id};
      } else {
        throw new Error(
          "Invalid Spotify link type. Only track and album links are supported."
        );
      }
    } else {
      throw new Error("Invalid Spotify URL format.");
    }
  } catch (error) {
    return `Error: ${error.message}`;
  }
};
