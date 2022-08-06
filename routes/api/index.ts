/** @jsx h */
import { HandlerContext } from "fresh/server.ts"
import { WebSocketClient, StandardWebSocketClient } from "websocket";
import Web3Utils from 'web3-utils'

const STREAM_INTERVAL = 2

export const handler = (_req: Request, _ctx: HandlerContext): Response => {
    // start alchemy socket to subscribe to
    let socketUrl = `wss://eth-mainnet.g.alchemy.com/v2/${Deno.env.get("ALCHEMY_TOKEN")}`
    const ws: WebSocketClient = new StandardWebSocketClient(socketUrl);

    let latestBlock: string | undefined; 
    let checkBlock: string | undefined; 

    ws.on("open", () => {
        console.log("connected to eth-mainnet (alchemy)")

        ws.send(JSON.stringify({jsonrpc:"2.0",id: 1, method: "eth_subscribe", params: ["newHeads"]}))

        // get
        ws.on('message', bN => {
            let subscription: string | undefined;

            const raw = JSON.parse(bN.data)
            console.log(raw)

            if (raw.id === 1) {
                subscription = Web3Utils.hexToNumberString(raw.result)
            }

            if (raw.params?.subscription) {
                // handle different subscriptions

                console.log(Web3Utils.hexToNumberString(raw.params.subscription))
                latestBlock = Web3Utils.hexToNumberString(raw.params.result.number)
            }
        })

    })
    console.log('hit customHandler')
    let timer: number;
    const body = new ReadableStream({
        start(controller) {

            timer = setInterval(() => {
                let message = `nothing for ${STREAM_INTERVAL} seconds.`;
                // grab data from alchemy
                if (latestBlock !== checkBlock) {
                    message = `found new block: ${latestBlock}`
                    controller.enqueue(latestBlock);
                }

                console.log(message)
                checkBlock = latestBlock
            }, 1000 * STREAM_INTERVAL);
        },
        cancel() {
            clearInterval(timer);
        },
    });
    return new Response(body.pipeThrough(new TextEncoderStream()), {
        headers: {
            "content-type": "text/plain; charset=utf-8",
        },
    });
};

