import path from 'path';
import { getMetadata, updateMetadata } from "../helpers/fileHelper.js";

export default class MetadataController {
    #io

    constructor(io) {
        this.#io = io;
        this.update = this.update.bind(this);
    }

    read(request, response) {
        const filepath = request.query.path;

        getMetadata(filepath).then(metadata => {
            const title = metadata?.format?.tags?.title || 'No title available';
            const filename = path.basename(metadata?.format?.filename) || 'No filename available';
            response.json({ title, filename });
        }).catch(error => {
            response.status(500).send(error.message);
        });
    }

    update(request, response) {
        const { filepath, title } = request.body;

        updateMetadata(filepath, title, this.#io).then(() => {
            response.json({ success: true });
        }).catch(error => {
            response.status(500).send(error.message);
        });
    }
}