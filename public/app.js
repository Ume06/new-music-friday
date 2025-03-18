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
