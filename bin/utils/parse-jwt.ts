#!/usr/bin/env node
const tokenInput: string = process.argv[2];
if (!tokenInput) {
    throw new Error('Please provide a base64 encoded jwt as the first positional argument.');
}
const tokenParts: Array<string> = tokenInput.split('.');
const tokenHeader = JSON.parse(atob(tokenParts[0]));
const tokenPayload = JSON.parse(atob(tokenParts[1]));
console.log('HEADER');
console.log(tokenHeader);
console.log();
console.log('PAYLOAD');
console.log(tokenPayload);
console.log();
