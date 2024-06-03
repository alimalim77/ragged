import { Chat } from ".";
import { Message } from "./index.types";
import { BaseChatAdapter } from "./provider/index.types";
import { DeepMockProxy, mockDeep } from "jest-mock-extended";

describe("Chat", () => {
    let adapter: DeepMockProxy<BaseChatAdapter>;
    let c: Chat;

    beforeEach(() => {
        adapter = mockDeep<BaseChatAdapter>();
        c = new Chat(adapter);
    });

    describe("Default behaviour", () => {
        it("Calls the adapter with the correct request", async () => {
            adapter.chat.mockResolvedValue({ history: [] });

            await c.chat(`This is a test message to the adapter`);

            expect(adapter.chat).toHaveBeenCalledWith({
                history: [
                    {
                        type: "user",
                        text: "This is a test message to the adapter",
                    },
                ],
            });
        });

        it("returns the passed-in history, followed by the user prompt, and then the response below it.", async () => {
            adapter.chat.mockResolvedValue({
                history: [
                    {
                        type: "bot",
                        text: "This is a test response from the adapter",
                    },
                ],
            });

            const history = await c.chat(`This is a test message to the adapter`, [
                {
                    type: "system",
                    text: "This is a system message",
                },
            ]);

            expect(history).toMatchInlineSnapshot(`
        [
          {
            "text": "This is a system message",
            "type": "system",
          },
          {
            "text": "This is a test message to the adapter",
            "type": "user",
          },
          {
            "text": "This is a test response from the adapter",
            "type": "bot",
          },
        ]
      `);
        });

        it("can chat even without a history of messages", async () => {
            const expectedOutput: Message[] = [
                {
                    type: "bot",
                    text: "This is a test response from the adapter",
                },
            ];

            adapter.chat.mockResolvedValue({ history: expectedOutput });

            const history = await c.chat(`This is a test message to the adapter`);

            expect(history).toMatchObject([
                {
                    type: "user",
                    text: `This is a test message to the adapter`,
                },
                ...expectedOutput,
            ] as Message[]);
        });

        it("includes errors in the response", async () => {
            adapter.chat.mockRejectedValue(new Error("This is an error"));

            const history = await c.chat(`This is a test message to the adapter`);

            expect(history).toMatchObject([
                {
                    type: "user",
                    text: `This is a test message to the adapter`,
                },
                {
                    type: "error",
                    text: "This is an error",
                },
            ] as Message[]);
        });

        it("includes unknown errors in the response", async () => {
            adapter.chat.mockRejectedValue({});

            const history = await c.chat(`This is a test message to the adapter`);

            expect(history).toMatchObject([
                {
                    type: "user",
                    text: `This is a test message to the adapter`,
                },
                {
                    type: "error",
                    text: "An unknown error occurred",
                },
            ] as Message[]);
        });
    });

    describe("with recording", () => {
        it("should return the history of messages", async () => {
            c.record(true);

            // adapter should return just the LLM response
            adapter.chat.mockResolvedValue({
                history: [
                    {
                        type: "bot",
                        text: "This is a test response from the adapter",
                    },
                ],
            });

            let messages = await c.chat(`This is a test message to the adapter`);

            expect(messages).toMatchObject([
                {
                    type: "user",
                    text: `This is a test message to the adapter`,
                },
                {
                    type: "bot",
                    text: "This is a test response from the adapter",
                },
            ] as Message[]);

            // and one more try

            adapter.chat.mockResolvedValue({
                history: [
                    {
                        type: "bot",
                        text: "This is the last test response from the adapter",
                    },
                ],
            });

            messages = await c.chat(`This is another test message to the adapter`);

            const expectedValue = [
                {
                    type: "user",
                    text: `This is a test message to the adapter`,
                },
                {
                    type: "bot",
                    text: "This is a test response from the adapter",
                },
                {
                    type: "user",
                    text: `This is another test message to the adapter`,
                },
                {
                    type: "bot",
                    text: "This is the last test response from the adapter",
                },
            ] as Message[];

            expect(messages).toMatchObject(expectedValue);
            expect(c.history).toMatchObject(expectedValue);
        });

        it("should append the history passed in even when recording", async () => {
            c.record(true);

            // adapter should return just the LLM response
            adapter.chat.mockResolvedValue({
                history: [
                    {
                        type: "bot",
                        text: "This is a test response from the adapter",
                    },
                ],
            });

            const messages = await c.chat(`This is a test message to the adapter`, [
                {
                    type: "system",
                    text: "This message will be appended in the history",
                },
            ]);

            expect(messages).toMatchObject([
                {
                    type: "system",
                    text: "This message will be appended in the history",
                },
                {
                    type: "user",
                    text: `This is a test message to the adapter`,
                },
                {
                    type: "bot",
                    text: "This is a test response from the adapter",
                },
            ] as Message[]);
        });

        it("includes errors in the response", async () => {
            c.record(true);

            adapter.chat.mockRejectedValue(new Error("This is an error"));

            const history = await c.chat(`This is a test message to the adapter`);

            expect(history).toMatchObject([
                {
                    type: "user",
                    text: `This is a test message to the adapter`,
                },
                {
                    type: "error",
                    text: "This is an error",
                },
            ] as Message[]);
        });

        it("includes unknown errors in the response", async () => {
            c.record(true);

            adapter.chat.mockRejectedValue({});

            const messages = await c.chat(`This is a test message to the adapter`);

            expect(messages).toMatchObject([
                {
                    type: "user",
                    text: `This is a test message to the adapter`,
                },
                {
                    type: "error",
                    text: "An unknown error occurred",
                },
            ] as Message[]);
        });

        it("should stop recording when record(false) is called", async () => {
            c.record(true);

            adapter.chat.mockResolvedValue({
                history: [
                    {
                        type: "bot",
                        text: "This is a test response from the adapter",
                    },
                ],
            });

            await c.chat(`Message 1`);
            await c.chat(`Message 2`);

            expect(c.history).toHaveLength(4);

            c.record(false);

            const response3 = await c.chat(`Message 3`);
            expect(response3).toHaveLength(6);
            expect(c.history).toHaveLength(4);
            expect(response3).toMatchObject([
                {
                    type: "user",
                    text: `Message 1`,
                },
                {
                    type: "bot",
                    text: "This is a test response from the adapter",
                },
                {
                    type: "user",
                    text: `Message 2`,
                },
                {
                    type: "bot",
                    text: "This is a test response from the adapter",
                },
                {
                    type: "user",
                    text: `Message 3`,
                },
                {
                    type: "bot",
                    text: "This is a test response from the adapter",
                },
            ] as Message[]);

            const response4 = await c.chat(`Message 4`);
            expect(response4).toHaveLength(6);
            expect(c.history).toHaveLength(4);
            expect(response4).toMatchObject([
                {
                    type: "user",
                    text: `Message 1`,
                },
                {
                    type: "bot",
                    text: "This is a test response from the adapter",
                },
                {
                    type: "user",
                    text: `Message 2`,
                },
                {
                    type: "bot",
                    text: "This is a test response from the adapter",
                },
                {
                    type: "user",
                    text: `Message 4`,
                },
                {
                    type: "bot",
                    text: "This is a test response from the adapter",
                },
            ] as Message[]);


            expect(c.history).toMatchObject([
                {
                    type: "user",
                    text: `Message 1`,
                },
                {
                    type: "bot",
                    text: "This is a test response from the adapter",
                },
                {
                    type: "user",
                    text: `Message 2`,
                },
                {
                    type: "bot",
                    text: "This is a test response from the adapter",
                },
            ] as Message[]);
        });

        describe("immutability", () => {
            it("returns a new copy of history when .history is called", async () => {
                c.record(true);

                adapter.chat.mockResolvedValue({
                    history: [
                        {
                            type: "bot",
                            text: "This is a test response from the adapter",
                        },
                    ],
                });

                await c.chat(`This is a test message to the adapter`);

                const history = c.history;

                history.push({
                    type: "user",
                    text: "This is a new message",
                });

                expect(c.history).not.toEqual(history);
            });

            it("returns a new instance of the user message in the return value", async () => {
                c.record(true);

                adapter.chat.mockResolvedValue({
                    history: [
                        {
                            type: "bot",
                            text: "This is a test response from the adapter",
                        },
                    ],
                });

                const response = await c.chat(`This is a test message to the adapter`);

                // sneakily manipulate the user's message in response
                response[0].text = "This is a new message";

                expect(c.history[0]).not.toEqual(response[0]);
            });
        });
    });
});