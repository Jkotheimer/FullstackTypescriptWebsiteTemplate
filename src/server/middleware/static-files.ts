import Express from 'express';
import path from 'path';

export default Express.static(path.resolve(__dirname, '/public'), {
    immutable: true,
    maxAge: 3600
});
