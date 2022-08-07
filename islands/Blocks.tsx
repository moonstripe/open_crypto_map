/** @jsx h */
import { h } from "preact";
import { tw } from "twind"
import { useState, useEffect } from "preact/hooks"
import Graph from './Graph.tsx'

interface BlocksProps {
    pathname: string
}

export default ({ pathname }: BlocksProps) => {
    const [bN, setBN] = useState<string | undefined>()
    const [blocks, setBlocks] = useState<string[]>([])
    const [selectedBlock, setSelectedBlock] = useState<string | undefined>()

    const handleChange = (e)=> {
        setBN(e.target.value)
    }

    useEffect(() => {
        const getStream = async () => {
            // get from stream
            const res = await fetch('/api');

            let result;

            const reader: ReadableStreamDefaultReader<Uint8Array> | undefined = res?.body?.getReader();

            const decoder = new TextDecoder()

            while (!result?.done) {
                result = await reader?.read();
                const chunk = decoder.decode(result?.value)
                setBlocks(blocks => [...blocks, chunk])
            }
        }

        getStream().catch(console.error)
    }, [])

    return (
        <div class={tw`grid grid-cols-4`}>

            <div class={tw`col-span-1 flex flex-col`}>

                {
                    blocks?.length > 0 ? (
                        <select onChange={handleChange} class={tw`my-t w-3/4 mx-auto`}>
                             <option class={tw`my-3 text-green-400`}>Choose a block</option>
                            {
                                blocks.map((e) => (
                                    <option class={tw`my-3 text-green-400`} value={e}>{e}</option>
                                ))
                            }

                        </select>

                    ) : <select><option class={tw`my-3 text-green-400`}>Loading blocks...</option></select>
                }
            </div>
            <div class={tw`col-span-3`}>
                { bN ? <Graph blockNumber={bN} pathname={pathname}/> : null }
            </div>
        </div>
    )
}