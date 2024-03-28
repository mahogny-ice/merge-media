const ffmpeg = require('fluent-ffmpeg');

const mergeAudio = (config) => {
    const { track1, track2, outputDir } = config;

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
            return command;
        })
}

module.exports = mergeAudio;