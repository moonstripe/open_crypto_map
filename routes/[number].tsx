/** @jsx h */
import { h } from "preact";
import { tw } from "@twind";
import { Handlers, PageProps } from "fresh/server.ts";
import { WebSocketClient, StandardWebSocketClient } from 'websocket'
import Web3Utils from 'web3-utils'
import Graph from "../islands/Graph.tsx";


export default function GraphGen({ data, params, url }: PageProps) {
  return (
    <div class={tw`p-4 mx-auto max-w-screen-md`}>
      <Graph blockNumber={params.number} pathname={url.pathname}/>
      <script src="https://d3js.org/d3.v7.min.js"></script>
    </div>
  );
}
