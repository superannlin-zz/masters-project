d3.queue()
  .defer(d3.json, "neighborhood.json")
  .defer(d3.json, "neighborhood-general.json")
  .defer(d3.csv, "census.csv")
  .defer(d3.csv, "petitions-cleaned.csv")
  .await(drawMap);

function drawMap(error, neighborhood, general, census, petitions) {
	if (error) throw error;
	var width = 600, height = 700;
	
	// Define the div for the tooltip
	var tract = d3.select("body").append("div")	
		.attr("class", "tract-tooltip")				
		.style("opacity", 0);
	
	var nbrhood = d3.select("body").append("div")	
		.attr("class", "nbrhood-tooltip")				
		.style("opacity", 0);

	var svg = d3.select("body").append("svg").attr("width", width).attr("height", height);

	var projection = d3.geo.mercator().scale(1).translate([0, 0]).precision(0);
	var path = d3.geo.path().projection(projection);
	var bounds = path.bounds(general);
//	var bounds = path.bounds(neighborhood);
	
	xScale = width / Math.abs(bounds[1][0] - bounds[0][0]);
	yScale = height / Math.abs(bounds[1][1] - bounds[0][1]);
	scale = xScale < yScale ? xScale : yScale;

	var transl = [(width - scale * (bounds[1][0] + bounds[0][0])) / 2, (height - scale * (bounds[1][1] + bounds[0][1])) / 2];
	projection.scale(scale).translate(transl);
	
	var tract_data = {};
	
	for (var key in census) {
		var geoid = "0"+census[key].TargetGeoId2.toString();
		var pop = census[key].Population;
		tract_data[geoid] = pop;
	}
	
	var color = d3.scale.threshold()
		.domain([0,100,500,1000,2500,5000,7500,10000,12500])
	    .range(d3.schemeBlues[9]);
	
	// census tracts
	svg.selectAll("path").data(neighborhood.features).enter().append("path")
		.attr("d", path)
		.attr("class","census")
		.attr('data-id', function(d) {return d.properties.geoid;})
		.attr('data-name', function(d) {return d.properties.nhood;})
		.attr('population', function(d) {return tract_data[d.properties.geoid] ? tract_data[d.properties.geoid] : 0;})
		.style("fill", function(d){return color(tract_data[d.properties.geoid] ? tract_data[d.properties.geoid] : 0);});
	
	$('svg path.census').on("mouseover", function() {
//		$("#details").text("Neighborhood: " + d3.select(this).attr('data-name') + ", " + "Population: " + d3.select(this).attr('population'));
		tract.transition()		
        	.duration(200)		
            .style("opacity", .9);
		tract.html("Neighborhood: " + d3.select(this).attr('data-name') + "<br>" + "Population: " + d3.select(this).attr('population'))
			.style("left", ($(this).position().left) + "px")		
            .style("top", ($(this).position().top - 28) + "px");
	});
	
	$('svg path.census').on("mouseout", function(){
		tract.transition()		
            .duration(500)		
            .style("opacity", 0);	
	});
	
	// neighborhood
	svg.selectAll("census").data(general.features).enter().append("path")
		.attr("d", path)
		.attr("class","neighborhood")
		.attr('data-id', function(d) {return d.properties.nid;})
		.attr('data-name', function(d) {return d.properties.nbrhood;})
//		.attr('population', function(d) {return nbrhood_data[d.properties.nbrhood] ? 	nbrhood_data[d.properties.nbrhood] : 0;})
		.style('fill-opacity',0)
		.style('visibility','hidden');

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
	
//	var tract = true;
//	var neighborhood = false;
	
//	d3.select("#nbrhood-button").on("click", function(){
//		console.log('hi');
//		d3.select("path.neighborhood").style('visibility','visible');
//		d3.select("path.census").style('outline', 'none');
//	});
	
	// plot rent petitions
	var pts = [];
	var colors = {'2010': 'white','2011': 'pink','2012':'purple','2013':'blue', '2014': 'green', '2015': 'yellow', '2016': 'orange', '2017': 'red'};
	for (var key in petitions) {
		var loc0 = parseFloat(petitions[key].Location0);
		var loc1 = parseFloat(petitions[key].Location1);
		var year = parseFloat(petitions[key].Year);
		if (!isNaN(projection([loc0,loc1])[0]) && !isNaN(projection([loc0,loc1])[1]) && parseInt(year) >= 2010) {
			pts.push([[loc0,loc1],year]);
		}
//		if (pts.length == 1000) {break;}
	}

	svg.selectAll("circle")
		.data(pts).enter()
		.append("circle")
		.attr("cx", function (d) { return projection(d[0])[0]; })
		.attr("cy", function (d) { return projection(d[0])[1]; })
		.attr("r", "2px")
		.attr("fill", function (d) { return colors[d[1]]; })
		.attr("year", function (d) { return d[1]; })
	
	d3.select(".circle").on("mouseover", function(){
		console.log(d3.select(this).attr('year'));
	});
//	d3.select(".circle").on("mouseout", function(){
//	});
	
}	
