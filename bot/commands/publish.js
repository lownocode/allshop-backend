import db from '../../DB/pool.js';

export const publish = {
    RegExp: /^(?:опубликовать)\s([0-9]+)$/i,
    handler: async message => {
        const user = await db.query(`SELECT admin FROM users WHERE id = ${message.senderId}`);
        if(!user.rows[0].admin) return;
    
        const offer = await db.query(`SELECT offer_id FROM offers WHERE offer_id = ${message.$match[1]}`);
        if(!offer.rows[0]) {
            return message.send(`Данного предложения не существует`)
        } 
        
        await db.query(`DELETE FROM offers WHERE offer_id = ${message.$match[1]}`);
        await db.query(`INSERT INTO products (author_id, demo_link, source, type, sum, description, title) VALUES ($1, $2, $3, $4, $5, $6, $7)`, 
        [
            offer.rows[0].author_id, //author_id
            offer.rows[0].demo_link,
            offer.rows[0].source,
            offer.rows[0].type,
            offer.rows[0].sum,
            offer.rows[0].description,
            offer.rows[0].title
        ]);
        
        return message.send(`Товар опубликован`);
    }
};