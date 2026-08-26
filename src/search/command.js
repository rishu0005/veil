import { openQuickLinks } from "../quicklinks/quicklinks.js";

const commands = [
    'notes',
    'console',
    'tab',
    'history',
    'quicklinks'
];

function executeCommand(query){
    query = query.trim();

    if(!query){
        return {
            type: "empty",
            message: "please enter a command"
        };
    }


    if(!commands.includes(query)){

        return {

            type: "unknown",
            message: `unknown command ${query}`
        };
    }
    switch(query){
        case 'notes':
         console.log('note command executed');
         break;

        case 'console':
         console.log('console command executed');
         break;

        case 'tab':
         console.log('tab command executed');
         break;

        case 'history':
         console.log('history command executed');
         break;
        case 'quicklinks':
         openQuickLinks();
         console.log('quickLinks command executed');
         break;

    }

    return {
        type: "success",
        message: query
    };
}

export {executeCommand }