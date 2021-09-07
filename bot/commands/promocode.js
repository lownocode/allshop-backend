import db from '../../DB/pool.js';

export const promocodeCommand = {
    RegExp: /^(?:промо||промокод)\s(.*)$/i,
    handler: async message => {
        const promo = await db.query(`SELECT * FROM promocodes WHERE promo = '${message.$match[1]}'`);
        
        if(!promo.rows[0] || promo.error) {
            return message.send(`Промокод не найден`);
        }
        else if(promo.rows[0].used_users.find(x => x.id == message.senderId)) {
            return message.send(`Вы уже активировали данный промокод`);
        }
        else if(promo.rows[0].usages < 1) {
            return message.send(`У данного промокода закончились активации`)
        }
    
        const user = await db.query(`UPDATE users SET balance = balance + ${promo.rows[0].sum}, history = array_prepend($1, history) WHERE id = '${message.senderId}' RETURNING *`, [
            {
                title: 'Активация промокода',
                date: Date.now(),
                type: 'promocode',
                amount: promo.rows[0].sum,
                code: promo.rows[0].promo
            }
        ]);
        db.query(`UPDATE promocodes SET used_users = array_prepend($1, used_users), usages = usages - 1 WHERE promo = '${message.$match[1]}'`, [
            {
                id: message.senderId
            }
        ]);
        
        return message.send(`Промокод активирован.\nНа ваш баланс зачислено ${promo.rows[0].sum} руб.\nТеперь ваш баланс составляет ${user.rows[0].balance} руб.\nОсталось активаций: ${promo.rows[0].usages - 1}`)
    }
};