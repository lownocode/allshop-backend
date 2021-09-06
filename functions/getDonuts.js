import { vk } from "../bot/main.js";
import db from "../DB/pool.js" ;
import config from "../config.js";

import axios from "axios";

export const getDonuts = async () => {
    const { data } = await axios.post(`https://api.vkdonuts.ru/donates/get`, {
        group: config.bot.id,
        token: config.vkdonut_key,
        v: 1
    });

    data.list.map(async payment => {
        const donut = (await db.query(`SELECT * FROM donuts WHERE payment_id = ${Number(payment.id)}`)).rows[0];
        if(!donut) {
            db.query(`
            INSERT INTO donuts (user_id, payment_id, amount)
            VALUES ($1, $2, $3)
            `, [
                payment.user,
                payment.id,
                payment.amount
            ]);

            db.query(`UPDATE users SET balance = balance + ${payment.amount}, history = array_prepend($1, history) WHERE id = ${payment.user}`,
            [
                {
                    title: 'Пополнение баланса',
                    type: 'replenish',
                    date: Date.now(),
                    amount: payment.amount
                }
            ]);

            return vk.api.messages.send({
                chat_id: 1,
                random_id: 0,
                message: `Новый донат!\nПользователь: @id${payment.user}\nСумма: ${payment.amount} руб\nАйди платежа: ${payment.id}`
            })
        }
    });
};