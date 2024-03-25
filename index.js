const ffmpeg = require('fluent-ffmpeg');

let track1Url = '/Users/antonklock/Downloads/test/1711013839174.mp3';
let track2Url = '/Users/antonklock/Downloads/test/GANT_SS24_Look_Feel_Maggie_Baer_Take_1_16_LUFS.wav';
let outputDir = '/Users/antonklock/Downloads/test/output/';

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

mergeAudio(track1Url, track2Url, outputDir);