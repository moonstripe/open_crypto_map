/** @jsx h */
import { h } from "preact";
import { tw } from "@twind"
import { PageProps } from "fresh/server.ts";

export default function Greet(props: PageProps) {
  return <div>Looks like you're lost. <a href='/' class={tw`text-blue-400`}>return home</a></div>;
}
