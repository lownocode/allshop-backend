import db from '../../DB/pool.js';

export const offersCommand = {
    RegExp: /^(?:Предложения)$/i,
    handler: async message => {
        const user = await db.query(`SELECT admin FROM users WHERE id = ${message.senderId}`);
        const offers = await db.query(`SELECT offer_id, author_id FROM offers`);
        let selectOffers = ``;

        if(!user.rows[0].admin) return;

        if(!offers.rows[0]) {
            return message.send(`Предложений нет`)
        }

        offers.rows.map((offer, index) => {
            return selectOffers += `${index + 1}. ID: ${offer.offer_id}, USER: @id${offer.author_id}\n`;
        });

        await message.send(selectOffers);
    }
};