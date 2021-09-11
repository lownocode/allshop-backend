import { vk } from "../bot/main.js";
import config from "../config.js";
import { Donut, User } from "../DB/models.js";
import sequelize from 'sequelize';
const { Sequelize } = sequelize;

import axios from "axios";

export const getDonuts = async () => {
    const { data } = await axios.post(`https://api.vkdonuts.ru/donates/get`, {
        group: config.bot.id,
        token: config.vkdonut_key,
        v: 1
    });

    data.list.map(async payment => {
        const donut = await Donut.findOne({ where: { payment_id: Number(payment.id) } });
        if(!donut) {
            const user = await User.findOne({ where: { id: payment.user } });
            if(!user) return;

            user.balance = user.balance + Number(payment.amount);
            await user.save();
            
            User.update({
                history: Sequelize.fn('array_prepend', JSON.stringify({
                    title: 'Пополнение баланса',
                    type: 'replenish',
                    date: Date.now(),
                    amount: payment.amount
                }), Sequelize.col('history'))
            }, { where: { id: payment.user } });

            await Donut.create({
                user_id: payment.user,
                payment_id: payment.id,
                amount: payment.amount
            });

            return vk.api.messages.send({
                chat_id: 1,
                random_id: 0,
                message: `Новый донат!\nПользователь: @id${payment.user}\nСумма: ${payment.amount} руб\nАйди платежа: ${payment.id}`
            })
        }
    });
};