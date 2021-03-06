const ytdl = require('ytdl-core');
const cp = require('child_process');
const readline = require('readline');
const ffmpeg = require('ffmpeg-static');

// compare with itag array given below to select resolution. 1st row is 360p, 2nd is 720p, 3rd is 1080p. 
const resolutions = [
    [18, 134, 396],
    [22, 136, 298, 398],
    [137, 299, 399]
]

// take bitrate and length of video in milliseconds as input and return the size of video in Mb.
function getSize(bitrate, length){
    const size = ((bitrate * 0.000000125 * length)/1000).toFixed(1);
    if (size < 1){
        return String(size * 1000) + ' Kb'
    }
    else
        return String(size) + ' Mb'
};

// take all available formats as input and only return video mp4 format as output
function chooseVideoQuality(format){
    if ( format.mimeType.includes('video/mp4')){
        return format
    }
}

// take all available formats as input and filter only audio formats and return highest available audio quality format 
function chooseAudioQuality(formats){
    const audioFormats = formats.filter( (format) => {
        if ( format.mimeType.includes('audio/mp4')){
            return format
        }
    })
    return audioFormats[audioFormats.length - 1]
}

// create sizeArray for available formats. creates 3 available formats: 360p, 720p, 1080p
function createSizeArray(allFormats){
    const videoSize = [];
    var j = 0;
    var i = 0;

    // compares given itag with the array resolutions and returns itag if it is present in the array.
    while(i < allFormats.length) {
        if (resolutions[j].includes(allFormats[i].itag)){
            const video = allFormats[i];
            const bitrate = video.averageBitrate || video.bitrate;
            const length = video.approxDurationMs;

            const size = {
                itag: allFormats[i].itag, 
                size: getSize(bitrate, length)
            };
            videoSize.push(size);
            ++j;
        }

        if (j == 3){
            break;
        }
        ++i;
    }
    return videoSize
}

// create array to be sent to html page search.js to display available download formats.
function createDataArray(link, info){
    const allFormats = info.formats;

    const filteredFormats = allFormats.filter(chooseVideoQuality);
    
    const videoSize = createSizeArray(filteredFormats);

    const data = {
        image: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url, 
        title: info.videoDetails.title,
        formats: videoSize,
        link: link,
    }

    return data;
}

// takes seperate audio and video streams and merges them together
async function mergeVideoAudio(ref){
    const tracker = {
    start: Date.now(),
    audio: { downloaded: 0, total: Infinity },
    video: { downloaded: 0, total: Infinity },
    merged: { frame: 0, speed: '0x', fps: 0 },
    };

    // Get audio and video streams
    const info = await ytdl.getBasicInfo(ref.link);
    audio_quality = chooseAudioQuality(info.formats)
    console.log(audio_quality.itag)

    // get audio stream using selected format
    const audio = ytdl(ref.link, { quality: audio_quality.itag })
    .on('progress', (_, downloaded, total) => {
        tracker.audio = { downloaded, total };
    });

    // get video stream using selected format
    const video = ytdl(ref.link, { quality: ref.itag})
    .on('progress', (_, downloaded, total) => {
        tracker.video = { downloaded, total };
    });

    // Prepare the progress bar
    let progressbarHandle = null;
    const progressbarInterval = 1000;
    const showProgress = () => {
    readline.cursorTo(process.stdout, 0);
    const toMB = i => (i / 1024 / 1024).toFixed(2);

    process.stdout.write(`Audio  | ${(tracker.audio.downloaded / tracker.audio.total * 100).toFixed(2)}% processed `);
    process.stdout.write(`(${toMB(tracker.audio.downloaded)}MB of ${toMB(tracker.audio.total)}MB).${' '.repeat(10)}\n`);

    process.stdout.write(`Video  | ${(tracker.video.downloaded / tracker.video.total * 100).toFixed(2)}% processed `);
    process.stdout.write(`(${toMB(tracker.video.downloaded)}MB of ${toMB(tracker.video.total)}MB).${' '.repeat(10)}\n`);

    process.stdout.write(`Merged | processing frame ${tracker.merged.frame} `);
    process.stdout.write(`(at ${tracker.merged.fps} fps => ${tracker.merged.speed}).${' '.repeat(10)}\n`);

    process.stdout.write(`running for: ${((Date.now() - tracker.start) / 1000 / 60).toFixed(2)} Minutes.`);
    readline.moveCursor(process.stdout, 0, -3);
    };

    // Start the ffmpeg child process
    const ffmpegProcess = cp.spawn(ffmpeg, [
    // Remove ffmpeg's console spamming
    '-loglevel', '8', '-hide_banner',
    // Redirect/Enable progress messages
    '-progress', 'pipe:3',
    // Set inputs
    '-i', 'pipe:4',
    '-i', 'pipe:5',
    // Map audio & video from streams
    '-map', '0:a',
    '-map', '1:v',
    // Keep encoding
    '-c:v', 'copy',
    // Define output file
    'out.mp4',
    ], {
    windowsHide: true,
    stdio: [
        /* Standard: stdin, stdout, stderr */
        'inherit', 'inherit', 'inherit',
        /* Custom: pipe:3, pipe:4, pipe:5 */
        'pipe', 'pipe', 'pipe',
    ],
    });
    ffmpegProcess.on('close', () => {
    readline.moveCursor(process.stdout, 0, 3);
    console.log('\n');
    console.log('done');
    
    // Cleanup
    clearInterval(progressbarHandle);
    });

    // Link streams
    // FFmpeg creates the transformer streams and we just have to insert / read data
    ffmpegProcess.stdio[3].on('data', chunk => {
    // Start the progress bar
    if (!progressbarHandle) progressbarHandle = setInterval(showProgress, progressbarInterval);
    // Parse the param=value list returned by ffmpeg
    const lines = chunk.toString().trim().split('\n');
    const args = {};
    for (const l of lines) {
        const [key, value] = l.split('=');
        args[key.trim()] = value.trim();
    }
    tracker.merged = args;
    });
    audio.pipe(ffmpegProcess.stdio[4]);
    video.pipe(ffmpegProcess.stdio[5]);
}

module.exports = {mergeVideoAudio, createDataArray};