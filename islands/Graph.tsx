/** @jsx h */
import { h } from "preact";
import { tw } from "@twind"
import { useEffect, useRef, useState } from "preact/hooks"
import * as d3 from 'd3'
import { forceSimulation } from 'd3-force';
import Web3Utils from 'web3-utils'

interface NodesEdgesMeta {
    nodes: Record<string, string>[];
    edges: Record<string, string>[];
    count: number
}


interface SocketClientProps {
    blockNumber: string;
    pathname: string;
}

export default ({ blockNumber, pathname }: SocketClientProps) => {
    console.log(pathname)
    const [nodes, setNodes] = useState<Record<string, string>[] | undefined>();
    const [edges, setEdges] = useState<Record<string, string>[] | undefined>();
    const [selectedNode, setSelectedNode] = useState<string | undefined>();

    const ref = useRef(null)

    const intern = (value: any) => {
        return value !== null && typeof value === "object" ? value.valueOf() : value;
    }

    const drag = (simulation: any) => {
        function dragstarted(event: any) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event: any) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event: any) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }

    useEffect(() => {

        const getTransactions = async () => {

            const root = `https://eth.moonstripe.com/v1/mainnet`

            const result = await fetch(
                new Request(root, {
                    method: 'POST',
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        method: 'eth_getBlockByNumber',
                        params: [Web3Utils.numberToHex(blockNumber), true],
                        id: 1,
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
            ).then(r => r.json());

            const transactions = result.result.transactions

            const returnData: NodesEdgesMeta = {
                nodes: [],
                edges: [],
                count: 0
            };

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
            });

            setNodes(returnData.nodes)
            setEdges(returnData.edges)

            return result
        }

        getTransactions()

    }, [blockNumber])

    useEffect(() => {
        if (nodes && edges) {

            console.log(nodes, edges)
            const svgElement = d3.select(ref.current)

            const jettison = svgElement.append('g')

            if (nodes.length > 0) {
                // compute values
                const nodesId = d3.map(nodes, (n: any) => n.id).map(intern);
                const nodeTitles = d3.map(nodes, (_: any, i: any) => nodesId[i]).map(intern);
                const edgesSource = d3.map(edges, ({ source }: any) => source).map(intern);
                const edgesTarget = d3.map(edges, ({ target }: any) => target).map(intern);
                const edgesValue = d3.map(edges, ({ value }: any) => value).map(intern);

                // Replace the input nodes and links with mutable objects for the simulation.
                const nodes_sim = d3.map(nodes, (_: any, i: any) => ({ id: nodesId[i] }));
                const links_sim = d3.map(edges, (_: any, i: any) => ({ source: edgesSource[i], target: edgesTarget[i], weight: edgesValue[i] }));

                // Get highest and lowest weight for color scaling
                let highest: number = 0;
                const lowest: number = 0;

                links_sim.map((l, i) => parseFloat(l.weight) > highest ? highest = parseFloat(l.weight) : null)

                console.log(highest, lowest)

                const forceNode = d3.forceManyBody().strength(0.01);
                const forceLink = d3.forceLink(links_sim).id(({ index: i }: any) => nodesId[i]);
                const forceCollision = d3.forceCollide().radius(5);

                const simulation = forceSimulation(nodes_sim)
                    .force("charge", forceNode)
                    .force("link", forceLink)
                    .force("collision", forceCollision)

                const color = d3.scaleLinear()
                    .domain([lowest, highest])
                    .range(["gray", "red"])
                    .interpolate(d3.interpolateCubehelix.gamma(3));

                // Define the arrowhead marker variables

                const markerBoxWidth = 20;
                const markerBoxHeight = 4;
                const refX = markerBoxWidth / 2;
                const refY = markerBoxHeight / 2;
                const arrowPoints = [[0, 1], [0, 3], [4, 2]];

                jettison
                    .append('defs')
                    .append('marker')
                    .attr('id', 'arrow')
                    .attr('viewBox', [0, 0, markerBoxWidth, markerBoxHeight])
                    .attr('width', "4px")
                    .attr('height', "4px")
                    .attr('refX', refX)
                    .attr('refY', refY)
                    .attr('markerWidth', markerBoxWidth)
                    .attr('markerHeight', markerBoxHeight)
                    .attr('orient', 'auto-start-reverse')
                    .append('path')
                    .attr('d', d3.line()(arrowPoints))
                    .attr('stroke', '#999')
                    .attr('fill', '#999')


                const link = jettison.append("g")
                    .selectAll("line")
                    .data(links_sim)
                    .join("line")
                    .attr('stroke-linecap', 'rounded')
                    .style("stroke", (d: any) => {
                        return color(parseFloat(d.weight))
                    })
                    .attr('marker-end', 'url(#arrow)')
                    .attr("stroke-opacity", 0.6)
                    .attr("stroke-width", 1.5);



                link.append('title').text(({ index: i }) => edgesValue[i])

                const node = jettison.append("g")
                    .attr("fill", "nodeFill")
                    .attr("stroke", "#999")
                    .attr("stroke-opacity", 1)
                    .attr("stroke-width", 0.5)
                    .selectAll("circle")
                    .data(nodes_sim)
                    .join("circle")
                    .attr("r", 2)
                    .call(drag(simulation))
                    .on("click", (d: any) => {
                        // setArray
                        if (d3.style(d3.select(d.target).node(), 'fill') !== 'rgb(0, 0, 0)') {

                            setSelectedNode('')
                        }

                        setSelectedNode(d3.select(d.target).node().children[0].__data__.id)

                        d3.selectAll("circle").attr("fill", "rgb(0, 0, 0)")

                        return d3.select(d.target).attr("fill", "rgb(96, 165, 250)")
                    })

                node.append("title").text(({ index: i }: any) => nodeTitles[i]);

                // update state on every frame
                simulation.on("tick", () => {
                    link
                        .attr("x1", (d: any) => d.source.x)
                        .attr("y1", (d: any) => d.source.y)
                        .attr("x2", (d: any) => d.target.x)
                        .attr("y2", (d: any) => d.target.y);

                    node
                        .attr("cx", (d: any) => d.x)
                        .attr("cy", (d: any) => d.y);
                })

                console.log('sim done')

                // slow down with a small alpha
                simulation.alpha(0.5).restart()

                // stop simulation on unmount
                return () => { simulation.stop(); jettison.remove() }
            }
        }
    }, [nodes, edges])

    return (
        <div class={tw`text-green-400`}>
            {
                pathname !== "/" ? (
                    <div>
                        <a class={tw`mt-6 text-green-700`} href={`/`}>home</a>
                        <p class={tw`my-6 text-green-400`}>Crypto-Map: Ethereum by <a class={tw`text-blue-400`} href={'https://www.kojinglick.com'} target="_blank" rel="noopener noreferrer">Kojin Glick</a></p>
                    </div>
                ) : null
            }
            <p>Current Block Number: {blockNumber}</p>
            <p>Transaction Count: {edges?.length}</p>

            <div id="graph">
                {
                    selectedNode ? (
                        <p>Selected Node: <a class={tw`text-blue-400`} href={`https://etherscan.io/address/${selectedNode}`} target="_blank" rel="noopener noreferrer">{selectedNode}</a></p>
                    ) : null
                }
                <svg ref={ref} viewBox="-150 -150 300 300" style={{ position: 'absolute', top: '0px', left: '0px', width: "100vw", height: "100vh", zIndex: '-10', backgroundColor: '#253237' }} />
            </div>
        </div>
    )
}