import Router from 'koa-router';
import {checkBilling} from '../controllers/billing_controller'

const router = new Router({prefix:'/billing'});

router.get('/', async(ctx) => {
    console.log("check billing");
    const result = await checkBilling(ctx);
    ctx.body = result;
});

export default router;