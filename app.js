const ffmpeg = require('fluent-ffmpeg');

const express = require('express')
const app = express()
const port = 3000

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!')
});

app.post('/mergeaudio', (req, res) => {

    const { track1, track2 } = req.body;

    const command = ffmpeg()
        .input(track1)
        .input(track2)

        .complexFilter([
            { filter: 'amix', inputs: 2, duration: 'longest' }
        ])
        .format('mp3')

    res.set('Content-Type', 'audio/mpeg');
    command.pipe(res, { end: true });

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