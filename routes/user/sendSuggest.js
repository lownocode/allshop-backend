import db from '../../DB/pool.js';
import functions from '../../functions.js';
import { vk } from '../../vk_bot.js';

const sendSuggest = async (fastify) => {
    fastify.post('/sendSuggest', async (req, res) => {
        const query = req.body;
        const params = functions.getUrlVars(req.headers['auth']);
        const user = await db.query(`SELECT * FROM users WHERE id = ${params.vk_user_id}`);
    
        if(typeof(query.sum) != 'number' || query.sum < 10 || query.sum > 50000) {
            return res.send({
                success: false, 
                msg: 'Некорректно указана сумма'
            });
        }
        else if(query.title.length > 50 || query.description.length > 800 ) {
            return res.send({
                success: false, 
                msg: 'Некорректно указано название, либо описание'
            });
        } 
        else if(!query.source || !query.type || !query.sum || !query.description || !query.title) {
            return res.send({
                success: false, 
                msg: 'Один из параметров отсутствует'
            });
        } else {
            const answerDB = await db.query(`INSERT INTO offers (author_id, demo_link, source, type, sum, description, title) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, 
            [
                user.rows[0].id, //author_id
                query.demo_link,
                query.source,
                query.type,
                query.sum,
                query.description,
                query.title
            ]);
            res.send({
                success: true,
                msg: 'Ожидайте, товар добавлен и проходит проверку'
            });
            vk.api.messages.send({
                chat_id: 1,
                random_id: 0,
                message: `@id${params.vk_user_id} предложил скрипт, параметры:\n\n ${JSON.stringify(req.body, null, '\t')}\n\nОтвет БД:\n${JSON.stringify(answerDB.rows[0], null, '\t')}\n\nЧтобы опубликовать введите Опубликовать <<id предложения>>`
            });
        }
    })
};

export default sendSuggest;