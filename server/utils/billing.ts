// check shop plan detail to allow free trials for dev stores
const checkBilling = async () => {
    const aQuery = 
    `{
        shop {
            plan {
                partnerDevelopment
                shopifyPlus
            }
        }
    }`

    const billingQuery = `
    currentAppInstallation {
        activeSubscriptions {
          id
          name
          test
        }
     }`

    if ('somecondition') {
        return false;
    } else {
        return true;
    }
}

// create a recurring charge
export const createRecurring = async () => {
    const plan = {
        interval: EVERY_30_DAYS,
        price: 29.95
    }
    const query =
        `mutation {
            appSubscriptionCreate(
              name: "Professional Plan"
              test: true
              trialDays: 3
              returnUrl: ${process.env.HOST}
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
          }
        `
}