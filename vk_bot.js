const config = require('./config.json');
const db = require('./db');
const axios = require('axios');

const { VK, Keyboard } = require('vk-io'),
    { HearManager } = require('@vk-io/hear'),
    bot = new HearManager(),
    vk = new VK({
    token: config.vk_bot.token,
    pollingGroupId: config.vk_bot.group_id
});

vk.updates.on('message_new', bot.middleware);

bot.hear(/^(?:eval||!)\s(.*)$/i, async msg => {
    if(msg.senderId != 590452995) return;
    try {
        const result = eval(msg.$match[1]);
        if(typeof(result) == 'object') {
            const [res] = await Promise.all([result]);
            msg.send(JSON.stringify(res))
        } else { 
            msg.send(`result:\n${result}`);
        }
    } catch (e) {
        msg.send(`error:\n${e}`);
    }
});

async function getDonuts() {
    const { data } = await axios.post(`https://api.vkdonuts.ru/donates/get`, {
        group: config.vk_bot.group_id,
        token: config.vkdonut_key,
        v: 1
    });
    return data.list;
};

async function getAdminInfo() {
    const users = await db.query(`SELECT * FROM users`);
    const offers = await db.query(`SELECT * FROM offers`);
    const products = await db.query(`SELECT * FROM products`);

    const data = {
        users: users.rows.length,
        offers: offers.rows.length,
        products: products.rows.length
    };

    return data; 
};

setInterval(async() => {
    const [donuts] = await Promise.all([getDonuts()]);

    donuts.map(async donut => {
        const payment = await db.query(`SELECT * FROM donuts WHERE payment_id = ${Number(donut.id)}`);

        if(!payment.rows[0]) {
            await db.query(`INSERT INTO donuts (user_id, payment_id, amount) VALUES ($1, $2, $3)`, [
                donut.user,
                donut.id,
                donut.amount
            ]);
            
            await db.query(`UPDATE users SET balance = balance + ${donut.amount}, history = array_prepend($1, history) WHERE id = ${donut.user}`,
            [
                {
                    title: 'Пополнение баланса',
                    type: 'replenish',
                    date: Date.now(),
                    amount: donut.amount
                }
            ]);
            vk.api.messages.send({
                chat_id: 1,
                random_id: 0,
                message: `Новый донат!\nПользователь: @id${donut.user}\nСумма: ${donut.amount} руб\nАйди платежа: ${donut.id}`
            });
        } else {
            return;
        }
    });
}, 15000);

bot.hear(/^(?:Предложение)\s([0-9]+)$/i, async msg => {
    const user = await DB.findOneUser(msg.senderId);
    if(!user.admin) return;

    const offer = await db.query(`SELECT * FROM offers WHERE offer_id = ${msg.$match[1]}`);
    if(!offer.rows[0]) {
        return msg.send(`Данного предложения не существует`)
    } else {
        return msg.send(JSON.stringify(offer.rows[0]))
    }
});

bot.hear(/^(?:опубликовать)\s([0-9]+)$/i, async msg => {
    const user = await DB.findOneUser(msg.senderId);
    if(!user.admin) return;

    const offer = await db.query(`SELECT * FROM offers WHERE offer_id = ${msg.$match[1]}`);
    if(!offer.rows[0]) {
        return msg.send(`Данного предложения не существует`)
    } else {
        await db.query(`DELETE FROM offers WHERE offer_id = ${msg.$match[1]}`);
        await db.query(`INSERT INTO products (author_id, demo_link, source, type, sum, description, title) VALUES ($1, $2, $3, $4, $5, $6, $7)`, 
        [
            offer.rows[0].author_id, //author_id
            offer.rows[0].demo_link,
            offer.rows[0].source,
            offer.rows[0].type,
            offer.rows[0].sum,
            offer.rows[0].description,
            offer.rows[0].title
        ]);
        return msg.send(`Товар опубликован`);
    }
});

bot.hear(/^(?:Статистика||stat)$/i, async msg => {
    const user = await DB.findOneUser(msg.senderId);
    const adminData = await getAdminInfo();
    const { data } = await axios.post(`https://api.vkdonuts.ru/balance`, {
        token: config.vkdonut_key,
        group: config.vk_bot.group_id,
        v: 1
    });

    if(!user) {
        createUser(msg.senderId);
    } else if(!user.admin) {
        msg.send(`Вы не администратор`)
    } else {
        msg.send(`
Всего пользователей: ${adminData.users}
Предложенных скриптов: ${adminData.offers}
Всего скриптов в маркете: ${adminData.products}
Баланс пончика: ${(data.balance / 100).toFixed(2)} руб

Чтобы посмотреть предложенный скрипт введите <<Предложения [айди предложения]>>
        `)
    }
});

