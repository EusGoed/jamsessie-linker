const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { addTrackToPlaylist } = require('./spotify-client');  // Import Spotify functions
const logger = require('./logger');  // Import the logger
require('dotenv').config();

const groupName = process.env.WHATSAPP_GROUP_NAME;

const client = new Client({
    authStrategy: new LocalAuth(), // Use LocalAuth to store session data
    puppeteer: {
        headless: true,
        args: ['--no-sandbox']
    }
});

function extractSpotifyLinks(message) {
    const spotifyRegex = /(https?:\/\/open\.spotify\.com\/track\/[a-zA-Z0-9]+)/g;
    const matches = message.match(spotifyRegex);
    return matches ? matches : [];
}

function setupWhatsAppClient() {
    // Generate QR code for authentication
    client.on('qr', (qr) => {
        qrcode.generate(qr, { small: true });
        logger.info('QR code generated, scan with WhatsApp.');
    });

    client.on('ready', () => {
        logger.info('WhatsApp client is ready.');
    });

    // Listen for all messages (incoming and outgoing)
    client.on('message_create', async (message) => {
        try {
            const chat = await message.getChat();

            if (chat.isGroup && chat.name === groupName) {
                logger.info(`New message received in group: ${chat.name}`);

                const links = extractSpotifyLinks(message.body);
                if (links.length > 0) {
                    logger.info(`Spotify links found: ${links.join(', ')}`);

                    // Add each Spotify link to the playlist
                    for (const link of links) {
                        const trackUri = `spotify:track:${link.split('/track/')[1]}`;
                        logger.info(`Processing Spotify link: ${trackUri}`);
                        await addTrackToPlaylist(trackUri);
                    }
                }
            }
        } catch (err) {
            logger.error(`Error processing message: ${err.message}`);
        }
    });

    client.initialize();
}

module.exports = {
    setupWhatsAppClient
};