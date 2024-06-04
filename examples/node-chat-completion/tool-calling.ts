/*
 * This example demonstrates how to persist the history of messages in a Chat instance 
 * by turning on recording.
 */

import fs from 'fs';
import { config } from 'dotenv';
config();

import { Chat } from "ragged/chat"
import { Tool } from "ragged/tools";
const c = Chat.with('openai', { apiKey: process.env.OPENAI_API_KEY });
c.record(true);
c.maxIterations = 10;

const __dirname = fs.realpathSync('.');

// Note that the handler functions for the tools are synchronous, but they can be asynchronous if needed.

// These 3 tools allow us to list files in a directory, print the current working directory, and read the contents of a file.

const lsTool: Tool = {
    id: "ls",
    description: "List the files in any given directory on the user's local machine.",
    props: {
        type: "object",
        props: {
            path: {
                type: "string",
                description: "The path to the directory to list files from.",
                required: true
            }
        }
    },
    handler: async (props: any) => {
        try {
            const json = await JSON.parse(props);
            const providedPath = json.path;
            const files = fs.readdirSync(providedPath);
            return `The files in the directory ${providedPath} are: ${files.join("\n")}`;
        } catch (e: any) {
            console.error(e);
            if (e?.message) {
                return `An error occurred: ${e.message}`;
            } else {
                return `An unknown error occurred.`;
            }
        }

    }
}

const pwdTool: Tool = {
    id: "pwd",
    description: "Print the current working directory of the user's local machine.",
    props: {
        type: "object",
        props: {}
    },
    handler: async () => {
        return `The current working directory is: ${__dirname}`;
    }
}

const catTool: Tool = {
    id: "cat",
    description: "Print the contents of a file on the user's local machine.",
    props: {
        type: "object",
        props: {
            path: {
                type: "string",
                description: "The path to the file to read.",
                required: true
            }
        }
    },
    handler: async (props: any) => {
        try {
            const json = await JSON.parse(props);
            const path = json.path;
            const contents = fs.readFileSync(path, 'utf8');
            return `The contents of the file ${path} are as follows: \n\n: ${contents}`;
        } catch (e: any) {
            console.error(e);
            if (e?.message) {
                return `An error occurred: ${e.message}`;
            } else {
                return `An unknown error occurred.`;
            }
        }
    }
}

const response = await c.chat(`
Read this current file, which is "tool-calling.ts". 

Also read "/home/monarch/workspace/ragged/README.md" . This documentation is for Ragged, which provides the ChatCompletion instance in tool-calling.tsx.

Tell me how the README can be improved based on what you can see the tool-calling.ts file can do, but is not documented in the README. Ignore the tool definitions in this file. Focus on the ChatCompletion APIs that are not yet documented in README.md

Write the new documentation sections for tool calling so I can copy paste it directly in the README.
`, [], [lsTool, pwdTool, catTool], "gpt-4")

console.log(response.at(-1)?.text); // The files in the directory / are: bin

// const response = await c.chat('What is a rickroll?');

// // you can get the last message from the response
// console.log(response.at(-1)?.text); // A rickroll is a prank...
// // or, alternatively, you can access the response directly from the chat instance
// console.log(c.history.at(-1)?.text); // A rickroll is a prank...

// // continue the conversation
// await c.chat('Where did it originate?');
// console.log(c.history.at(-1)?.text); // The Rickroll meme originated in the...
// await c.chat('What is the purpose?');
// console.log(c.history.at(-1)?.text); // The purpose of a rickroll is to...
