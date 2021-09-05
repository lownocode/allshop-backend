
import { VK } from "vk-io";
import { HearManager } from "@vk-io/hear";
import axios from 'axios';

import config from "../config.js";
import db from '../DB/pool.js';

import * as commands from "./commands/index.js";

export const vk = new VK({ token: config.bot.token });

const hearManager = new HearManager();

vk.updates.on("message", async (message, next) => {
    if(message.isOutbox) return;
    await next();
});
vk.updates.on("message", hearManager.middleware);

Object.values(commands).forEach(({ RegExp, handler }) => hearManager.hear(RegExp, handler));

const getDonuts = async () => {
    const { data } = await axios.post(`https://api.vkdonuts.ru/donates/get`, {
        group: config.bot.id,
        token: config.vkdonut_key,
        v: 1
    });

    return data.list;
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

export async function createUser(id) {
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

console.log(`vk bot started`);
vk.updates.start();