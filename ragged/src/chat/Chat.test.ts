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
                        text: "This is a test message to the adapter"
                    }
                ]
            });
        });

        it("returns just the responses", async () => {
            const expectedOutput: Message[] = [
                {
                    type: "bot",
                    text: "This is a test response from the adapter"
                }
            ];

            adapter.chat.mockResolvedValue({ history: expectedOutput });

            const history = await c.chat(`This is a test message to the adapter`, [{
                type: "system",
                text: "This is a system message"
            }]);

            expect(history).toMatchObject([
                ...expectedOutput
            ] as Message[]);
        });

        it("can chat even without a history of messages", async () => {
            const expectedOutput: Message[] = [
                {
                    type: "bot",
                    text: "This is a test response from the adapter"
                }
            ];

            adapter.chat.mockResolvedValue({ history: expectedOutput });

            const history = await c.chat(`This is a test message to the adapter`);

            expect(history).toMatchObject([
                ...expectedOutput
            ] as Message[]);
        });

        it("includes errors in the response", async () => {
            adapter.chat.mockRejectedValue(new Error("This is an error"));

            const history = await c.chat(`This is a test message to the adapter`);

            expect(history).toMatchObject([
                {
                    type: "error",
                    text: "This is an error"
                }
            ] as Message[]);
        });

        it("includes unknown errors in the response", async () => {
            adapter.chat.mockRejectedValue({});

            const history = await c.chat(`This is a test message to the adapter`);

            expect(history).toMatchObject([
                {
                    type: "error",
                    text: "An unknown error occurred"
                }
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
                        text: "This is a test response from the adapter"
                    }
                ]
            });

            let messages = await c.chat(`This is a test message to the adapter`);

            expect(messages).toMatchObject([
                {
                    type: "user",
                    text: `This is a test message to the adapter`
                },
                {
                    type: "bot",
                    text: "This is a test response from the adapter"
                }
            ] as Message[]);

            // and one more try

            adapter.chat.mockResolvedValue({
                history: [
                    {
                        type: "bot",
                        text: "This is the last test response from the adapter"
                    }
                ]
            });

            messages = await c.chat(`This is another test message to the adapter`);

            const expectedValue = [
                {
                    type: "user",
                    text: `This is a test message to the adapter`
                },
                {
                    type: "bot",
                    text: "This is a test response from the adapter"
                },
                {
                    type: "user",
                    text: `This is another test message to the adapter`
                },
                {
                    type: "bot",
                    text: "This is the last test response from the adapter"
                }
            ] as Message[];

            expect(messages).toMatchObject(expectedValue);
            expect(c.history).toMatchObject(expectedValue);
        });

        it("should ignore the history passed in", async () => {
            c.record(true);

            // adapter should return just the LLM response
            adapter.chat.mockResolvedValue({
                history: [
                    {
                        type: "bot",
                        text: "This is a test response from the adapter"
                    }
                ]
            });

            const messages = await c.chat(`This is a test message to the adapter`, [
                {
                    type: "user",
                    text: "This message will be totally ignored"
                }
            ]);

            expect(messages).toMatchObject([
                {
                    type: "user",
                    text: `This is a test message to the adapter`
                },
                {
                    type: "bot",
                    text: "This is a test response from the adapter"
                }
            ] as Message[]);
        });

        it("includes errors in the response", async () => {
            c.record(true);

            adapter.chat.mockRejectedValue(new Error("This is an error"));

            const history = await c.chat(`This is a test message to the adapter`);

            expect(history).toMatchObject([
                {
                    type: "user",
                    text: `This is a test message to the adapter`
                },
                {
                    type: "error",
                    text: "This is an error"
                }
            ] as Message[]);
        });

        it("includes unknown errors in the response", async () => {
            c.record(true);

            adapter.chat.mockRejectedValue({});

            const messages = await c.chat(`This is a test message to the adapter`);

            expect(messages).toMatchObject([
                {
                    type: "user",
                    text: `This is a test message to the adapter`
                },
                {
                    type: "error",
                    text: "An unknown error occurred"
                }
            ] as Message[]);
        });
    })
});