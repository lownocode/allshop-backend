import { Review } from "../../DB/models.js";
import { getUrlVars } from "../../functions/getUrlVars.js";

const deleteReview = async (fastify) => {
    fastify.post('/deleteReview', async (req, res) => {
        const { rid } = req.body;
        const params = getUrlVars(req.headers['auth']);
        const review = await Review.findOne({ where: { uid: rid } });

        if(!rid) {
            return res.send({
                success: false,
                msg: 'Один из параметров отсутствует'
            });
        }
        else if(!review) {
            return res.send({
                success: false,
                msg: 'Отзыва не существует'
            });
        }
        else if(review.sender_id !== Number(params.vk_user_id)) {
            return res.send({
                success: false,
                msg: 'Нельзя удалить не свой отзыв'
            });
        }

        review.destroy();
        res.send({
            success: true,
            msg: 'Отзыв удалён'
        });
    })
};

export default deleteReview;