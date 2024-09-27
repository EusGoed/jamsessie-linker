const express = require('express');
const limitManager = require('./limit-manager'); 
const { setupWhatsAppClient } = require('./whatsapp'); 

const app = express();

// Route to update the playlist limit using a query parameter (?size=100)
app.get('/update-limit', (req, res) => {
    const { size } = req.query;

    if (!size || isNaN(size)) {
        return res.status(400).json({ error: 'Invalid size parameter' });
    }

    limitManager.updatePlaylistLimit(parseInt(size, 10));

    res.json({ success: true, message: `Playlist limit updated to ${limitManager.getPlaylistLimit()}` });
});

app.listen(8888, () => {
    console.log('Server is running on http://localhost:8888');
});

setupWhatsAppClient();