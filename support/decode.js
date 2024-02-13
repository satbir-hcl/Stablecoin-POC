const {ethers} = require("ethers");

async function main() {

    const error = "0x08c379a00000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000001d45524332303a20696e73756666696369656e7420616c6c6f77616e6365000000";
    const reason = ethers.utils.defaultAbiCoder.decode(
        ['string'],
        ethers.utils.hexDataSlice(error, 4)
    )
    console.log(reason);
};

void main();
