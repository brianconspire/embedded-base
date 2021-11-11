import Shopify from "@shopify/shopify-api";
import { getDB } from "./utils/mongo";

const webhooks = [
  {
    topic: "DRAFT_ORDERS_CREATE",
  },
  {
    topic: "DRAFT_ORDERS_UPDATE",
  },
  {
    topic: "APP_SUBSCRIPTIONS_UPDATE",
  },
  {
    topic: "APP_UNINSTALLED",
  },
];

export async function setShopifyWebhookRegistry(request) {
  const shop = request.headers["x-shopify-shop-domain"];
  // TODO should verify something to do with webhook since it could be from anywhere
  try {
    const db = await getDB();
    const result = await db.collection("shops").findOne({ shop });
    await registerAppWebhooks(shop, result.accessToken);
  } catch (e) {
    console.log(
      `could not find ${shop} in registered shops to refresh webhooks ${e}`
    );
  }
}

export async function registerAppWebhooks(shop, accessToken) {
  await Promise.all(
    webhooks.map(async (webhook) => {
      const response = await Shopify.Webhooks.Registry.register({
        shop,
        accessToken,
        path: "/webhooks",
        topic: webhook.topic,
        webhookHandler: handleWebhookRequest,
      });

      if (!response.success) {
        console.log(
          `Failed to register ${webhook.topic} webhook: ${response.result}`
        );
      } else {
        console.log(`Registered ${webhook.topic} webhook.`);
      }
    })
  );
  return "success";
}

export async function handleWebhookRequest(topic, shop, body) {
  console.log(`handling webhook for ${shop} ${topic}`);
  try {
    body = JSON.parse(body);
  } catch (e) {
    console.error("Invalid body JSON string ", e);
  }
  const db = await getDB();

  if (topic === "APP_UNINSTALLED") {
    await db.collection("shops").deleteOne({ shop: shop });
  }
  // GDPR MANDATORY WEBHOOKS
  // TODO MAKE THIS MORE GENERIC AS NOT ALL APPS WILL USE DRAFTS ETC
  if(topic === 'SHOP_REDACT'){
    await db.collection("shops").deleteOne({ shop: shop });
    await db.collection("drafts").deleteMany({ shop: shop });
  }
  if(topic === 'CUSTOMERS_REDACT'){
    await db.collection("drafts").deleteMany({ shop: shop, email: body.customer.email });
  }
  if(topic === 'CUSTOMERS_DATA_REQUEST'){
    await db.collection("drafts").find({shop: shop, email: body.customer.email });
    // TODO FIGURE OUT HOW TO RETURN THIS AND ACCEPT PARAMETERS IE CERTAIN DRAFT IDS
    // SEE https://shopify.dev/apps/webhooks/mandatory#customers-data_request
  }
  // END GDPR MANDATORY WEBHOOKS

  if (topic === "DRAFT_ORDERS_CREATE" || topic === "DRAFT_ORDERS_UPDATE") {
    console.log(`draft order update webhook for ${shop}`);
    // set mongodb id the same to Shopify draft order ID and append shop
    body._id = body.id;
    body.shop = shop;
    
    try{
      const result = await db
      .collection("drafts")
      .updateOne({ _id: body.id }, { $set: body }, { upsert: true });
    }catch(e){
      throw new Error(e);
    }
    
  }
}
