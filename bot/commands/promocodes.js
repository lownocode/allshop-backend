import db from '../../DB/pool.js';

export const promocodesCommand = {
    RegExp: /^(?:Промокоды)$/i,
    handler: async message => {
        const user = await db.query(`SELECT admin FROM users WHERE id = ${message.senderId}`);
        const promocodes = await db.query(`SELECT * FROM promocodes`);
        let selectPromocodes = ``;

        if(!user.rows[0].admin) return;

        if(!promocodes.rows[0]) {
            return message.send(`Промокодов нет`);
        }

        promocodes.rows.map((promocode, index) => {
            if(promocode.usages <= 0) return;
            return selectPromocodes += 
            `${promocode.id}. Код: ${promocode.promo} Использований: ${promocode.usages} из ${Number(promocode.usages + promocode.used_users.length)} Сумма: ${promocode.sum}\n`;
        });

        await message.send(selectPromocodes);
    }
};