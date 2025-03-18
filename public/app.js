function fetchWithRefresh(url, options = {}) {
  return fetch(url, options).then(async (response) => {
    if (response.status === 401) {
      // Token is invalid or expired -> attempt to refresh
      const refreshResponse = await fetch("/refresh_token");
      if (!refreshResponse.ok) {
        // The refresh attempt failed, so the user likely needs to log in again
        throw new Error("Failed to refresh token. Please log in again.");
      }
      // After a successful refresh, retry the original request
      const secondResponse = await fetch(url, options);
      return secondResponse;
    }
    return response;
  });
}

new Vue({
  el: "#app",
  data: {
    profile: null,
    tracks: null,
    albums: null,
    loggedin: false
  },
  mounted() {
    fetch("/check-auth")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          this.loggedin = true;
          // If so, fetch profile & music right away
          this.getProfile();
          this.getMusic();
        } else {
          // If not authenticated, the login button remains visible
          this.loggedin = false;
        }
      })
      .catch((error) => console.error("Check-auth error:", error));
  },
  methods: {
    login() {
      fetchWithRefresh("/login")
        .then((response) => response.json())
        .then((data) => {
          if (data.url) {
            const loginWindow = window.open(
              data.url,
              "_blank",
              "width=500,height=700"
            );

            window.addEventListener("message", (event) => {
              if (event.origin !== window.location.origin) return;

              if (event.data.status === "success") {
                console.log("Login successful!");
                this.loggedin = true;
                this.getProfile(); // Fetch profile data
                this.getMusic(); // Fetch tracks and albums
              } else {
                console.error("Login failed");
              }
            });
          }
        })
        .catch((error) => console.error("Login error:", error));
    },
    getProfile() {
      fetchWithRefresh("/my-profile")
        .then((response) => response.json())
        .then((data) => {
          this.profile = data;
        })
        .catch((err) => console.error(err));
    },
    getMusic() {
      fetchWithRefresh("/tracks")
        .then((response) => response.json())
        .then((data) => {
          if (!data.hasOwnProperty("error")) this.tracks = data;
        })
        .catch((err) => {
          console.error(err);
          this.album = null;
        });

      fetchWithRefresh("/albums")
        .then((response) => response.json())
        .then((data) => {
          if (!data.hasOwnProperty("error")) this.albums = data;
        })
        .catch((err) => {
          console.error(err);
          this.album = null;
        });
    },
    playMusic(albumID, type) {
      const query = "/playMusic?type=" + type + "&id=" + albumID;
      fetchWithRefresh(query)
        .then((response) => response.json())
        .then((data) => {
          if (data.url.length > 1) {
            window.open(data.url, "_blank", "noopener,noreferrer");
          }
        })
        .catch((err) => console.error(err));
    }
  }
});
