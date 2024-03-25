const ffmpeg = require('fluent-ffmpeg');

const mergeAudio = (track1, track2, outputDir) => {
    ffmpeg()
        .input(track1)
        .input(track2)

        .complexFilter([
            { filter: 'amix', inputs: 2, duration: 'longest' }
        ])
        .output(outputDir + 'merged_audio.mp3')
        .on('error', (err) => {
            console.error('Error during merging:', err);
        })
        .on('end', () => {
            console.log('Audio tracks merged successfully!');
        })
        .run();
}

module.exports = mergeAudio;