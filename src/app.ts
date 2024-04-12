import ffmpeg from 'fluent-ffmpeg';
import admin from 'firebase-admin';
import "dotenv/config";
import express from 'express';

const app = express();
const port = 3000;
app.use(express.static('public'));
app.use(express.json());

admin.initializeApp({
    credential: admin.credential.cert({
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        projectId: process.env.FIREBASE_PROJECT_ID,
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

const bucket = admin.storage().bucket();

app.get('/', (request, response) => {
    response.sendFile(__dirname + '/public/index.html');
});

interface RequestBody {
    track1: Track;
    track2: Track;
    storageFilename: string;
}

type Track = {
    url: string;
    offset: number;
    volume: number;
}

app.post('/mergeaudio', async (request, response) => {
    console.log("Request body", request.body);
    let command: ffmpeg.FfmpegCommand;
    const {
        track1,
        track2,
        storageFilename,
    } = request.body as RequestBody;

    try {
        console.log('Track1.volume: ' + track1.volume);
        console.log('Track2.volume: ' + track2.volume);

        command = ffmpeg()
            .input(track1.url)
            .input(track2.url)
            .complexFilter([
                // @ts-ignore
                { filter: 'amix', inputs: 2 },
            ])
            .format('mp3')


        const filename = storageFilename;
        const file = bucket.file(filename);

        const writeStream = file.createWriteStream({
            resumable: false,
            metadata: {
                contentType: 'audio/mpeg'
            }
        })

        command.pipe(writeStream, { end: true });

        await new Promise<void>((resolve, reject) => {
            writeStream.on('finish', () => {
                console.log('File uploaded to Cloud Storage successfully!');
                resolve();
            });
            writeStream.on('error', (error) => {
                console.error('Error uploading file to Cloud Storage:', error);
                reject();
            });
        });

        const downloadUrl = await file.getSignedUrl({
            action: 'read',
            expires: '04-09-2025',
        });

        response.json({ downloadUrl });

    } catch (error) {
        console.error('Error merging audio:', error);
        response.send("Error merging audio");
        return;
    }




    command.on('error', (error) => {
        console.error('Error merging audio:', error);
        response.send("Error merging audio");
        return;
    });

    command.on('end', () => {
        console.log('Audio tracks merged successfully!');
    });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})