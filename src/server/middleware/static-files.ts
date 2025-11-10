import Express from 'express';
import path from 'path';
import url from 'url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default Express.static(path.resolve(__dirname, '/public'), {
    immutable: true,
    maxAge: 3600
});
