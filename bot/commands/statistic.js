import db from '../../DB/pool.js';
import config from '../../config.js';

import axios from 'axios';

export const statisticCommand = {
    RegExp: /^(?:Статистика||stat)$/i,
    handler: async message => {
        const user = await db.query(`SELECT admin FROM users WHERE id = ${message.senderId}`);
        const adminData = await getAdminInfo();
        const { data } = await axios.post(`https://api.vkdonuts.ru/balance`, {
            token: config.vkdonut_key,
            group: config.bot.id,
            v: 1
        });
    
        if(!user.rows[0].admin) return;
        
        message.send(`
        Всего пользователей: ${adminData.users}
        Предложенных скриптов: ${adminData.offers}
        Всего скриптов в маркете: ${adminData.products}
        Баланс пончика: ${(data.balance / 100).toFixed(2)} руб
        
        Чтобы посмотреть предложенный скрипт введите <<Предложение [айди предложения]>>`)
    }
};

const getAdminInfo = async () => {
    const users = await db.query(`SELECT id FROM users`);
    const offers = await db.query(`SELECT offer_id FROM offers`);
    const products = await db.query(`SELECT product_id FROM products`);

    const data = {
        users: users.rows.length,
        offers: offers.rows.length,
        products: products.rows.length
    };

    return data; 
};