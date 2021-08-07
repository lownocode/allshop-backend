const express = require('express'),
    https = require('https'),
    fs = require('fs'),
    cors = require('cors'),
    bodyParser = require('body-parser'),
    db = require('./db'),
    funcs = require('./functions'),
    os = require('os'),
    config = require('./config.json');
const { createUser, vk } = require('./vk_bot');
const { post } = require('axios');

const key = fs.readFileSync('/etc/letsencrypt/live/localhostov.ru/privkey.pem', 'utf8'),
    cert = fs.readFileSync('/etc/letsencrypt/live/localhostov.ru/fullchain.pem', 'utf8'),
    credentials = {
    key: key,
    cert: cert
};

const PORT = process.env.PORT || 2052;
const prefix = 'shop'

const app = express(credentials);
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
const server = https.createServer(credentials, app);

//---------- API ----------//

app.use(function (req, res, next) {
    if(!req.headers['auth']) {
        return res.json({
            success: false,
            msg: 'bad request data'
        })
    }
    const params = funcs.getUrlVars(req.headers['auth']);
    const check = funcs.validateAppUrl(req.headers['auth']);

    if(!check.status || !params.vk_user_id || !params || params.sign !== check.sign) {
        return res.json({
            success: false,
            msg: 'bad request data'
        });
    }

    next();
});

app.post(`/${prefix}/getUser`, async (req, res) => {
    const params = funcs.getUrlVars(req.headers['auth']);
    const user = await db.query(`SELECT * FROM users where id = ${params.vk_user_id}`);

    if(!user.rows[0]) {
        const newUser = await createUser(params.vk_user_id);
        res.json(newUser);
    } else {
        res.json(user.rows[0]);
    }
});

app.post(`/${prefix}/withdraw`, async (req, res) => {
    const query = req.body;
    const params = funcs.getUrlVars(req.headers['auth']);
    const user = await db.query(`SELECT * FROM users WHERE id = ${params.vk_user_id}`);

    if(query.amount > user.rows[0].balance) {
        return res.json({
            success: false,
            msg: 'Вы указываете сумму больше вашего баланса'
        });
    }

    const { data } = await post(`https://api.vkdonuts.ru/payments/create`, {
        group: config.vk_bot.group_id,
        token: config.vkdonut_key,
        v: 1,
        system: query.system,
        purse: query.wallet,
        amount: query.amount
    })
    .catch(error => {
        vk.api.messages.send({
            chat_id: 1,
            random_id: 0,
            message: `Ошибка при выводе!\nПользователь: @id${params.vk_user_id}\nОшибка: ${error}`
        });
        return res.json({
            success: false,
            msg: 'Ошибка, возможно, Вы вводите что-то неправильно.'
        });
    });
    
    if(!data.success && data.error) {
        return res.json({
            success: false,
            msg: data.error == 3004 ? 'На балансе приложения недостаточно средств для вывода.' : data.msg
        });
    } else {
        await db.query(`UPDATE users SET balance = balance - ${query.amount}, history = array_prepend($1, history) WHERE id = ${params.vk_user_id}`, 
        [
            {
                title: 'Вывод средств',
                date: Date.now(),
                amount: query.amount,
                wallet: query.wallet,
                system: query.system,
                type: 'withdraw'
            }
        ]);
        vk.api.messages.send({
            chat_id: 1, 
            random_id: 0, 
            message: `Вывод средств!\n Пользователь: @id${params.vk_user_id}\n Сумма: ${query.amount}\n Кошелек: ${query.wallet}\n Система: ${query.system}`
        });
        return res.json({
            success: true,
            msg: `Выплата может занимать от нескольких минут до нескольких часов`
        });
    }
});

app.post(`/${prefix}/admin.getOffers`, async (req, res) => {
    const params = funcs.getUrlVars(req.headers['auth']);
    const user = await db.query(`SELECT * FROM users WHERE id = ${params.vk_user_id}`);
    const offers = await db.query(`SELECT * FROM offers`);

    if(!user.rows[0].admin) {
        return res.json({
            success: false,
            msg: 'you are not an administrator'
        });
    } else { 
        return res.json(offers.rows);
    }
});

app.post(`/${prefix}/admin.addProduct`, async (req, res) => {
    const query = req.body;
    const params = funcs.getUrlVars(req.headers['auth']);
    const user = await db.query(`SELECT * FROM users WHERE id = ${params.vk_user_id}`);

    if(!user.rows[0].admin) {
        return res.json({
            success: false,
            msg: 'you are not an administrator'
        });
    } 
    else if(typeof(query.sum) != 'number' || query.sum < 10 || query.sum > 50000) {
        return res.json({
            success: false, 
            msg: 'Некорректно указана сумма'
        });
    }
    else if(query.title.length > 50 || query.description.length > 800 ) {
        return res.json({
            success: false, 
            msg: 'Некорректно указано название, либо описание'
        });
    } else { 
        await db.query(`INSERT INTO products (author_id, demo_link, source, type, sum, description, title) VALUES ($1, $2, $3, $4, $5, $6, $7)`, 
        [
            0, //author_id
            query.demo_link,
            query.source,
            query.type,
            query.sum,
            query.description,
            query.title
        ]);
        return res.json({
            success: true,
            msg: 'Товар добавлен. Ауф!'
        });
    }
});

