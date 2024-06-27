"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const express_1 = __importDefault(require("express"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const fs_1 = __importDefault(require("fs"));
require("dotenv/config");
const app = (0, express_1.default)();
const port = 3000;
app.use(express_1.default.static('public'));
app.use(express_1.default.json());
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert({
        privateKey: (_a = process.env.FIREBASE_PRIVATE_KEY) === null || _a === void 0 ? void 0 : _a.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        projectId: process.env.FIREBASE_PROJECT_ID,
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});
const bucket = firebase_admin_1.default.storage().bucket();
app.get('/', (request, response) => {
    response.sendFile(__dirname + '/public/index.html');
});
app.get('/wakeup', (request, response) => {
    response.send('Ready to merge...');
});
app.post('/mergeaudio', (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const { jobId, track1, track2, } = request.body;
    const outputFilePath = '/tmp/output.mp3';
    const filtersTrack1 = `volume=${track1.volume},adelay=${track1.offset}|${track1.offset}`;
    const filtersTrack2 = `volume=${track2.volume},adelay=${track2.offset}|${track2.offset}`;
    const complexFilter = `"[0:a]${filtersTrack1}[a0];[1:a]${filtersTrack2}[a1];[a0][a1]amix=inputs=2"`;
    const ffmpegCommand = `ffmpeg -nostdin -i "${track1.url}" -i "${track2.url}" -filter_complex ${complexFilter} -ac 2 -f mp3 ${outputFilePath}`;
    const ffmpegProcess = (0, child_process_1.spawn)(ffmpegCommand, { shell: true });
    ffmpegProcess
        .on('exit', (code) => {
        if (code !== 0) {
            console.error('Error merging audio:', code);
            response.send("Error merging audio");
            return;
        }
        else {
            // TODO: Update destination to a proper path
            const destination = `mergedAudio/${jobId}.mp3`;
            bucket.upload(outputFilePath, { destination })
                .then(() => __awaiter(void 0, void 0, void 0, function* () {
                console.log('Merged audio successfully uploaded to Firebase Storage!');
                fs_1.default.unlinkSync(outputFilePath);
                const file = bucket.file(destination);
                const downloadUrl = yield file.getSignedUrl({
                    action: 'read',
                    expires: '03-09-2491'
                });
                response.json({ downloadUrl });
                return;
            }))
                .catch((error) => {
                console.error('Error uploading merged audio to Firebase Storage:', error);
                response.send("Error uploading merged audio to Firebase Storage");
                return;
            });
        }
    });
}));
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
