const ffmpeg = require('fluent-ffmpeg');

const express = require('express')
const app = express()
const port = 3000

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!')
});

app.post('/mergeaudio', (req, res) => {

    const { track1, track2, outputDir } = req.body;

    const command = ffmpeg()
        .input(track1)
        .input(track2)

        .complexFilter([
            { filter: 'amix', inputs: 2, duration: 'longest' }
        ])
        .mergeToFile('/tmp/merged_output.mp3', '/tmp')
        .format('mp3')
        .on('error', (err) => {
            console.error('Error during merging:', err);
        })
        .on('end', () => {
            console.log('Audio tracks merged successfully!');
        })

    res.set('Content-Type', 'audio/mpeg');
    command.pipe(res, { end: true });

    command.on('error', (err) => {
        console.error('Error merging audio:', err);
        res.status(500).send('Error merging audio');
    });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})