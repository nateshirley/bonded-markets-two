// copyIdl.js
const fs = require('fs');
const idl = require('../target/idl/bonded_markets_two.json');

fs.writeFileSync('./bonded_markets_two_idl.json', JSON.stringify(idl));
fs.copyFile('../target/types/bonded_markets_two.ts', './BondedMarketsTwo.ts', (err) => {
    if (err) throw err;
    console.log('type file was copied to destination');
});