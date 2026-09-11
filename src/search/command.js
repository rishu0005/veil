import { openQuickLinks } from "../quicklinks/quicklinks.js";
import {openNotes} from '../notes/notes.js';

const commands = {
    notes: {
        execute: openNotes
    },

    quicklinks: {
        execute: openQuickLinks
    },

    // note: {
    //     execute: executeNote
    // },

    // quicklink: {
    //     execute: executeQuickLink
    // }
};


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
            openNotes();
            console.log('note command executed');
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