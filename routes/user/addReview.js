import { Product, Review } from "../../DB/models.js";
import { getUrlVars } from '../../functions/getUrlVars.js';
import { vk } from "../../bot/main.js";

const addReview = async (fastify) => {
    fastify.post('/addReview', async (req, res) => {
        const params = getUrlVars(req.headers['auth']);
        const product = await Product.findOne({ where: { uid: req.body.product_id } });
        const validEmotions = ['positive', 'negative'];

        if(!product) {
            return res.send({
                success: false,
                msg: 'Товара с таким айди не существует!'
            });
        }
        else if(!req.body.text || req.body.text.trim().length === 0) {
            return res.send({
                success: false,
                msg: 'Текст не должен быть пустым'
            });
        }
        else if(req.body.text.length >= 2500) {
            return res.send({
                success: false,
                msg: 'Длина текста не должна превышать 2 500 символов'
            });
        }
        else if(!req.body.emotion || validEmotions.findIndex(e => e === req.body.emotion) == -1) {
            return res.send({
                success: false,
                msg: 'Невалидная эмоция'
            });
        }

        const [ userData ] = await vk.api.users.get({ user_ids: params.vk_user_id, fields: 'photo_200' });

        const newReview = await Review.create({
            text: req.body.text,
            sender_id: params.vk_user_id,
            product_id: product.uid,
            emotion: req.body.emotion,
            user_data: userData
        });

        res.send({
            success: true,
            msg: 'Отзыв опубликован',
            review: newReview
        });
    })
};

export default addReview;