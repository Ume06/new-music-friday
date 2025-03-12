new Vue({
	el: '#app',
	data: {
		profile: null,
	},
	methods: {
		login() {
			// This hits the /login route in Express, which redirects to Spotify
			window.location.href = '/login';
		},
		getProfile() {
			// Our Express route that returns user profile from Spotify
			fetch('/my-profile')
				.then((response) => response.json())
				.then((data) => {
					this.profile = data;
                    console.log(data)
				})
				.catch((err) => console.error(err));
		},
        getSongs() {
            fetch('/songs')
                .then((response) => response.json())
                .then((data) => {
                    this.albums = data;
                    console.log(data)
                })
        }
	},
});
