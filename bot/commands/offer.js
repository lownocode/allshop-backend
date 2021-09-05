import db from '../../DB/pool.js';

export const offerCommand = {
    RegExp: /^(?:Предложение)\s([0-9]+)$/i,
    handler: async message => {
        const user = await db.query(`SELECT admin FROM users WHERE id = ${message.senderId}`);
        const offer = await db.query(`SELECT * FROM offers WHERE offer_id = ${message.$match[1]}`);
        const offers = await db.query(`SELECT offer_id FROM offers`);

        if(!user.rows[0].admin) return;

        if(!offers.rows[0]) {
            return message.send(`Предложений нет`)
        }

        if(!offer.rows[0]) {
            return message.send(`Данного предложения не существует, минимальный айди предложения - ${offers.rows[0].offer_id}`)
        } 

        return message.send(JSON.stringify(offer.rows[0], null, '\t'));
    }
};