new Vue({
	el: '#app',
	data: {
		profile: null,
        tracks: null,
        albums: null,
	},
	methods: {
		login() {
			// This hits the /login route in Express, which redirects to Spotify
			window.location.href = '/login';
		},
		getProfile() {
			fetch('/my-profile')
				.then((response) => response.json())
				.then((data) => {
					this.profile = data;
				})
				.catch((err) => console.error(err));
		},
		getMusic() {
			fetch('/tracks')
				.then((response) => response.json())
				.then((data) => {
					this.tracks = data;
				})
				.catch((err) => console.error(err));

			fetch('/albums')
				.then((response) => response.json())
				.then((data) => {
					this.albums = data;
				})
				.catch((err) => console.error(err));
		},
        playMusic(albumID, type) {
            const query = '/playMusic?type=' + type + '&id=' + albumID
            fetch(query)
                .then((response) => response.json())
                .then((data) => {
                    if(data.url.length > 1) {
                        open(data.url, "_blank", "noopener,noreferrer");
                    }
                })
				.catch((err) => console.error(err));
        },
	},
});
