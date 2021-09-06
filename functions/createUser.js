import db from '../DB/pool.js';
import { vk } from '../bot/main.js';

export const createUser = async (id) => {
    const user = await vk.api.users.get({ user_ids: id });
    
    const newUser = await db.query(
        `INSERT INTO users 
        (id, purchases, balance, admin, history) 
        values ($1, $2, $3, $4, $5) RETURNING *`, 
    [
        id, 
        [], //purchases
        0, //balance
        false, //admin
        [ //history
            {
                title: 'Регистрация', 
                date: Date.now(), 
                type: 'registration'
            }
        ]
    ]);

    console.log(`[NEW USER] ${user[0].first_name} ${user[0].last_name} (@id${id})`);
    vk.api.messages.send({
        chat_id: 1, 
        random_id: 0, 
        message: `[NEW USER] ${user[0].first_name} ${user[0].last_name} (@id${id})`
    });

    return newUser.rows[0];
};