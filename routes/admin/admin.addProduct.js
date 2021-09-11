import { User, Product } from '../../DB/models.js';
import { getUrlVars } from '../../functions/getUrlVars.js';

const adminAddProduct = async (fastify) => {
    fastify.post('/admin.addProduct', async (req, res) => {
        const query = req.body;
        const params = getUrlVars(req.headers['auth']);
        const user = await User.findOne({ where: { id: params.vk_user_id } });
    
        if(!user.admin) {
            return res.send({
                success: false,
                msg: 'you are not an administrator'
            });
        } 
        else if(typeof(query.sum) != 'number' || query.sum < 10 || query.sum > 50000) {
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
        
        Product.create({ 
            demo_link: query.demo_link,
            description: query.description,
            source: query.source,
            sum: query.sum,
            title: query.title,
            type: query.type,
            author_id: 0
        });
        return res.send({
            success: true,
            msg: 'Товар добавлен. Ауф!'
        });
    })
};

export default adminAddProduct;