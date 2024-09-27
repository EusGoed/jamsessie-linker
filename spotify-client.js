require('dotenv').config();
const SpotifyWebApi = require('spotify-web-api-node');
const logger = require('./logger');  // Import the logger

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

spotifyApi.setRefreshToken(process.env.SPOTIFY_REFRESH_TOKEN);

async function refreshAccessToken() {
    try {
        logger.info('Refreshing Spotify access token...');
        const data = await spotifyApi.refreshAccessToken();
        const accessToken = data.body['access_token'];
        spotifyApi.setAccessToken(accessToken);
        logger.info('Access token refreshed successfully.');
    } catch (err) {
        logger.error(`Error refreshing access token: ${err.message}`);
    }
}

async function addTrackToPlaylist(trackUri) {
    try {
        logger.info(`Attempting to add track: ${trackUri}`);
        await refreshAccessToken();  // Ensure we have a valid access token

        const currentTracks = await getPlaylistTracks();

        if (currentTracks.includes(trackUri)) {
            logger.info(`Track ${trackUri} is already in the playlist, skipping...`);
            return;  // Don't add the track if it's already in the playlist
        }

        await spotifyApi.addTracksToPlaylist(process.env.SPOTIFY_PLAYLIST_ID, [trackUri]);
        logger.info(`Track added to playlist: ${trackUri}`);

        // After adding the track, check if the playlist exceeds the limit
        await managePlaylistSize();
    } catch (err) {
        logger.error(`Error adding track to playlist: ${err.message || 'Unknown error'}`);
        
        // Log full error object for debugging
        if (err.response) {
            logger.error(`Spotify API response error: ${JSON.stringify(err.response.data, null, 2)}`);
        } else {
            logger.error(`Full error object: ${JSON.stringify(err, null, 2)}`);
        }

        // Log the request config if available (for debugging issues with the request)
        if (err.config) {
            logger.error(`Request config: ${JSON.stringify(err.config, null, 2)}`);
        }
    }
}

async function getPlaylistTracks() {
    const totalLimit = parseInt(process.env.SPOTIFY_LIMIT, 10);
    const limitPerRequest = 100;  // Maximum allowed tracks per request by Spotify
    let offset = 0;
    let allTracks = [];

    while (offset < totalLimit) {
        // Calculate the remaining tracks to request (either 100 or fewer if close to the total limit)
        const fetchLimit = Math.min(limitPerRequest, totalLimit - offset);

        // Fetch tracks from Spotify with the current limit and offset
        const playlistData = await spotifyApi.getPlaylistTracks(process.env.SPOTIFY_PLAYLIST_ID, {
            fields: 'items(track(uri), added_at)',
            limit: fetchLimit,
            offset: offset,
        });

        // Add the fetched tracks to the total list
        allTracks = allTracks.concat(playlistData.body.items.map(item => item.track.uri));

        // Update the offset for the next request
        offset += fetchLimit;

        // Break the loop if the number of tracks fetched is less than 100, meaning the playlist has no more tracks
        if (playlistData.body.items.length < limitPerRequest) {
            break;
        }
    }

    return allTracks;
}

async function managePlaylistSize() {
    try {
        const playlistLimit = process.env.SPOTIFY_LIMIT;
        logger.info(`Checking playlist size with limit: ${playlistLimit}`);

        const data = await getPlaylistTracks();

        const tracks = data.body.items;
        logger.info(`Playlist currently has ${tracks.length} tracks`);


        if (tracks.length > playlistLimit) {
            logger.info('Playlist exceeds limit, removing oldest track...');
            // Sort tracks by `added_at` (oldest first)
            tracks.sort((a, b) => new Date(a.added_at) - new Date(b.added_at));

            const oldestTrackUri = tracks[0].track.uri;
            logger.info(`Removing oldest track: ${oldestTrackUri}`);

            await spotifyApi.removeTracksFromPlaylist(process.env.SPOTIFY_PLAYLIST_ID, [
                { uri: oldestTrackUri },
            ]);
            logger.info(`Removed track: ${oldestTrackUri}`);
        }
    } catch (err) {
        logger.error(`Error managing playlist size: ${err.message}`);
    }
}

module.exports = {
    addTrackToPlaylist,
};