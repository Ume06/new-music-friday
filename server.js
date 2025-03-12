const express = require('express');
const path = require('path');
const request = require('request'); // or axios/fetch if you prefer
const querystring = require('querystring');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const port = 8080;

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirectUri = process.env.REDIRECT_URI;
var storedAccessToken;
var storedRefreshToken;

app.get('/login', (req, res) => {
	var state = generateRandomString(16);
	var scope =
		'user-read-private user-read-email user-modify-playback-state user-read-playback-state';

	res.redirect(
		'https://accounts.spotify.com/authorize?' +
			querystring.stringify({
				response_type: 'code',
				client_id: clientId,
				scope: scope,
				redirect_uri: redirectUri,
				state: state,
			})
	);
});

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
				redirect_uri: redirectUri,
				grant_type: 'authorization_code',
			},
			headers: {
				'content-type': 'application/x-www-form-urlencoded',
				Authorization: 'Basic ' + new Buffer.from(clientId + ':' + clientSecret).toString('base64'),
			},
			json: true,
		};

		request.post(authOptions, function (error, response, body) {
			if (!error && response.statusCode === 200) {
				const accessToken = body.access_token;
				const refreshToken = body.refresh_token;

				storedAccessToken = accessToken;
				storedRefreshToken = refreshToken;
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

app.get('/my-profile', (req, res) => {
	options = {
		url: 'https://api.spotify.com/v1/me',
		headers: { Authorization: 'Bearer ' + storedAccessToken },
		json: true,
	};
	request.get(options, (error, response, body) => {
		if (!error && response.statusCode === 200) {
			res.json(body);
		} else {
			res.status(400).json({ error: 'Unable to fetch user profile' });
		}
	});
});

app.get('/songs', (req, res) => {
    options = {
        url: '',
        headers: { Authorization: 'Bearer' + storedAccessToken },
        body: {},
        json: true
    }
    request.get(options, (error, response, body) => {
        if (!error && response.statusCode === 200) {
			res.json(body);
		} else {
			res.status(400).json({ error: 'Unable to fetch user profile' });
		}
    })
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
	console.log(`Server is running on ${redirectUri}:${port}`);
});

const generateRandomString = (length) => {
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	const values = crypto.getRandomValues(new Uint8Array(length));
	return values.reduce((acc, x) => acc + possible[x % possible.length], '');
};
