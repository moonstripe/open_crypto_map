/** @jsx h */
import { h } from "preact";
import { tw } from "@twind";
import { Handlers, PageProps } from "fresh/server.ts";
import Blocks from '../islands/Blocks.tsx'


export default function Home({}: PageProps) {
  return (
    <div class={tw`p-4 mx-auto max-w-screen-md`} style={{backgroundColor: '#253237'}}>
      <div class={tw`absolute top-0 left-0 w-screen h-screen`} style={{zIndex: "-100", backgroundColor: '#253237'}}/>
      <Blocks/>
    </div>
  );
}
