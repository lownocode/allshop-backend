import db from '../../DB/pool.js';
import config from '../../config.js';

import axios from 'axios';
import os from 'os';

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
Запущен: ${getUptime()} назад
Использование ОЗУ: ${readableBytes(cpuUsage().free)} из ${readableBytes(cpuUsage().total)} (${cpuUsage().percent}%)
        
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

const getUptime = () => {
    const uptime = process.uptime();
    
    const date = new Date(uptime*1000);
    const days = date.getUTCDate() - 1;
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const seconds = date.getUTCSeconds();
    
    let segments = [];

    if (days > 0) segments.push(declOfNum(days, [`день`, `дня`, `дней`]));
    if (hours > 0) segments.push(declOfNum(hours, [`час`, `часа`, `часов`]));
    if (minutes > 0) segments.push(declOfNum(minutes, [`минуту`, `минуты`, `минут`]));
    if (seconds > 0) segments.push(declOfNum(seconds, [`секунду`, `секунды`, `секунд`]));

    return segments.join(', ');
};

const cpuUsage = () => {
    const mem = {
        free: process.cpuUsage().user,
        total: os.totalmem()
    };
    mem.percent = (mem.free * 100 / mem.total).toFixed(2);
    
    return mem;
};

const readableBytes = (bytes) => {
    let i = Math.floor(Math.log(bytes) / Math.log(1024)),
    sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    return (bytes / Math.pow(1024, i)).toFixed(2) * 1 + ' ' + sizes[i];
};

const declOfNum = (number, titles) => {  
    const cases = [2, 0, 1, 1, 1, 2];  
    return number + ' ' + titles[ (number%100>4 && number%100<20)? 2 : cases[(number%10<5)?number%10:5] ];  
};