export async function checkBilling(ctx) {
    
    const client = ctx.gqlClient;
    const status = await client.query({
        data: `{
          currentAppInstallation{
            activeSubscriptions {
              status
            }
          }
        }`,
    });
    console.log('status')
    console.log(status.body.data.currentAppInstallation.activeSubscriptions.length)
    if(!status.body.data.currentAppInstallation.activeSubscriptions.length > 0){
        console.log('create new charge')
        // TODO cleanup this mess associated with the redirect back to Shopify after billing with return string
        const hostEncoded = Buffer.from(ctx.myShop + '/admin').toString('base64');
        const returnString = `${process.env.HOST}?shop=${ctx.myShop}&host=${hostEncoded}`
        console.log(returnString);
        const charge = await client.query({
            data: `mutation {
          appSubscriptionCreate(
            name: "Professional Plan"
            test: true
            trialDays: 3
            returnUrl: "${returnString}"
            lineItems: [{
              plan: {
                appRecurringPricingDetails: {
                  price: { amount: 29.95, currencyCode: USD }
                  interval: EVERY_30_DAYS
                }
              }
            }]
          ) {
            userErrors {
              field
              message
            }
            confirmationUrl
            appSubscription {
              id
            }
          }
        }`
        })
        ctx.appSubscription = charge.body.data.appSubscriptionCreate.appSubscription.id;
        const redirectUrl = charge.body.data.appSubscriptionCreate.confirmationUrl;
        return redirectUrl;
    }else{
      console.log('no need to redirect')
      return false;
    }
}