app.post(`/${prefix}/getProducts`, async (req, res) => {
    const products = await db.query(`SELECT * FROM products`);
    const sortProducts = new Array();

    products.rows.map(product => {
        sortProducts.push({
            author_id: product.author_id,
            title: product.title,
            description: product.description,
            cost: product.sum,
            product_id: product.product_id,
            type: product.type,
            demo_link: product.demo_link
        })
    });

    res.json(sortProducts.reverse());
});

app.post(`/${prefix}/sendSuggest`, async (req, res) => {
    const query = req.body;
    const params = funcs.getUrlVars(req.headers['auth']);
    const user = await db.query(`SELECT * FROM users WHERE id = ${params.vk_user_id}`);

    if(typeof(query.sum) != 'number' || query.sum < 10 || query.sum > 50000) {
        return res.json({
            success: false, 
            msg: 'Некорректно указана сумма'
        });
    }
    else if(query.title.length > 50 || query.description.length > 800 ) {
        return res.json({
            success: false, 
            msg: 'Некорректно указано название, либо описание'
        });
    } 
    else if(!query.source || !query.type || !query.sum || !query.description || !query.title) {
        return res.json({
            success: false, 
            msg: 'Один из параметров отсутствует'
        });
    } else {
        const answerDB = await db.query(`INSERT INTO offers (author_id, demo_link, source, type, sum, description, title) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, 
        [
            user.rows[0].id, //author_id
            query.demo_link,
            query.source,
            query.type,
            query.sum,
            query.description,
            query.title
        ]);
        res.json({
            success: true,
            msg: 'Ожидайте, товар добавлен и проходит проверку'
        });
        vk.api.messages.send({
            chat_id: 1,
            random_id: 0,
            message: `@id${params.vk_user_id} предложил скрипт, параметры:\n\n ${JSON.stringify(req.body)}\n\nОтвет БД:\n${JSON.stringify(answerDB.rows[0])}\n\nЧтобы опубликовать введите Опубликовать <<id предложения>>`
        });
    }
});

app.post(`/${prefix}/admin.getInfo`, async (req, res) => {
    const params = funcs.getUrlVars(req.headers['auth']);
    const user = await db.query(`SELECT * FROM users WHERE id = ${params.vk_user_id}`);

    if(!user.rows[0].admin || !user.rows[0]) {
        return res.json({
            success: false,
            msg: 'you are not an administrator'
        });
    }

    const users = await db.query(`SELECT * FROM users`);

    res.json({
        success: true,
        users_count: users.rows.length,
        loadavg: os.loadavg(),
        mem: {free: os.freemem(), total: os.totalmem()},
        uptime: os.uptime()
    });
});

app.post(`/${prefix}/admin.reloadBackend`, async (req, res) => {
    const params = funcs.getUrlVars(req.headers['auth']);
    const user = await db.query(`SELECT * FROM users WHERE id = ${params.vk_user_id}`);

    if(!user.rows[0].admin || !user.rows[0]) {
        return res.json({
            success: false,
            msg: 'you are not an administrator'
        });
    }

    res.json({
        success: true,
        msg: 'Перезагрузка бекенда...'
    });
    process.exit();
});

app.post(`/${prefix}/activatePromocode`, async (req, res) => {
    const params = funcs.getUrlVars(req.headers['auth']);
    const promo = await db.query(`SELECT * FROM promocodes WHERE promo = '${req.body.promo}'`);
    if(!req.body.promo) {
        return res.json({
            success: false,
            msg: 'Один из параметров отсутствует'
        });
    }
    else if(!promo.rows[0]) {
        return res.json({
            success: false,
            msg: 'Промокода не существует'
        });
    }
    else if(promo.rows[0].used_users.find(x => x.id == params.vk_user_id)) {
        return res.json({
            success: false,
            msg: 'Вы уже активировали данный промокод'
        });
    }
    else if(promo.rows[0].usages < 1) {
        return res.json({
            success: false,
            msg: 'У данного промокода закончились активации'
        });
    }
    db.query(`UPDATE users SET balance = balance + ${promo.rows[0].sum}, history = array_prepend($1, history) WHERE id = '${params.vk_user_id}' RETURNING *`, [
        {
            title: 'Активация промокода',
            date: Date.now(),
            type: 'promocode',
            amount: promo.rows[0].sum
        }
    ]);
    db.query(`UPDATE promocodes SET used_users = array_prepend($1, used_users), usages = usages - 1 WHERE promo = '${promo.rows[0].promo}'`, [
        {
            id: params.vk_user_id
        }
    ]);

    res.json({
        success: true,
        msg: `Промокод активирован. На ваш баланс зачислено ${(promo.rows[0].sum).toLocaleString('ru-RU')} руб.`
    });
});

app.listen(PORT, () => console.log('server started on port ' + PORT));
server.listen(8880, () => console.log('https server created & started'));