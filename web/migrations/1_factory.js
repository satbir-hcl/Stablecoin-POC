const RemittanceContract = artifacts.require("FactoryContract");

module.exports = function (deployer) {
  deployer.deploy(RemittanceContract).then(function () {
    console.log(RemittanceContract.address);
  });
};
