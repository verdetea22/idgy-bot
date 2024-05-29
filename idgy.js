const { Client, Intents } = require('discord.js');
const mongoose = require('mongoose');
require('dotenv').config();

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content.startsWith('!image')) {
        const query = message.content.slice(7).trim();
        const imageUrl = await getImageFromDatabase(query);
        if (imageUrl) {
            message.channel.send(imageUrl);
        } else {
            message.channel.send('Image not found.');
        }
    }
});

async function getImageFromDatabase(query) {
    // Define your image schema and model
    const imageSchema = new mongoose.Schema({
        tag: String,
        url: String
    });
    const Image = mongoose.model('Image', imageSchema);

    // Query the database
    const result = await Image.findOne({ tag: query });
    return result ? result.url : null;
}

client.login(process.env.DISCORD_TOKEN);
