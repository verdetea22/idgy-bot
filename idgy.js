const { Client, Intents } = require("discord.js");
const admin = require("firebase-admin");
const { getStorage } = require("firebase-admin/storage");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
require("dotenv").config();

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(
        require("./path/to/serviceAccountKey.json")
    ), // Update with your service account key file path
    storageBucket: "your-bucket-name.appspot.com", // Replace with your Firebase Storage bucket name
});

const db = admin.firestore();
const bucket = getStorage().bucket();

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", async(message) => {
    if (message.author.bot) return;

    if (message.content.startsWith("!upload")) {
        const filePath = "./path/to/your/image.heic"; // Update with your image path
        const convertedFilePath = await convertHeicToJpeg(filePath); // Convert HEIC to JPEG
        const imageUrl = await uploadImageToStorage(convertedFilePath);
        await storeImageUrlInFirestore(imageUrl, "your-image-tag"); // Replace with your image tag or query

        message.channel.send(`Image uploaded and stored successfully: ${imageUrl}`);
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

async function uploadImageToStorage(filePath) {
    const fileName = `${uuidv4()}.jpg`; // Using JPEG as the converted format
    await bucket.upload(filePath, {
        destination: fileName,
        metadata: {
            contentType: "image/jpeg",
        },
    });
    const file = bucket.file(fileName);
    const [url] = await file.getSignedUrl({
        action: "read",
        expires: "03-09-2491", // Set expiration date or use a token
    });
    return url;
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