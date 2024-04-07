import { Ragged, RaggedTool } from "../../ragged/main";
import dotenv from "dotenv";
dotenv.config();

const ragged = new Ragged({
  openai: {
    apiKey: process.env.OPENAI_CREDS,
  },
});

async function main() {
  const adder = new RaggedTool()
    .title("adder")
    .example({
      description: "Add two numbers together",
      input: [1, 2],
      output: 3,
    })
    .example({
      description: "Empty array will return 0",
      input: [],
      output: 0,
    })
    .handler((input: number[]) => {
      const result = input.reduce((a, b) => a + b, 0);
      console.log(result);
      return result;
    });

  const r = await ragged.predict("Add 1124124 and 14151512", {
    model: "gpt-4",
    tools: [adder],
  });

  console.log(r);
}

main().then(console.log).catch(console.error);