import db from '../../DB/pool.js';

import axios from 'axios';

import { getUrlVars } from '../../functions/getUrlVars.js';
import config from '../../config.js';
import { vk } from '../../vk_bot.js';

const withdraw = async (fastify) => {
    fastify.post('/withdraw', async (req, res) => {
        const query = req.body;
        const params = getUrlVars(req.headers['auth']);
        const user = await db.query(`SELECT * FROM users WHERE id = ${params.vk_user_id}`);
    
        if(query.amount > user.rows[0].balance) {
            return res.send({
                success: false,
                msg: 'Вы указываете сумму больше вашего баланса'
            });
        }
    
        const { data } = await axios.post(`https://api.vkdonuts.ru/payments/create`, {
            group: config.bot.id,
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
            return res.send({
                success: false,
                msg: 'Ошибка, возможно, Вы вводите что-то неправильно.'
            });
        });
        
        if(!data.success && data.error) {
            return res.send({
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
            return res.send({
                success: true,
                msg: `Выплата может занимать от нескольких минут до нескольких часов`
            });
        }
    })
};

export default withdraw;