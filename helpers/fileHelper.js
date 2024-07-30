import { promises as fs } from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { config } from '../config.js';
import { spawn } from 'child_process';

const getFileIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
            return 'bi-file-earmark-image';
        case 'mp4':
        case 'mkv':
        case 'webm':
            return 'bi-file-earmark-play';
        case 'txt':
        case 'md':
        case 'json':
        case 'xml':
            return 'bi-file-earmark-text';
        default:
            return 'bi-file-earmark';
    }
};

async function mapFileProperties(file) {
    const fullPath = path.join(file.path, file.name);
    const stats = await fs.lstat(fullPath);
    const isDirectory = stats.isDirectory() || (stats.isSymbolicLink() && (await fs.stat(fullPath)).isDirectory());

    return {
        name: file.name,
        isDirectory: isDirectory,
        path: fullPath,
        icon: file.isDirectory() ? 'bi-folder' : getFileIcon(file.name)
    };
}

async function isDirectory(path) {
    try {
        const stats = await fs.lstat(path);
        if (stats.isDirectory() || (stats.isSymbolicLink() && (await fs.stat(path)).isDirectory())) {
            return true;
        }

        return false
    } catch (error) {
        return null;
    }
}

function getMetadata(filePath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

function updateMetadata(filepath, title, io) {
    const tempFilepath = `${filepath}_temp.mp4`;

    // Replace spaces in title with dots for ffmpeg compatibility
    const formattedTitle = title.replace(/ /g, '.');

    // Build the ffmpeg command
    const command = 'ffmpeg';
    const args = [
        '-i', filepath,
        '-metadata', `title=${formattedTitle}`,
        '-codec', 'copy',
        tempFilepath
    ];

    return new Promise((resolve, reject) => {
        const ffmpegProcess = spawn(command, args);

        ffmpegProcess.stdout.on('data', (data) => {
            const progress = data.toString();
            console.log('Progress:', progress);
        });

        ffmpegProcess.stderr.on('data', (data) => {
            const progress = data.toString();
            console.log('Error:', progress);
            io.emit('update-progress', progress);
        });

        ffmpegProcess.on('close', (code) => {
            if (code === 0) {
                fs.rename(tempFilepath, filepath)
                    .then(() => {
                        io.emit('update-progress', 'Complete');
                        resolve();
                    }).catch(reject);
            } else {
                reject({ 'update-progress': `ffmpeg process exited with code ${code}` });
            }
        });

        ffmpegProcess.on('error', (error) => {
            reject({ 'update-progress': `Failed to start ffmpeg process: ${error.message}` });
        });
    });
}

function updateMetadata2(filepath, title) {
    let tempFilepath = `${filepath}_temp.mp4`;

    filepath = filepath.replaceAll(' ', "\\ ");
    tempFilepath = tempFilepath.replaceAll(' ', "\\ ");
    title = title.replaceAll(' ', '.');

    return new Promise((resolve, reject) => {
        const ffmpegCommand = ffmpeg(filepath)
            .outputOptions([`-metadata`, `title=${title}`, 'codec', 'copy'])
            .on('end', async () => {
                fs.rename(tempFilepath, filepath).then(resolve).catch(reject)
            }).on('progress', (progress) => {
                resolve({ 'update-progress': `Processing: ${progress.percent}%` });
            }).on('error', (error) => {
                resolve({ 'update-progress': `Error: ${error.message}` });
            }).on('start', (cmdLine) => {
                console.log('FFmpeg command line:', cmdLine);
            });

        ffmpegCommand.save(tempFilepath);
    });
}

function deletePath(path) {
    if (isDirectory(path)) {
        return fs.rm(path, { recursive: true, force: true });
    }

    return fs.unlink(path);
}

export { mapFileProperties, isDirectory, getMetadata, updateMetadata, deletePath };