# Installation and Instantiation

:::warning

Ragged is actively under development. It is working and can be used, but we do not yet consider it production ready because its API is still rapidly changing. We expect Ragged to be production ready by some time in July 2024.

:::

You can install Ragged directly from [npm](https://www.npmjs.com/package/ragged).

```sh
# npm
npm install --save --save-exact openai rxjs ragged

#pnpm
pnpm install --save --save-exact openai rxjs ragged

#yarn
yarn add -E openai rxjs ragged
```

Ragged has 2 peer dependencies:

* `openai`, which is the official JavaScript client for OpenAI, the only LLM we currently support.
* `rxjs`, which provides a reactive event-based interface that is used by Ragged for stream management support.

We soon plan to wrap the dependency on `rxjs` into Ragged itself, so that it is no longer a peer dependency. 

We have no immediate plans for removing `openai`. It's likely that, as we add more drivers, we will encounter more pressure from developers to remove `openai`. We will do so when the time is right.

# Instantiating Ragged

You can instantiate Ragged in one of two ways.

## With a config object

```ts
import { Ragged } from "ragged";

const OPENAI_API_KEY = "your api key"

const r = new Ragged({
  provider: "openai",
  config: {
    apiKey: OPENAI_API_KEY,
    // You need the following line if you're in a browser. See OpenAI client docs.
    dangerouslyAllowBrowser: true
  },
});
```

## With a driver instance

```ts
import { Ragged, OpenAiRaggedDriver } from "ragged";

const OPENAI_API_KEY = "your api key"

const driver = new OpenAiRaggedDriver({
    apiKey: "test-api-key",
});

const r = new Ragged(driver);
```