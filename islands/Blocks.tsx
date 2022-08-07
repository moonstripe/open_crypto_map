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
            const res = await fetch('/api');

            let result;

            const reader: ReadableStreamDefaultReader<Uint8Array> | undefined = res?.body?.getReader();

            const decoder = new TextDecoder()

            while (!result?.done) {
                result = await reader?.read();
                const chunk = decoder.decode(result?.value)
                console.log(chunk)
                setBlocks(messages => [...messages, chunk])
            }
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
                            <li class={tw`my-3 text-green-400`}><a href={`/${e}`} target="_blank" rel="noopener noreferrer">{e}</a></li>
                        )) : <li class={tw`my-3 text-green-400`}>Waiting for new block update...</li>
                    }
                </ul>
            </div>
        </main>
    )
}