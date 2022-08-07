/** @jsx h */
import { h } from "preact"
import { useState, useCallback } from "preact/hooks"
import { tw } from "@twind";
import { PageProps } from "fresh/server.ts";
import Blocks from '../islands/Blocks.tsx'
import Graph from '../islands/Graph.tsx'


export default function Home({ url }: PageProps) {
  return (
    <main class={tw`p-4 mx-auto max-w-screen-md`} style={{ backgroundColor: '#253237' }}>
      <div class={tw`absolute top-0 left-0 w-screen h-screen`} style={{ zIndex: "-100", backgroundColor: '#253237' }} />
          <Blocks pathname={url.pathname}/>
    </main>
  );
}
