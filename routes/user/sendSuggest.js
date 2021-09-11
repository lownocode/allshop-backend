import db from '../../DB/sequelize.js';
import { getUrlVars } from '../../functions/getUrlVars.js';
import { vk } from '../../bot/main.js';
import { User, Offer } from '../../DB/models.js';

const sendSuggest = async (fastify) => {
    fastify.post('/sendSuggest', async (req, res) => {
        const query = req.body;
        const params = getUrlVars(req.headers['auth']);
        const user = await User.findOne({ where: { id: params.vk_user_id } });
    
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
        } 

        const answerDB = await Offer.create({
            author_id: user.id, 
            demo_link: query.demo_link,
            source: query.source,
            type: query.type,
            sum: query.sum,
            description: query.description,
            title: query.title
        }, { returning: true });

        res.send({
            success: true,
            msg: 'Ожидайте, товар добавлен и проходит проверку'
        });
        vk.api.messages.send({
            chat_id: 1,
            random_id: 0,
            message: `@id${params.vk_user_id} предложил скрипт, параметры:\n\n ${JSON.stringify(req.body, null, '\t')}\n\nОтвет БД:\n${JSON.stringify(answerDB, null, '\t')}\n\nЧтобы опубликовать введите Опубликовать <<id предложения>>`
        });
    })
};

export default sendSuggest;