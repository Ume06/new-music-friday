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
      // 1) Attempt to open the native Spotify app:
      const appUri = `spotify:${type}:${id}`;
      window.location.href = appUri;

      // 2) After ~1 second, if the app didn’t open,
      //    fallback to the web version in a new tab.
      setTimeout(() => {
        const webUrl = `https://open.spotify.com/${type}/${id}`;
        window.open(webUrl, "_blank");
      }, 1000);
    }
  }
});
