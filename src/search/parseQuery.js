import { isUrl } from "../utils/url.js";

function parseQuery(query){
      query = query.trim();
    
    if (!query) {
        return {
            type: "empty",
            value: ""
        };
    }

    if (isUrl(query)) {
         
        let url = query;

        if (!/^https?:\/\//i.test(url)) {
            url = "https://" + url;
        }

        return {
            type: "url",
            value: url    
        }
    }

    if(query.startsWith("!")){
        let command = query.slice(1).trim();
    
        return {
            type: "command",
            value: command    
        }
    }

    if(query.startsWith(">")){
        let quicklink = query.slice(1).trim();
    
        return {
            type: "quicklink",
            value: quicklink    
        }
    }

    return {
        type: "search",
        value: query    
    }
    
}

export {parseQuery}