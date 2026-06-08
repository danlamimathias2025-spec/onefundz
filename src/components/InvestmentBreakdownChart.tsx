import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Investment } from '../types';

export default function InvestmentBreakdownChart({ investments }: { investments: Investment[] }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || investments.length === 0) return;

    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2;

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const color = d3.scaleOrdinal()
      .domain(investments.map(d => d.productName))
      .range(d3.schemeCategory10);

    const pie = d3.pie<Investment>()
      .value(d => d.amount);

    const arc = d3.arc<d3.PieArcDatum<Investment>>()
      .innerRadius(0)
      .outerRadius(radius);

    const arcs = svg.selectAll('arc')
      .data(pie(investments))
      .enter()
      .append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', (d) => color(d.data.productName) as string);

    arcs.append('text')
      .attr('transform', (d) => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .text(d => d.data.productName);

  }, [investments]);

  return <svg ref={svgRef}></svg>;
}
