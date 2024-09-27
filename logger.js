const winston = require('winston');

// Custom format to display only time (HH:mm:ss)
const timeFormat = winston.format.printf(({ level, message }) => {
    const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });  // 24-hour format
    return `[${currentTime}] ${level.toUpperCase()}: ${message}`;
});

// Set up winston logger
const logger = winston.createLogger({
    level: 'info', // Set the default log level
    format: winston.format.combine(
        timeFormat  // Apply the custom time format
    ),
    transports: [
        new winston.transports.Console(),  // Log to the console
        new winston.transports.File({ filename: 'app.log' }),  // Log to a file
    ],
});

module.exports = logger;  // Export the logger for use in other files