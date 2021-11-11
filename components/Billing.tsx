import React, {useEffect} from 'react'
import { useAppBridge } from '@shopify/app-bridge-react';
import {Redirect} from '@shopify/app-bridge/actions';
import { useAxios } from '../hooks/useAxios';

const Billing = (props) => {
    const app = useAppBridge();
    const [axios] = useAxios();
    async function checkBilling(){
        await axios.get('/billing').then(res => {
            console.log('frontend billing get ', res.data)
            if(res.data){
              const redirect = Redirect.create(app)
              redirect.dispatch(Redirect.Action.REMOTE, res.data);
            }
          }).catch(e => {
            console.log(e)
          })
    }
    useEffect(()=>{
        checkBilling();
    })
    return null
}

export default Billing;