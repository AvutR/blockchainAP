async function main() {
  for (let i = 0; i < 6; i++) {
    await network.provider.send("evm_mine");
  }
}
main();
