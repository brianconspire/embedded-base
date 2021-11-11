import combineRouters from 'koa-combine-routers'
import billingRouter from './billing'
import scriptTagRouter from './script_tag'
import metafieldsRouter from './metafields'
import draftsRouter from './drafts'

const router = combineRouters(
    billingRouter,
    scriptTagRouter,
    metafieldsRouter,
    draftsRouter
)

export default router;