import fs from 'fs';
import Fastify from 'fastify';
import Https from 'https';
import middie from 'middie';
import cors from 'cors';

import functions from './functions.js';

const prefix = '/shop';
const port = 8880;

const https = Https.createServer({
    key: fs.readFileSync('/etc/letsencrypt/live/localhostov.ru/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/localhostov.ru/fullchain.pem')
});

const fastify = Fastify
({
    logger: true,
    https: https
});

await fastify.register(middie);
fastify.use(cors());

fastify.use((req, res, next) => {
    if(!req.headers.auth) {
        return res.send({
            success: false,
            msg: 'bad request data'
        })
    }

    const params = functions.getUrlVars(req.headers['auth']);
    const check = functions.validateAppUrl(req.headers['auth']);

    if(!check.status || !params.vk_user_id || !params || params.sign !== check.sign) {
        return res.send({
            success: false,
            msg: 'bad request data'
        });
    }

    next();
});

fastify.register(import('./routes/user/getUser.js'), { prefix: prefix });
fastify.register(import('./routes/user/withdraw.js'), { prefix: prefix });
fastify.register(import('./routes/user/getProducts.js'), { prefix: prefix });
fastify.register(import('./routes/user/sendSuggest.js'), { prefix: prefix });
fastify.register(import('./routes/user/activatePromocode.js'), { prefix: prefix });

fastify.register(import('./routes/admin/admin.getOffers.js'), { prefix: prefix });
fastify.register(import('./routes/admin/admin.getInfo.js'), { prefix: prefix });
fastify.register(import('./routes/admin/admin.reloadBackend.js'), { prefix: prefix });
fastify.register(import('./routes/admin/admin.addProduct.js'), { prefix: prefix });

fastify.get('/', async (req, res) => {
    res.send(`Привет, здесь ничего нет!`)
});

fastify.listen(port, '0.0.0.0').catch(console.error);