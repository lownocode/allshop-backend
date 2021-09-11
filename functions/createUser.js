import { vk } from '../bot/main.js';
import { User } from '../DB/models.js';

export const createUser = async (id) => {
    const user = await vk.api.users.get({ user_ids: id });

    const newUser = await User.create({
        id: id,
        history: [{
            title: 'Регистрация',
            date: +new Date(),
            type: 'registration'
        }]
    });

    console.log(`[NEW USER] ${user[0].first_name} ${user[0].last_name} (@id${id})`);
    vk.api.messages.send({
        chat_id: 1, 
        random_id: 0, 
        message: `[NEW USER] ${user[0].first_name} ${user[0].last_name} (@id${id})`
    });

    return newUser;
};