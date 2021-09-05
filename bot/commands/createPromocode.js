import db from '../../DB/pool.js';
import { genRandomString } from '../../functions/genRandomString.js';

export const createPromocodeCommand = {
    RegExp: /^(?:создать промокод)\s([0-9]+)\s([0-9]+)$/i,
    handler: async message => {
        const user = await db.query(`SELECT admin FROM users WHERE id = ${message.senderId}`);
        if(!user.rows[0].admin) return;

        if(!message.$match[1] || !message.$match[2]) {
            return message.send(`Использование: создать промокод <<сумма>> <<кол-во активаций>>`);
        }
        const promo = await createPromo(message.$match[1], message.$match[2]);
        if(promo.error) {
            return message.send(JSON.stringify(promo.error)) 
        }
        
        message.send(`Промокод создан\n\n${JSON.stringify(promo.rows[0])}`);
        message.send(promo.rows[0].promo);
    }
};

const createPromo = async (sum, usages) => {
    const promo = genRandomString(4) + '-' + genRandomString(4) + '-' + genRandomString(4) + '-' + genRandomString(4);
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