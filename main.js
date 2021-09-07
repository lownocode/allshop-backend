import fs from 'fs';
import Fastify from 'fastify';
import Https from 'https';
import middie from 'middie';
import cors from 'cors';

import './bot/main.js'

import { getUrlVars } from './functions/getUrlVars.js';
import { validateAppUrl } from './functions/validateAppUrl.js';

const domain = 'all-shop.localhostov.ru';
const port = 444;

const https = Https.createServer({
    key: fs.readFileSync('/etc/letsencrypt/live/all-shop.localhostov.ru/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/all-shop.localhostov.ru/fullchain.pem')
});

const fastify = Fastify({
    logger: true,
    https: https
});

await fastify.register(middie);
fastify.use(cors());

fastify.addHook('onRequest', async (req, res) => {
    if(req.hostname !== domain + ':' + port) return;

    if(!req.headers.auth) {
        return res.send({
            success: false,
            msg: 'bad request data'
        })
    }

    const params = getUrlVars(req.headers['auth']);
    const check = validateAppUrl(req.headers['auth']);

    if(!check.status || !params.vk_user_id || !params || params.sign !== check.sign) {
        return res.send({
            success: false,
            msg: 'bad request data'
        });
    }
});

fastify.register(import('./routes/user/getUser.js'));
fastify.register(import('./routes/user/withdraw.js'));
fastify.register(import('./routes/user/getProducts.js'));
fastify.register(import('./routes/user/sendSuggest.js'));
fastify.register(import('./routes/user/activatePromocode.js'));

fastify.register(import('./routes/admin/admin.getOffers.js'));
fastify.register(import('./routes/admin/admin.getInfo.js'));
fastify.register(import('./routes/admin/admin.reloadBackend.js'));
fastify.register(import('./routes/admin/admin.addProduct.js'));

fastify.get('/', async (req, res) => {
    res.send(`Привет, здесь ничего нет!`)
});

fastify.listen(port, '0.0.0.0').catch(console.error);