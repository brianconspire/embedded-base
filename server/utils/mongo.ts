import { Session } from "@shopify/shopify-api/dist/auth/session";
import { MongoClient } from "mongodb";

const uri = process.env.DATABASE;

let client = new MongoClient(uri);
client.connect();
let db = client.db("app");

export async function getDB() {
    return db;
}

/*
    The storeCallback takes in the Session, and sets a stringified version of it on the redis store
    This callback is used for BOTH saving new Sessions and updating existing Sessions.
    If the session can be stored, return true
    Otherwise, return false
  */
export const storeCallback = async (session) => {
    try {
        console.log("storeCallback ");
        if (session) {
            console.log("storeCallback session");
            const result = await db
                .collection("shops")
                .updateOne(
                    { shop: session.shop },
                    { $set: session },
                    { upsert: true }
                );

            return true;
        } else {
            console.log("no session in storecallback");
            return false;
        }
    } catch (err) {
        throw new Error(err);
    }
};
/*
    The loadCallback takes in the id, and uses the getAsync method to access the session data
     If a stored session exists, it's parsed and returned
     Otherwise, return undefined
  */
export async function loadCallback(id) {
    // Inside our try, we use `getAsync` to access the method by id
    // If we receive data back, we parse and return it
    // If not, we return `undefined`
    console.log("loadCallback");
    try {
        //const db = await getDB();
        const result = await db.collection("shops").findOne();
        if (result) {
            return Object.assign(new Session(id), result);
        } else {
            return undefined;
        }
    } catch (e) {
        throw new Error(e);
    }
}
/*
    The deleteCallback takes in the id, and uses the redis `del` method to delete it from the store
    If the session can be deleted, return true
    Otherwise, return false
  */
export async function deleteCallback(id) {
    try {
        const result = await db.collection("shops").deleteOne({ id: id });
        if (result) {
            // Inside our try, we use the `delAsync` method to delete our session.
            // This method returns a boolean (true if successful, false if not)
            return true;
        } else {
            return false;
        }
    } catch (err) {
        throw new Error(err);
    }
}
