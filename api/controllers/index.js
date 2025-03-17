import {logger} from "../config/logConfig.js";

export const setResponse = (obj, status, response, log_level)=>{
    if(log_level==="warn"){
        logger.warn(obj.message)
    } else if(log_level==="error"){
        logger.error(`Something went wrong. \n ${JSON.stringify(obj)}`)
    }
    response.status(status).send(obj)
    // response.json(obj)
}