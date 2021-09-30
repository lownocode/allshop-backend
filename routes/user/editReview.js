import { Review } from "../../DB/models.js";
import { getUrlVars } from "../../functions/getUrlVars.js";

const editReview = async (fastify) => {
    fastify.post('/editReview', async (req, res) => {
        const { text, emotion, rid } = req.body;
        const params = getUrlVars(req.headers.auth);
        const review = await Review.findOne({ where: { uid: rid } });

        if(!review) {
            return res.send({
                success: false,
                msg: 'Отзыва не существует'
            });
        }
        else if(Number(params.vk_user_id) !== review.sender_id) {
            return res.send({
                success: false,
                msg: 'Нельзя редактировать не свой отзыв'
            });
        }
        else if(!text || !emotion || !rid) {
            return res.send({
                success: false,
                msg: 'Один из параметров отсутствует'
            });
        }
        else if(req.body.text.trim().length >= 2500) {
            return res.send({
                success: false,
                msg: 'Длина текста не должна превышать 2 500 символов'
            });
        }

        Review.update({
            text: text,
            emotion: emotion
        }, { where: { uid: rid } });

        res.send({
            success: true,
            msg: 'Отзыв отредактирован'
        });
    })
};

export default editReview;