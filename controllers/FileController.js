import { promises as fs } from 'fs';
import path from 'path';
import { deletePath } from '../helpers/fileHelper.js';

export default class FileController {

    delete(request, response) {
        const filepath = request.query.path;
        const redirectTo = `/?path=${path.dirname(filepath)}`;

        deletePath(filepath).then(() => {
            response.redirect(redirectTo);
        }).catch(error => {
            response.status(500).send(error.message);
        });
    }

    move(request, response) {
        const { oldPath, newPath } = request.body;

        fs.rename(oldPath, newPath).then(() => {
            response.json({ success: true });
        }).catch(error => {
            response.status(500).json({ success: false, message: error.message });
        });
    }

    folders(request, response) {
        const currentPath = request.query.path;

        fs.readdir(currentPath, { withFileTypes: true }).then(files => {
            const folders = files
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);
            response.json(folders);
        }).catch(error => {
            response.status(500).send(error.message);
        });
    }
}