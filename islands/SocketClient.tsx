/** @jsx h */
import { Fragment, h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks"
import { forceSimulation } from 'd3-force';


interface SocketClientProps {
    blockNumber: string;
    N: Record<string, string>[],
    E: Record<string, string>[]
}

interface NodesEdgesMeta {
    nodes: Record<string, string>[];
    edges: Record<string, string>[];
    count: number
}

export default ({ blockNumber, N, E }: SocketClientProps) => {
    const ref = useRef(null)

    useEffect(() => {
        const svgElement = d3.select(ref.current)
        if (N.length > 0) {
            // compute values
            const nodesId = d3.map(N, n => n.id).map(intern);
            const nodeTitles = d3.map(N, (_, i) => nodesId[i]).map(intern);
            const edgesSource = d3.map(E, ({ source }) => source).map(intern);
            const edgesTarget = d3.map(E, ({ target }) => target).map(intern);
            const edgesValue = d3.map(E, ({ value }) => value).map(intern);

            // Replace the input nodes and links with mutable objects for the simulation.
            let nodes = d3.map(N, (_, i) => ({ id: nodesId[i] }));
            let links = d3.map(E, (_, i) => ({ source: edgesSource[i], target: edgesTarget[i], weight: edgesValue[i] }));

            const forceNode = d3.forceManyBody().strength(0.01);
            const forceLink = d3.forceLink(links).id(({ index: i }) => nodesId[i]);

            const simulation = forceSimulation(nodes)
                .force("charge", forceNode)
                .force("link", forceLink)

            const link = svgElement.append("g")
                .attr("stroke", "#999")
                .attr("stroke-opacity", 0.6)
                .attr("stroke-width", 1.5)
                .attr("stroke-linecap", "round")
                .selectAll("line")
                .data(links)
                .join("line");

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

            node.append("title").text(({ index: i }) => nodeTitles[i]);

            // update state on every frame
            simulation.on("tick", () => {
                link
                    .attr("x1", d => d.source.x)
                    .attr("y1", d => d.source.y)
                    .attr("x2", d => d.target.x)
                    .attr("y2", d => d.target.y);

                node
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y);
            })

            // slow down with a small alpha
            simulation.alpha(0.5).restart()

            function intern(value) {
                return value !== null && typeof value === "object" ? value.valueOf() : value;
            }

            function drag(simulation) {
                function dragstarted(event) {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    event.subject.fx = event.subject.x;
                    event.subject.fy = event.subject.y;
                }

                function dragged(event) {
                    event.subject.fx = event.x;
                    event.subject.fy = event.y;
                }

                function dragended(event) {
                    if (!event.active) simulation.alphaTarget(0);
                    event.subject.fx = null;
                    event.subject.fy = null;
                }

                return d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended);
            }

            // stop simulation on unmount
            return () => simulation.stop()
        }
    }, [])

    return (
        <div>
            {
                N.length > 0 ? (
                    <Fragment>
                        <p>Current Block Number: {blockNumber}</p>
                        <p>Transaction Count: {E.length}</p>
                        <svg ref={ref} viewBox="-150 -150 300 300" style={{ position: 'absolute', top: '0', left: '0', width: "100vw", height: "100vh", zIndex: '-10'}} />
                    </Fragment>
                ) : <p>Loading: {blockNumber}</p>
            }
        </div>
    )
}