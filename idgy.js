const { Client, Intents } = require("discord.js");
const admin = require("firebase-admin");
require("dotenv").config();

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(
        require("./path/to/serviceAccountKey.json")
    ), // Update with your service account key file path
});

const db = admin.firestore();

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", async(message) => {
    if (message.author.bot) return;

    if (message.content.startsWith("!upload")) {
        // This command assumes that image URLs are already uploaded and stored in Firestore.
        // Update this section if you want to handle image uploads through the bot.
        const filePath = "./path/to/your/image.heic"; // Update with your image path
        const convertedFilePath = await convertHeicToJpeg(filePath); // Convert HEIC to JPEG
        const imageUrl = `gs://your-bucket-name/${convertedFilePath}`; // Adjust this to match your storage setup
        await storeImageUrlInFirestore(imageUrl, "your-image-tag"); // Replace with your image tag or query

        message.channel.send(`Image URL stored successfully: ${imageUrl}`);
    } else if (message.content.startsWith("!image")) {
        const query = message.content.slice(7).trim();
        const imageUrl = await getImageFromFirestore(query);
        if (imageUrl) {
            message.channel.send(imageUrl);
        } else {
            message.channel.send("Image not found.");
        }
    }
});

async function convertHeicToJpeg(filePath) {
    const newFilePath = filePath.replace(".heic", ".jpg");
    await sharp(filePath).toFormat("jpeg").toFile(newFilePath);
    return newFilePath;
}

async function storeImageUrlInFirestore(url, tag) {
    await db.collection("images").add({
        tag: tag,
        url: url,
    });
}

async function getImageFromFirestore(query) {
    const snapshot = await db
        .collection("images")
        .where("tag", "==", query)
        .get();
    if (snapshot.empty) {
        return null;
    }

    const doc = snapshot.docs[0];
    return doc.data().url;
}

client.login(process.env.DISCORD_TOKEN);