/** @jsx h */
import { h } from "preact";
import { tw } from "@twind"
import { useEffect, useRef, useState } from "preact/hooks"
import * as d3 from 'd3'
import { forceSimulation } from 'd3-force';

interface SocketClientProps {
    blockNumber: string;
    N: Record<string, string>[];
    E: Record<string, string>[];
}

export default ({ blockNumber, N, E }: SocketClientProps) => {
    const [selectedNode, setSelectedNode] = useState<string>('');

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
        const svgElement = d3.select(ref.current)

        if (N.length > 0) {
            // compute values
            const nodesId = d3.map(N, (n: any) => n.id).map(intern);
            const nodeTitles = d3.map(N, (_: any, i: any) => nodesId[i]).map(intern);
            const edgesSource = d3.map(E, ({ source }: any) => source).map(intern);
            const edgesTarget = d3.map(E, ({ target }: any) => target).map(intern);
            const edgesValue = d3.map(E, ({ value }: any) => value).map(intern);

            // Replace the input nodes and links with mutable objects for the simulation.
            const nodes = d3.map(N, (_: any, i: any) => ({ id: nodesId[i] }));
            const links = d3.map(E, (_: any, i: any) => ({ source: edgesSource[i], target: edgesTarget[i], weight: edgesValue[i] }));

            // Get highest and Lowest Weight for color scaling
            let highest: number = 0;
            const lowest: number = 0;

            links.map((l, i) => parseFloat(l.weight) > highest ? highest = parseFloat(l.weight) : null)

            console.log(highest, lowest)

            const forceNode = d3.forceManyBody().strength(0.01);
            const forceLink = d3.forceLink(links).id(({ index: i }: any) => nodesId[i]);
            const forceCollision = d3.forceCollide().radius(5);

            const simulation = forceSimulation(nodes)
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
            const markerWidth = markerBoxWidth / 2;
            const markerHeight = markerBoxHeight / 2;
            const arrowPoints = [[0, 1], [0, 3], [4, 2]];

            svgElement
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


            const link = svgElement.append("g")
                .selectAll("line")
                .data(links)
                .join("line")
                .attr('stroke-linecap', 'rounded')
                .style("stroke", (d: any) => {
                    return color(parseFloat(d.weight))
                })
                .attr('marker-end', 'url(#arrow)')
                .attr("stroke-opacity", 0.6)
                .attr("stroke-width", 1.5);



            link.append('title').text(({ index: i }) => edgesValue[i])

            const node = svgElement.append("g")
                .attr("fill", "nodeFill")
                .attr("stroke", "#999")
                .attr("stroke-opacity", 1)
                .attr("stroke-width", 0.5)
                .selectAll("circle")
                .data(nodes)
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

            // slow down with a small alpha
            simulation.alpha(0.5).restart()

            // stop simulation on unmount
            return () => { simulation.stop(); }
        }
    }, [])

    return (
        <div class={tw`text-green-400`}>
            {
                N.length > 0 ? (
                    <div id="graph">
                        <p>Current Block Number: {blockNumber}</p>
                        <p>Transaction Count: {E.length}</p>
                        {
                            selectedNode.length > 0 ? (
                                <p>Selected Node: <a class={tw`text-blue-400`} href={`https://etherscan.io/address/${selectedNode}`} target="_blank" rel="noopener noreferrer">{selectedNode}</a></p>
                            ) : null
                        }
                        <svg ref={ref} viewBox="-150 -150 300 300" style={{ position: 'absolute', top: '0px', left: '0px', width: "100vw", height: "100vh", zIndex: '-10' }} />
                    </div>
                ) : <p>Loading: {blockNumber}</p>
            }
        </div>
    )
}