const assert = require("assert");
const fs = require("fs");
const path = require("path");
const _ = require("lodash");
const {
  default: { isURL }
} = require("validator");
const { isAddress } = require("@ethersproject/address");

const supportedChains = [56, 86, 97, 311, 1337, 32520, 888];

(() => {
  const location = path.join(__dirname, "src/dex/assets/listing");

  assert(fs.existsSync(location), "path does not exist");
  const listingFolder = fs.readdirSync(location);

  _.each(listingFolder, file => {
    assert(fs.lstatSync(path.join(location, file)).isFile(), "expected file");
    assert.equal(path.extname(file), ".json", "must be a json file");
    assert(_.includes(supportedChains, parseInt(path.basename(file, ".json"))));

    console.log("Now reading content for file %s", file);

    /**
     * @type {Array<{ name: string; address: string; symbol: string; decimals: number; logoURI: string;}>}
     */
    const jsonContent = JSON.parse(fs.readFileSync(path.join(location, file)).toString());
    assert(Array.isArray(jsonContent), "expected array");

    _.each(jsonContent, item => {
      assert.equal(typeof item.address, "string", "token address must be a string");
      assert(isAddress(item.address), "token address must be a valid ethereum address");
      assert(typeof item.decimals, "number", "token decimals must be a number");
      assert(typeof item.symbol, "string", "token symbol must be a string");
      assert(typeof item.name, "string", "token name must be a string");
      assert(typeof item.logoURI, "string", "token logo URI must be a string");
      assert(isURL(item.logoURI), "string", "token logo URI must be a valid URL");
    });
  });

  console.log("Check finished");
})();
