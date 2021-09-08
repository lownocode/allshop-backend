import db from '../../DB/pool.js';

export const cancelOfferCommand = {
    RegExp: /^(?:Отклонить)\s([0-9]+)$/i,
    handler: async message => {
        const user = (await db.query(`SELECT admin FROM users WHERE id = ${message.senderId}`)).rows[0];
        if (!user.admin) return;

        const offer = (await db.query(`SELECT offer_id FROM offers WHERE offer_id = ${message.$match[1]}`)).rows[0];
        if(!offer) {
            return message.send(`Данного предложения не существует`);
        }

        db.query(`DELETE from offers WHERE offer_id = ${message.$match[1]}`);
        return message.send(`Предложение с id ${offer.offer_id} удалено!`);
    }
};