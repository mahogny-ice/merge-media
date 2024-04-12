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
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
require("dotenv/config");
const express_1 = __importDefault(require("express"));
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
app.post('/mergeaudio', (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Request body", request.body);
    let command;
    const { track1, track2, storageFilename, } = request.body;
    try {
        console.log('Track1.volume: ' + track1.volume);
        console.log('Track2.volume: ' + track2.volume);
        command = (0, fluent_ffmpeg_1.default)()
            .input(track1.url)
            .input(track2.url)
            .complexFilter([
            // @ts-ignore
            { filter: 'amix', inputs: 2 },
        ])
            .format('mp3');
        const filename = storageFilename;
        const file = bucket.file(filename);
        const writeStream = file.createWriteStream({
            resumable: false,
            metadata: {
                contentType: 'audio/mpeg'
            }
        });
        command.pipe(writeStream, { end: true });
        yield new Promise((resolve, reject) => {
            writeStream.on('finish', () => {
                console.log('File uploaded to Cloud Storage successfully!');
                resolve();
            });
            writeStream.on('error', (error) => {
                console.error('Error uploading file to Cloud Storage:', error);
                reject();
            });
        });
        const downloadUrl = yield file.getSignedUrl({
            action: 'read',
            expires: '04-09-2025',
        });
        response.json({ downloadUrl });
    }
    catch (error) {
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
}));
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
