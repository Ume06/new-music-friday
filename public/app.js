new Vue({
  el: "#app",
  data: {
    tracks: null,
    albums: null
  },
  mounted() {
    this.getMusic();
  },
  methods: {
    getMusic() {
      fetch("/tracks")
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) this.tracks = data.tracks;
        })
        .catch((err) => console.error(err));

      fetch("/albums")
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) this.albums = data.albums;
        })
        .catch((err) => console.error(err));
    },

    openSpotify(id, type) {
      const appUri = `spotify:${type}:${id}`;
      window.location.href = appUri;
    }
  }
});

if (document.getElementById("manageApp")) {
  new Vue({
    el: "#manageApp",
    data: {
      allTracks: [],
      trackLinks: [],
      allAlbums: [],
      albumLinks: [],
      singleTrack: ""
    },
    mounted() {
      this.loadTracks();
      this.loadAlbums();
    },
    methods: {
      loadTracks() {
        fetch("/tracks")
          .then((res) => res.json())
          .then((data) => {
            if (!data.error) {
              this.allTracks = data.tracks;
              return fetch("/music.json");
            }
            throw new Error("Unable to fetch track data");
          })
          .then((res) => res.json())
          .then((musicData) => {
            const parseSpotifyId = (url) => {
              try {
                const u = new URL(url);
                const segments = u.pathname.split("/");
                if (
                  u.hostname.includes("spotify.com") &&
                  (segments[1] === "track" || segments[1] === "album")
                ) {
                  return segments[2].split("?")[0];
                }
              } catch (err) {
                console.warn("Invalid link:", url);
              }
              return null;
            };

            this.trackLinks = this.allTracks.map((tr) => {
              const match = musicData.music.find(
                (link) => parseSpotifyId(link) === tr.id
              );
              return match || "";
            });
          })
          .catch((error) => console.error(error));
      },
      loadAlbums() {
        fetch("/albums")
          .then((res) => res.json())
          .then((data) => {
            if (!data.error) {
              this.allAlbums = data.albums;
              return fetch("/music.json");
            }
            throw new Error("Unable to fetch album data");
          })
          .then((res) => res.json())
          .then((musicData) => {
            const parseSpotifyId = (url) => {
              try {
                const u = new URL(url);
                const segments = u.pathname.split("/");
                if (
                  u.hostname.includes("spotify.com") &&
                  (segments[1] === "track" || segments[1] === "album")
                ) {
                  return segments[2].split("?")[0];
                }
              } catch (err) {
                console.warn("Invalid link:", url);
              }
              return null;
            };

            this.albumLinks = this.allAlbums.map((al) => {
              const match = musicData.music.find(
                (link) => parseSpotifyId(link) === al.id
              );
              return match || "";
            });
          })
          .catch((error) => console.error(error));
      },
      addSingleTrack() {
        const newTrack = this.singleTrack.trim();
        if (!newTrack) return;

        fetch("/add-track", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({track: newTrack})
        })
          .then((res) => res.json())
          .then(() => {
            this.singleTrack = "";
            this.loadTracks();
            this.loadAlbums();
          })
          .catch((error) => console.error(error));
      },

      removeTrack(originalLink) {
        if (!originalLink) return;

        fetch("/remove-track", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({track: originalLink})
        })
          .then((res) => res.json())
          .then(() => {
            this.loadTracks();
            this.loadAlbums();
          })
          .catch((error) => console.error(error));
      }
    }
  });
}
