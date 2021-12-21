import { expect } from "chai";
import { ethers } from "hardhat";

describe("Greeter", function () {
  const deploy = async (greeterParams: Array<string> = []) => {
    /* deploy dummy NFT contract */
    const NFT = await ethers.getContractFactory("DummyNFT");
    const nft = await NFT.deploy("BALEC", "BLC");
    await nft.deployed();

    /* deploy batch-minter contract */
    const Greeter = await ethers.getContractFactory("Greeter");
    const greeter = await Greeter.deploy(greeterParams);
    await greeter.deployed();

    const contracts: [typeof greeter, typeof nft] = [greeter, nft];
    return contracts;
  };

  it("Addresses passed to the constructor and deployer account are set as owner", async function () {
    const [deployer, account1, account2, account3] = await ethers.getSigners();
    const [greeter] = await deploy([account1.address, account3.address]);

    expect(await greeter.isOwner(deployer.address)).to.be.true;
    expect(await greeter.isOwner(account1.address)).to.be.true;
    expect(await greeter.isOwner(account3.address)).to.be.true;
    expect(await greeter.isOwner(account2.address)).to.be.false;
  });

  it("Owner can be removed", async function () {
    const [_, account1] = await ethers.getSigners();
    const [greeter] = await deploy([account1.address]);

    expect(await greeter.isOwner(account1.address)).to.be.true;
    await greeter.removeOwner(account1.address);
    expect(await greeter.isOwner(account1.address)).to.be.false;
  });

  it("Owner can be added", async function () {
    const [_, account1] = await ethers.getSigners();
    const [greeter] = await deploy([]);

    expect(await greeter.isOwner(account1.address)).to.be.false;
    await greeter.addOwner(account1.address);
    expect(await greeter.isOwner(account1.address)).to.be.true;
  });

  it("Sensitive methods can only be called by owner", async function () {
    const [_, account1, account2] = await ethers.getSigners();
    const [greeter] = await deploy([]);

    const onlyOwnerReason = "you're not allowed to interact with this function";

    await expect(
      greeter
        .connect(account1)
        .batchMint(
          account2.address,
          ethers.constants.Zero,
          ethers.constants.Two,
          { value: ethers.utils.parseEther("0.1") }
        )
    ).to.be.revertedWith(onlyOwnerReason);
    await expect(
      greeter.connect(account1).transferBatch(account2.address, [1, 2, 3])
    ).to.be.revertedWith(onlyOwnerReason);
    await expect(
      greeter.connect(account1).removeOwner(account2.address)
    ).to.be.revertedWith(onlyOwnerReason);
    await expect(
      greeter.connect(account1).addOwner(account2.address)
    ).to.be.revertedWith(onlyOwnerReason);
  });

  it("Should correctly mint n NFT in one single tx", async function () {
    const [greeter, nft] = await deploy();

    /* batchMint params */
    const target = nft.address;
    const quantity = 10;
    const price = 0.001;

    const initialCounter = await nft.getTokenCounter();
    const batchMint = await greeter.batchMint(
      target,
      ethers.utils.parseEther(`${price}`),
      ethers.BigNumber.from(quantity),
      { value: ethers.utils.parseEther(`${price * quantity}`) }
    );

    // wait until the transaction is mined
    await batchMint.wait();

    // Check if the correct number of NFTs were minted
    const balance = await nft.balanceOf(greeter.address);
    expect(balance).to.equal(ethers.BigNumber.from(quantity));

    // Check if the counter was incremented by the correct amount
    const updatedCounter = await nft.getTokenCounter();
    expect(updatedCounter.toString()).to.equal(
      initialCounter.add(ethers.BigNumber.from(quantity))
    );
  });

  it("Should transfer the batch to approved people", async () => {
    const [_, account1] = await ethers.getSigners();
    const [greeter, nft] = await deploy([account1.address]);

    /* batchMint params */
    const target = nft.address;
    const quantity = 10;
    const price = 0.001;

    const initialCounter = await nft.getTokenCounter();
    const batchMint = await greeter
      .connect(account1)
      .batchMint(
        target,
        ethers.utils.parseEther(`${price}`),
        ethers.BigNumber.from(quantity),
        { value: ethers.utils.parseEther(`${price * quantity}`) }
      );

    // wait until the transaction is mined
    await batchMint.wait();

    // Check if the correct number of NFTs were minted
    const balanceOwner = await nft.balanceOf(greeter.address);
    expect(balanceOwner).to.equal(ethers.BigNumber.from(quantity));

    // Try to transfer all the batch
    const transferBatch = await greeter.connect(account1).transferBatch(
      target,
      new Array(quantity)
        .fill(null)
        .map((_, index) => initialCounter.add(ethers.BigNumber.from(index)))
    );

    // wait until the transaction is mined
    await transferBatch.wait();

    // Check if the contract transfered the NFTs to the correct address
    expect(await nft.balanceOf(greeter.address)).to.equal(
      ethers.constants.Zero
    );
    expect(await nft.balanceOf(account1.address)).to.equal(
      ethers.BigNumber.from(quantity)
    );
  });
});
