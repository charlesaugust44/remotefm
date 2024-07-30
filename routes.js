import PageController from './controllers/PageController.js';
import FileController from './controllers/FileController.js';
import MetadataController from './controllers/MetadataController.js';

export default function(app, io) {
    const pageController = new PageController(io);
    const fileController = new FileController();
    const metadataController = new MetadataController(io);

    app.get('/', pageController.home);
    app.post('/update', pageController.runUpdate);

    app.get('/delete', fileController.delete);
    app.post('/move', fileController.move);
    app.get('/folders', fileController.folders);

    app.get('/metadata', metadataController.read);
    app.post('/metadata', metadataController.update);
}