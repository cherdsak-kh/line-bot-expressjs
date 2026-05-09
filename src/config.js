require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    lineConfig: {
        channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || 'your_channel_access_token',
        channelSecret: process.env.LINE_CHANNEL_SECRET || 'your_channel_secret',
    }
};
