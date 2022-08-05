/** @jsx h */
import { h } from "preact";
import { tw } from "@twind";
import { Handlers, PageProps } from "fresh/server.ts";
import { WebSocketClient, StandardWebSocketClient } from 'websocket'
import Web3Utils from 'web3-utils'
import Graph from "../islands/Graph.tsx";

interface NodesEdgesMeta {
  nodes: Record<string, string>[];
  edges: Record<string, string>[];
  count: number
}


export const handler: Handlers = {
  async GET(req, ctx) {
    const token = Deno.env.get("ALCHEMY_TOKEN")
    const number = await fetch('https://eth.moonstripe.com/v1/mainnet', { method: "POST", body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 }) }).then(r => r.json())

    const endpoint = `wss://eth-mainnet.g.alchemy.com/v2/${token}`;
    const ws: WebSocketClient = new StandardWebSocketClient(endpoint);

    // ToDo, build pub sub model

    const returnData: NodesEdgesMeta = {
      nodes: [],
      edges: [],
      count: 0
    };

    await new Promise<void>((resolve, reject) => {
      ws.on("open", function () {
        const transactionQuery = JSON.stringify({
          "jsonrpc": "2.0",
          "method": "eth_getBlockByNumber",
          "params": [number.result, true],
          "id": 1
        });
  
        ws.send(transactionQuery);
      });
      ws.on("error", function (message) {console.log('socket error', req, message, endpoint)});
      ws.on("message", function (message) {
        // parse block data into transaction graph
        const cleaned = JSON.parse(message.data);
  
        const { transactions } = cleaned.result
  
        const hexCheck: string[] = [];
  
        transactions.forEach((t: any, i: number) => {
  
          returnData.count++;
  
          const { from, to, value } = t;
  
          const node_from: Record<string, string> = { "id": from }
  
          if (!hexCheck.includes(from)) {
            returnData.nodes.push(node_from)
            hexCheck.push(from)
          }
  
          const node_to: Record<string, string> = { "id": to }
  
          if (!hexCheck.includes(to)) {
            returnData.nodes.push(node_to);
            hexCheck.push(to)
          }
  
          const edge: Record<string, string> = {
            "source": from,
            "target": to,
            "value": Web3Utils.fromWei(Web3Utils.hexToNumberString(value), "ether").toString(),
          };
  
          returnData.edges.push(edge);
          resolve();
        });
      });
    })
    return await ctx.render({ nodes: returnData.nodes, edges: returnData.edges, bN: Web3Utils.hexToNumberString(number.result) })
  },
}

export default function Home({ data }: PageProps) {
  return (
    <div class={tw`p-4 mx-auto max-w-screen-md`}>
      <p class={tw`my-6 text-green-400`}>
        Crypto-Map: Ethereum by <a class={tw`text-blue-400`} href={'https://www.kojinglick.com'} target="_blank" rel="noopener noreferrer">Kojin Glick</a>
      </p>
      {
        data.nodes.length > 0 ? <Graph blockNumber={data.bN} N={data.nodes} E={data.edges} /> : null
      }
      <script src="https://d3js.org/d3.v7.min.js"></script>
    </div>
  );
}
