import { createServer } from 'http';
import { Server as IoServer } from 'socket.io';
import e from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes.js';
import { config } from './config.js';

const app = e();
const server = createServer(app);
const io = new IoServer(server);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(e.json());
app.use(e.urlencoded({ extended: true }));
app.use(e.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

routes(app, io);

server.listen(config.port, () => {
    console.log('Server running on port ' + config.port);
});
