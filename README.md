# GNO/TORN collaboration

There is Tornado governance proposal for GNO/TORN collaboration.

## Tests

1. Install dependencies:

```
    yarn install
```

2. Create `.env` file with actual values from `.env.sample`.

3. Run tests:

```
    yarn test
```

4. Run linter:

```
    yarn lint
```

## Deploy

1. Check `proposal.sol` for actual hardcoded values.

2. Run deploy:

```
    npx hardhat run scripts/deploy.js --network <network-name>
```
