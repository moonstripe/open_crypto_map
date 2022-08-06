/** @jsx h */
import { h } from "preact";
import { tw } from "twind"
import { useState, useEffect } from "preact/hooks"
export default () => {
    const [blocks, setBlocks] = useState<string[]>([])

    useEffect(() => {
        const getStream = async () => {
            let msgs: string[] = [];
            // get from stream
            const res = await fetch('http://localhost:8000/api/');

            let result;

            const reader: ReadableStreamDefaultReader<Uint8Array> | undefined = res?.body?.getReader();

            const decoder = new TextDecoder()

            while (!result?.done) {
                result = await reader?.read();
                const chunk = decoder.decode(result?.value)
                console.log(chunk)
                setBlocks(messages => [...messages, chunk])
            }

            // console.log(string)

            // msgs.push(string)

            // setMessages(msgs)
        }

        getStream().catch(console.error)
    }, [])

    return (
        <main>
            <div>
                <p class={tw`my-6 text-green-400`}>
                    Ethereum Blocks!
                </p>
                <ul>
                    {
                        blocks?.length > 0 ? blocks.map((e) => (
                            <li class={tw`my-6 text-green-400`}><a href={`/${e}`} target="_blank" rel="noopener noreferrer">{e}</a></li>
                        )) : null
                    }
                </ul>
            </div>
        </main>
    )
}