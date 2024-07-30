import { exec } from "child_process";
import { config } from "../config.js";
import { mapFileProperties } from "../helpers/fileHelper.js";
import {promises as fs} from 'fs';
import path from "path";

export default class PageController {
    #io

    constructor(io) {
        this.#io = io;
        this.runUpdate = this.runUpdate.bind(this);
    }

    async home(request, response) {
        const directory = request.query.path || config.DIRECTORY;

        try {
            const files = await fs.readdir(directory, { withFileTypes: true });
            const fileDetails = await Promise.all(files.map(mapFileProperties));
            const parentDirectory = path.dirname(directory);

            response.render('index', { files: fileDetails, directory: directory, parentDirectory });
        } catch (err) {
            response.status(500).send('Unable to scan directory: ' + err.message);
        }
    }

    runUpdate(request, response) {
        const dryRun = request.query.dry === 'true' ? ' --dry' : '';
        const updateProcess = exec(config.UPDATE_SCRIPT + dryRun);
    
        updateProcess.stdout.on('data', (data) => {
            this.#io.emit('update-progress', data);
        });
    
        updateProcess.stderr.on('data', (data) => {
            this.#io.emit('update-progress', data);
        });
    
        updateProcess.on('close', (code) => {
            this.#io.emit('update-complete', `Update script finished with code ${code}`);
            response.redirect('/');
        });
    }

}