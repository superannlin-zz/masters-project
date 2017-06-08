// neighborhood
//var nbrhood = d3.select("body").append("div")	
//		.attr("class", "nbrhood-tooltip")				
//		.style("opacity", 0);
//	svg.selectAll("census").data(general.features).enter().append("path")
//		.attr("d", path)
//		.attr("class","neighborhood")
//		.attr('data-id', function(d) {return d.properties.nid;})
//		.attr('data-name', function(d) {return d.properties.nbrhood;})
////		.attr('population', function(d) {return nbrhood_data[d.properties.nbrhood] ? 	nbrhood_data[d.properties.nbrhood] : 0;})
//		.style('fill-opacity',0)
//		.style('visibility','hidden');

//	$('svg path.neighborhood').on("mouseover", function() {
//		//$("#details").text("Neighborhood: " + d3.select(this).attr('data-name') + ", " + "Population: " + d3.select(this).attr('population'));
//		nbrhood.transition()		
//        	.duration(200)		
//            .style("opacity", .9);
//		nbrhood.html("Neighborhood: " + d3.select(this).attr('data-name'))
//			.style("left", ($(this).position().left) + "px")		
//            .style("top", ($(this).position().top - 28) + "px");
//	});
//	
//	$('svg path.neighborhood').on("mouseout", function(){
//		nbrhood.transition()		
//            .duration(500)		
//            .style("opacity", 0);	
//	});