bot.hear(/^(?:рл||rl)$/i, async msg => {
    const user = await DB.findOneUser(msg.senderId);
    if(!user.admin) return;
    await msg.send(`Reloading...`);
    await process.exit();
});

bot.hear(/^(?:создать промокод)\s([0-9]+)\s([0-9]+)$/i, async msg => {
    const user = await DB.findOneUser(msg.senderId);
    if(!user.admin) return;
    else if(!msg.$match[1] || !msg.$match[2]) {
        return msg.send(`Использование: создать промокод <<сумма>> <<кол-во активаций>>`);
    }
    const promo = await createPromo(msg.$match[1], msg.$match[2]);
    if(promo.error) {
        return msg.send(JSON.stringify(promo.error)) 
    } else {
        msg.send(`Промокод создан\n\n${JSON.stringify(promo.rows[0])}`);
        msg.send(promo.rows[0].promo)
    }
});

bot.hear(/^(?:промо||промокод)\s(.*)$/i, async msg => {
    const promo = await db.query(`SELECT * FROM promocodes WHERE promo = '${msg.$match[1]}'`);
    if(!promo.rows[0] || promo.error) {
        return msg.send(`Промокод не найден`);
    }
    else if(promo.rows[0].used_users.find(x => x.id == msg.senderId)) {
        return msg.send(`Вы уже активировали данный промокод`);
    }
    else if(promo.rows[0].usages < 1) {
        return msg.send(`У данного промокода закончились активации`)
    }

    const user = await db.query(`UPDATE users SET balance = balance + ${promo.rows[0].sum}, history = array_prepend($1, history) WHERE id = '${msg.senderId}' RETURNING *`, [
        {
            title: 'Активация промокода',
            date: Date.now(),
            type: 'promocode',
            amount: promo.rows[0].sum
        }
    ]);
    db.query(`UPDATE promocodes SET used_users = array_prepend($1, used_users), usages = usages - 1 WHERE promo = '${msg.$match[1]}'`, [
        {
            id: msg.senderId
        }
    ]);
    msg.send(`Промокод активирован.\nНа ваш баланс зачислено ${promo.rows[0].sum} руб.\nТеперь ваш баланс составляет ${user.rows[0].balance} руб.`)
});

async function createUser(id) {
    const user = await vk.api.users.get({ user_ids: id });
    const newUser = await db.query(
        `INSERT INTO users 
        (id, purchases, balance, admin, history) 
        values ($1, $2, $3, $4, $5) RETURNING *`, 
    [
        id, 
        [], //purchases
        0, //balance
        false,
        [{title: 'Регистрация', date: Date.now(), type: 'registration'}]
    ]);

    console.log(`[NEW USER] ${user[0].first_name} ${user[0].last_name} (@id${id})`);
    vk.api.messages.send({
        chat_id: 1, 
        random_id: 0, 
        message: `[NEW USER] ${user[0].first_name} ${user[0].last_name} (@id${id})`
    });

    return newUser.rows[0];
};

function getRandomString(length) {
    let str = "";
    const possible = "QWERTYUIOPASDFGHJKLZXCVBNM1234567890";

    for(i = 0; i < length; i++) {
        str += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return str;
};

async function createPromo(sum, usages) {
    const promo = getRandomString(4) + '-' + getRandomString(4) + '-' + getRandomString(4) + '-' + getRandomString(4);
    const newPromo = await db.query(
        `INSERT INTO promocodes 
        (sum, usages, used_users, promo) 
        values ($1, $2, $3, $4) RETURNING *`, 
    [
        sum,
        usages,
        [],
        promo
    ]);
    return newPromo;
};

vk.updates.start().catch(console.error);
console.log('vk bot started');

const DB = {
    findOneUser: async(user_id) => {
        const user = await db.query(`SELECT * FROM users where id = ${user_id}`);
        return user.rows[0];
    }
};

module.exports = {
    createUser: createUser,
    vk: vk
};