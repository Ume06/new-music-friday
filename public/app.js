new Vue({
	el: '#app',
	data: {
		profile: null,
		tracks: null,
		albums: null,
		loggedin: false
	},
	methods: {
		login() {
			// This hits the /login route in Express, which redirects to Spotify
			// window.location.href = '/login';
			fetch('/login')
				.then(response => response.json())
				.then(data => {
					if (data.url) {
						const loginWindow = window.open(data.url, "_blank", "width=500,height=700");

						const interval = setInterval(() => {
							if (loginWindow.closed) {
								clearInterval(interval);
								location.reload();
							}
						}, 1000);
					}
				})
				.catch(error => console.error("Login error:", error));

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
					if (data.url.length > 1) {
						window.open(data.url, "_blank", "noopener,noreferrer");
					}
				})
				.catch((err) => console.error(err));
		},
	},
});
