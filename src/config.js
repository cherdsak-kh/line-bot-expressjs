require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    lineConfig: {
        channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || 'your_channel_access_token',
        channelSecret: process.env.LINE_CHANNEL_SECRET || 'your_channel_secret',
    },
    ngrokAuthToken: process.env.NGROK_AUTHTOKEN || 'your_ngrok_authtoken_here',
    enableNgrok: process.env.ENABLE_NGROK !== 'false',
    nodeEnv: process.env.NODE_ENV || 'development'
};
