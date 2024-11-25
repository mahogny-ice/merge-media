import { spawn } from 'child_process';
import express from 'express';
import admin from 'firebase-admin';
import fs from 'fs';
import "dotenv/config";

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
    jobId: string;
    track1: Track;
    track2: Track;
}

type Track = {
    url: string;
    offset: number;
    volume: number;
}

app.get('/wakeup', (request, response) => {
    console.log('Wakeup answered. Ready to merge...');
    response.send('Ready to merge...');
});

app.post('/mergeaudio', async (request, response) => {
    const {
        jobId,
        track1,
        track2,
    } = request.body as RequestBody;

    const outputFilePath = `/tmp/${jobId}.mp3`;

    const filtersTrack1 = `volume=${track1.volume},adelay=${track1.offset}|${track1.offset}`;
    const filtersTrack2 = `volume=${track2.volume},adelay=${track2.offset}|${track2.offset}`;
    const complexFilter = `"[0:a]${filtersTrack1}[a0];[1:a]${filtersTrack2}[a1];[a0][a1]amix=inputs=2"`;
    const ffmpegCommand = `ffmpeg -nostdin -i "${track1.url}" -i "${track2.url}" -filter_complex ${complexFilter} -ac 2 -f mp3 ${outputFilePath}`
    const ffmpegProcess = spawn(ffmpegCommand, { shell: true });

    ffmpegProcess
        .on('exit', (code: any) => {
            if (code !== 0) {
                console.error('Error merging audio:', code);
                response.send("Error merging audio");
            } else {
                // TODO: Update destination to a proper path | Jira (SN-96)
                const destination = `mergedAudio/${jobId}.mp3`;

                bucket.upload(outputFilePath, { destination })
                    .then(async () => {
                        console.log('Merged audio successfully uploaded to Firebase Storage!');
                        fs.unlinkSync(outputFilePath);

                        const file = bucket.file(destination);
                        const downloadUrl = await file.getSignedUrl({
                            action: 'read',
                            expires: '03-09-2491'
                        });

                        response.json({ url: downloadUrl });
                    })
                    .catch((error) => {
                        console.error('Error uploading merged audio to Firebase Storage:', error);
                        response.send("Error uploading merged audio to Firebase Storage");
                    });
            }
        });
});

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})