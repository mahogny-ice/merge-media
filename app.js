const ffmpeg = require('fluent-ffmpeg');
const admin = require('firebase-admin');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');


const express = require('express')
const app = express()
const port = 3000
app.use(express.static('public'));
app.use(express.json());

admin.initializeApp({
    credential: admin.credential.cert({
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        databaseURL: process.env.FIREBASE_DATABASE_URL,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID,
        measurementId: process.env.FIREBASE_MEASUREMENT_ID
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
})

const id = uuidv4();

const bucket = admin.storage().bucket();

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.post('/mergeaudio', async (req, res) => {

    const { track1, track2 } = req.body;

    const command = ffmpeg()
        .input(track1)
        .input(track2)
        .complexFilter([
            { filter: 'amix', inputs: 2, duration: 'longest' }
        ])
        .format('mp3')

    const folder = 'merges';
    const filename = `${folder}/${id}.mp3`;
    const file = bucket.file(filename);

    const writeStream = file.createWriteStream({
        resumable: false,
        metadata: {
            contentType: 'audio/mpeg'
        }
    })

    command.pipe(writeStream, { end: true });

    await new Promise((resolve, reject) => {
        writeStream.on('finish', () => {
            console.log('File uploaded to Cloud Storage successfully!');
            resolve();
        });
        writeStream.on('error', (err) => {
            console.error('Error uploading file to Cloud Storage:', err);
            reject();
        });
    });

    const downloadUrl = await file.getSignedUrl({
        action: 'read',
        expires: '04-09-2025'
    });

    res.json({ downloadUrl });

    command.on('error', (err) => {
        console.error('Error merging audio:', err);
    });

    command.on('end', () => {
        console.log('Audio tracks merged successfully!');
    });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})