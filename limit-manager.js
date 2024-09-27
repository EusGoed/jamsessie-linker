const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Default playlist limit
let PLAYLIST_LIMIT = process.env.SPOTIFY_LIMIT;

function getPlaylistLimit() {
    return PLAYLIST_LIMIT;
}

function updatePlaylistLimit(newLimit) {
    playlistLimit = newLimit;
    console.log(`Playlist limit updated to: ${playlistLimit}`);

    updateEnvLimit(playlistLimit);
}

// Function to update the limit in the .env file
function updateEnvLimit(newLimit) {
    const envPath = path.resolve(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    if (envContent.includes('SPOTIFY_LIMIT')) {
        envContent = envContent.replace(/SPOTIFY_LIMIT=.*/, `SPOTIFY_LIMIT=${newLimit}`);
    } else {
        envContent += `\nSPOTIFY_LIMIT=${newLimit}`;
    }

    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log(`Persisted new playlist limit to .env: ${newLimit}`);
}

module.exports = {
    getPlaylistLimit,
    updatePlaylistLimit,
};