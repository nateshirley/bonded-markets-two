const fs = require('fs');
const idl = require('../target/idl/bonded_markets.json');

fs.writeFileSync('./bonded_markets_idl.json', JSON.stringify(idl));
fs.copyFile('../target/types/bonded_markets.ts', './BondedMarketsType.ts', (err) => {
    if (err) throw err;
    console.log('type file was copied to destination');
});
