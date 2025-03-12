const express = require('express');
const path = require('path');
const request = require('request'); // or axios/fetch if you prefer
const querystring = require('querystring');
const crypto = require('crypto')
require('dotenv').config();

const app = express();

// -- Spotify config (replace with your real values) --
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirect_uri = 'http://127.0.0.1:8080/callback';
var stored_access_token = ''

// 1) Route to initiate Spotify login
app.get('/login', function (req, res) {
	var state = generateRandomString(16);
	var scope =
		'user-read-private user-read-email user-modify-playback-state user-read-playback-state';

	res.redirect(
		'https://accounts.spotify.com/authorize?' +
			querystring.stringify({
				response_type: 'code',
				client_id: client_id,
				scope: scope,
				redirect_uri: redirect_uri,
				state: state,
			})
	);
});

// 2) Callback route for Spotify to redirect back to
app.get('/callback', (req, res) => {
	var code = req.query.code || null;
	var state = req.query.state || null;

	if (state === null) {
		res.redirect(
			'/#' +
				querystring.stringify({
					error: 'state_mismatch',
				})
		);
	} else {
		var authOptions = {
			url: 'https://accounts.spotify.com/api/token',
			form: {
				code: code,
				redirect_uri: redirect_uri,
				grant_type: 'authorization_code',
			},
			headers: {
				'content-type': 'application/x-www-form-urlencoded',
				Authorization:
					'Basic ' + new Buffer.from(client_id + ':' + client_secret).toString('base64'),
			},
			json: true,
		};

		request.post(authOptions, function (error, response, body) {
			if (!error && response.statusCode === 200) {
				// body contains access_token, refresh_token, etc.
				const accessToken = body.access_token;
				const refreshToken = body.refresh_token;

                stored_access_token = accessToken
				// For a production app, store these tokens in a session, DB, etc.
				// This example just logs them.
				console.log('access_token:', accessToken);
				console.log('refresh_token:', refreshToken);

				// Redirect user back to your front-end (index.html) or a "/dashboard" page
				res.redirect('/');
			} else {
				res.redirect(
					'/#' +
						querystring.stringify({
							error: 'invalid_token',
						})
				);
			}
		});
	}
});

// 3) Example API endpoint for fetching user profile from Spotify
//    (server calls Spotify using stored tokens)
app.get('/my-profile', (req, res) => {
	// In a real app, you'd retrieve the access token from session/storage
	// For this demo, assume we have an access token from somewhere:
	const accessToken = stored_access_token; // <-- replace or retrieve properly

	request.get(
		{
			url: 'https://api.spotify.com/v1/me',
			headers: { Authorization: 'Bearer ' + accessToken },
			json: true,
		},
		(error, response, body) => {
			if (!error && response.statusCode === 200) {
				// 'body' has user profile info
				res.json(body);
			} else {
				res.status(400).json({ error: 'Unable to fetch user profile' });
			}
		}
	);
});

app.get('/songs')

// 4) Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// 5) Explicitly serve index.html at the root
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// (Optional) catch-all or other routes can be placed here

// Start the server
app.listen(8080, () => {
	console.log('Server is running on http://localhost:8080');
});

const generateRandomString = (length) => {
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	const values = crypto.getRandomValues(new Uint8Array(length));
	return values.reduce((acc, x) => acc + possible[x % possible.length], '');
};
