require('dotenv').config();
const express = require('express');
const request = require('request');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');
const app = express();

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:8888/callback';

// Direct user to Spotify authorization page
app.get('/login', (req, res) => {
    const scopes = 'user-read-private user-read-email playlist-modify-public playlist-modify-private';
    const auth_query_params = querystring.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scopes,
        redirect_uri: redirect_uri
    });
    res.redirect(`https://accounts.spotify.com/authorize?${auth_query_params}`);
});

// Handle callback and get authorization code
app.get('/callback', (req, res) => {
    const code = req.query.code || null;
    
    const authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
            code: code,
            redirect_uri: redirect_uri,
            grant_type: 'authorization_code'
        },
        headers: {
            'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
        },
        json: true
    };

    request.post(authOptions, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            const access_token = body.access_token;
            const refresh_token = body.refresh_token;

            console.log('Access Token:', access_token);
            console.log('Refresh Token:', refresh_token);

            saveRefreshToken(refresh_token);

            res.send(`New refresh token obtained and saved. You can close this window.`);
        } else {
            res.send('Error occurred while retrieving tokens');
        }
    });
});

app.listen(8888, () => {
    console.log('Auth server running on http://localhost:8888');
});

function saveRefreshToken(refresh_token) {
    const envFilePath = path.resolve(__dirname, '.env');
    let envContent = fs.readFileSync(envFilePath, 'utf8');
    
    envContent = envContent.replace(/SPOTIFY_REFRESH_TOKEN=.*/g, `SPOTIFY_REFRESH_TOKEN=${refresh_token}`);
    
    fs.writeFileSync(envFilePath, envContent, 'utf8');
}