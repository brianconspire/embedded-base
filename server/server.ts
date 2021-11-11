import "@babel/polyfill";
import dotenv from "dotenv";
import "isomorphic-fetch";
import createShopifyAuth, { verifyRequest } from "@shopify/koa-shopify-auth";
import Shopify, { ApiVersion } from "@shopify/shopify-api";
import Koa from "koa";
import next from "next";
import Router from "koa-router";
import routes from "./router/index";
import {
  getDB,
  storeCallback,
  loadCallback,
  deleteCallback,
} from "./utils/mongo";
import { createScriptTag, createSnippets } from "./utils/shopify-install";

//import {createCrons} from "./utils/bull";

import { registerAppWebhooks, setShopifyWebhookRegistry } from "./webhooks";

dotenv.config();
const port = parseInt(process.env.PORT, 10) || 8081;
const dev = process.env.NODE_ENV !== "production";
const app = next({
  dev,
});

const handle = app.getRequestHandler();

Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: process.env.SCOPES.split(","),
  HOST_NAME: process.env.HOST.replace(/https:\/\//, ""),
  API_VERSION: ApiVersion.July21,
  IS_EMBEDDED_APP: true,
  // This should be replaced with your preferred storage strategy
  SESSION_STORAGE: new Shopify.Session.CustomSessionStorage(
    storeCallback,
    loadCallback,
    deleteCallback
  ),
});

app.prepare().then(async () => {
  const server = new Koa();
  const router = new Router();

  server.keys = [Shopify.Context.API_SECRET_KEY];

  server.use(
    createShopifyAuth({
      accessMode: "offline",
      async afterAuth(ctx) {
        console.log("afterAuth");
        // Access token and shop available in ctx.state.shopify
        const { shop, accessToken, scope } = ctx.state.shopify;
        const host = ctx.query.host;

        // Install script tags
        const installClient = new Shopify.Clients.Rest(shop, accessToken);
        createScriptTag(installClient);
        createSnippets(installClient);

        console.log("registering webhooks");
        const webhooksRegistered = await registerAppWebhooks(shop, accessToken);
        console.log("webhooks registered response", webhooksRegistered);

        // Redirect to app with shop parameter upon auth
        ctx.redirect(`/?shop=${shop}&host=${host}`);
      },
    })
  );

  router.post("/webhooks", async (ctx) => {
    try {
      console.log("received a webhook");
      if (!Shopify.Webhooks.Registry.webhookRegistry.length > 0) {
        console.log("need to set registered webhooks TODO HACKY SOLUTION");
        await setShopifyWebhookRegistry(ctx.req);
      }
      await Shopify.Webhooks.Registry.process(ctx.req, ctx.res);
      console.log(`Webhook processed, returned status code 200`);
    } catch (error) {
      console.log(`Failed to process webhook: ${error}`);
    }
  });

  router.post(
    "/graphql",
    verifyRequest({ returnHeader: true }),
    async (ctx, next) => {
      await Shopify.Utils.graphqlProxy(ctx.req, ctx.res);
    }
  );

  const handleRequest = async (ctx) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
  };

  async function injectSession(ctx, next) {
    const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
    ctx.sessionFromToken = session;
    if (session?.shop && session?.accessToken) {
      const client = new Shopify.Clients.Rest(
        session.shop,
        session.accessToken
      );
      const gqlClient = new Shopify.Clients.Graphql(
        session.shop,
        session.accessToken
      );
      ctx.myClient = client;
      ctx.gqlClient = gqlClient;
      ctx.myShop = session.shop;
      console.log("inject session");
    }
    return next();
  }

  router.get("/", async (ctx) => {
    // check to see if in query parameter or context
    const shop = ctx.query.shop
      ? ctx.query.shop
      : // @ts-ignore
        ctx.myShop;

    const db = await getDB();
    const result = await db.collection("shops").findOne({ shop: shop });
    // check to see if shop has a session
    if (!result) {
      // This shop hasn't been seen yet, go through OAuth to create a session
      console.log("new shop need to oauth");
      ctx.redirect(`/auth?shop=${shop}`);
    } else {
      // has session handle request
      await handleRequest(ctx);
    }
  });

  // createCrons();

  router.get("(/_next/static/.*)", handleRequest); // Static content is clear
  router.get("/_next/webpack-hmr", handleRequest); // Webpack content is clear
  router.get("(.*)", verifyRequest(), handleRequest); // Everything else must have sessions

  server.use(injectSession);
  // routes defined in router folder
  server.use(routes());
  server.use(router.allowedMethods());
  // serverjs defined router routes
  server.use(router.routes());

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
