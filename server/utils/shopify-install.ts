
import { DataType } from "@shopify/shopify-api";
import fs from 'fs';
import path from 'path';

export async function createScriptTag(client){
    if (client){
        const data = {
            script_tag: {
                event: "onload",
                src: "https://conspireagency.s3.us-west-2.amazonaws.com/draft-script.js",
            }
        }
        const result = await client.post({
            path: 'script_tags',
            data,
            type: DataType.JSON
        })
        console.log('Result for installing script tag is success');
        return result;
    }
    console.error('Could not create the script tag as the client does not exist');
}

export async function createSnippets(client){
    if (client){
        // get the live theme
        const primaryThemeID = await getTheme(client);
        // get the contents of our liquid file we want to install
        const snippet = fs.readFileSync(path.resolve(__dirname, '../../Liquid/conspire-invoice.liquid'), 'utf8');
        
        const data = {
            asset: {
                key: "snippets\/conspire-invoice.liquid",
                value: snippet,
            }
        }
        
        const assetPath = `themes/${primaryThemeID}/assets`;
        
        const result = await client.put({
            path: assetPath,
            data,
            type: DataType.JSON
        })
        console.log('Result for installing our snippet is success on the live theme');
        
        return result;
    }
    console.error('Could not create the snippet as the client does not exist');
}

async function getTheme(client) {
    const data = await client.get({
        path: 'themes'
    });
    const themeData = data?.body?.themes;
    const primaryTheme = themeData?.find(theme => theme.role == "main");

    return 117040775336;
}