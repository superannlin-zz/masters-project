d3.queue()
  .defer(d3.json, "neighborhood.json")
  .defer(d3.json, "neighborhood-general.json")
  .defer(d3.csv, "census.csv")
  .defer(d3.csv, "petitions-capital-improvement.csv")
  .defer(d3.csv, "petitions-unlawful-rent-increase.csv")
  .defer(d3.csv, "stopsoutput.csv")
  .await(drawMap);

function drawMap(error, neighborhood, general, census, petitions_tenant, petitions_renter, stops) {
	if (error) throw error;
	var width = 550, height = 550;
	
	// Define the div for the tooltip
	var tract = d3.select("body").append("div")	
		.attr("class", "tract-tooltip")				
		.style("opacity", 0);

	var svg = d3.select("body").append("svg")
		.attr("width", width)
		.attr("height", height)
		.append("g");

	var g = svg.append("g");
	
	// Define bounds for map
	var projection = d3.geo.mercator().scale(1).translate([0, 0]).precision(0);
	var path = d3.geo.path().projection(projection);
	var bounds = path.bounds(general);
	
	var zoom = d3.behavior.zoom()
    .scaleExtent([1, 8])
    .on("zoom", zoomed);
	
	svg
    .call(zoom)
    .call(zoom.event);
	
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
	
	// Draw census tracts
	g.selectAll("path").data(neighborhood.features).enter().append("path")
		.attr("d", path)
		.attr("class","census")
		.attr('data-id', function(d) {return d.properties.geoid;})
		.attr('data-name', function(d) {return d.properties.nhood;})
		.attr('population', function(d) {return tract_data[d.properties.geoid] ? tract_data[d.properties.geoid] : 0;})
		.style("fill", function(d){return color(tract_data[d.properties.geoid] ? tract_data[d.properties.geoid] : 0);});
	
	$('svg path.census').on("mouseover", function() {
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
	
	// Draw rent petitions
	var pts = [];
	for (var key in petitions_tenant) {
		var loc0 = parseFloat(petitions_tenant[key].Location0);
		var loc1 = parseFloat(petitions_tenant[key].Location1);
		var year = parseFloat(petitions_tenant[key].Year);
		
		if (!isNaN(projection([loc0,loc1])[0]) && !isNaN(projection([loc0,loc1])[1]) && parseInt(year) >= 2010) {
			pts.push([[loc0,loc1],year]);
		}
	}

	g.selectAll("circle")
		.data(pts).enter()
		.append("circle")
		.attr("class", function(d) {return "tenantyear"+d[1];})
		.attr("cx", function (d) { return projection(d[0])[0]; })
		.attr("cy", function (d) { return projection(d[0])[1]; })
		.attr("r", "2px")
		.attr("fill", "red")
		.attr("stroke", "black")
//		.attr("fill", function (d) { return colors[d[1]]; })
		.attr("year", function (d) { return d[1]; })
		.attr("visibility","hidden");
	
	for (var key in petitions_renter) {
		var loc0 = parseFloat(petitions_renter[key].Location0);
		var loc1 = parseFloat(petitions_renter[key].Location1);
		var year = parseFloat(petitions_renter[key].Year);
		
		if (!isNaN(projection([loc0,loc1])[0]) && !isNaN(projection([loc0,loc1])[1]) && parseInt(year) >= 2010) {
			pts.push([[loc0,loc1],year]);
		}
	}
	
	g.selectAll("circle")
		.data(pts).enter()
		.append("circle")
		.attr("class", function(d) {return "renteryear"+d[1];})
		.attr("cx", function (d) { return projection(d[0])[0]; })
		.attr("cy", function (d) { return projection(d[0])[1]; })
		.attr("r", "2px")
		.attr("stroke", "black")
		.attr("fill", "yellow")
	//		.attr("fill", function (d) { return colors[d[1]]; })
		.attr("year", function (d) { return d[1]; })
		.attr("visibility","hidden");
	
	var buttons = d3.select("body").append("div");
	var years = ["2010","2011","2012","2013","2014","2015","2016","2017"]
	
	buttons.append("button").text("2010").on("click", function(){
		g.selectAll("circle").attr("visibility","hidden");
		g.selectAll(".tenantyear2010").attr("visibility","visible");	
		g.selectAll(".renteryear2010").attr("visibility","visible");	
	});
	
	buttons.append("button").text("2011").on("click", function(){
		g.selectAll("circle").attr("visibility","hidden");
		g.selectAll(".tenantyear2011").attr("visibility","visible");	
		g.selectAll(".renteryear2011").attr("visibility","visible");	
	});
	
	buttons.append("button").text("2012").on("click", function(){
		g.selectAll("circle").attr("visibility","hidden");
		g.selectAll(".tenantyear2012").attr("visibility","visible");	
		g.selectAll(".renteryear2012").attr("visibility","visible");	
	});
	
	buttons.append("button").text("2013").on("click", function(){
		g.selectAll("circle").attr("visibility","hidden");
		g.selectAll(".tenantyear2013").attr("visibility","visible");	
		g.selectAll(".renteryear2013").attr("visibility","visible");	
	});
	
	buttons.append("button").text("2014").on("click", function(){
		g.selectAll("circle").attr("visibility","hidden");
		g.selectAll(".tenantyear2014").attr("visibility","visible");	
		g.selectAll(".renteryear2014").attr("visibility","visible");	
	});
	
	buttons.append("button").text("2015").on("click", function(){
		g.selectAll("circle").attr("visibility","hidden");
		g.selectAll(".tenantyear2015").attr("visibility","visible");	
		g.selectAll(".renteryear2015").attr("visibility","visible");	
	});
	
	buttons.append("button").text("2016").on("click", function(){
		g.selectAll("circle").attr("visibility","hidden");
		g.selectAll(".tenantyear2016").attr("visibility","visible");	
		g.selectAll(".renteryear2016").attr("visibility","visible");	
	});
	
	buttons.append("button").text("2017").on("click", function(){
		g.selectAll("circle").attr("visibility","hidden");
		g.selectAll(".tenantyear2017").attr("visibility","visible");	
		g.selectAll(".renteryear2017").attr("visibility","visible");	
	});
	
//  plot bus stops
	var pts = [];
	for (var key in stops) {
		var loc0 = parseFloat(stops[key].long);
		var loc1 = parseFloat(stops[key].lat);
		var stop = (stops[key].Location);
		if (!isNaN(projection([loc0,loc1])[0]) && !isNaN(projection([loc0,loc1])[1])) {
			pts.push([[loc0,loc1],stop]);
		}
	}

//	g.selectAll("rect")
//		.data(pts).enter()
//		.append("rect")
//		.attr("x", function (d) { return projection(d[0])[0]; })
//		.attr("y", function (d) { return projection(d[0])[1]; })
//		.attr("width", "4px")
//		.attr("height", "4px")
//		.attr("fill", "black")
//		.attr("stroke","black")
//		.attr("stop", function(d) { console.log(d[1]); return d[1]; })
//		.attr("visibility","visible");
	
	g.selectAll("text")
		.data(pts).enter()
		.append("text")
		  .attr("x", function (d) { return projection(d[0])[0]; })
		  .attr("y", function (d) { return projection(d[0])[1]; })
		  .attr("style","font-family:FontAwesome")
		  .attr("fill","white")
		  .attr("font-size","10px")
		  .attr("dx","-.2em")
		  .attr("dy", ".55em")
		  .text(function(d) {return '\uf207'});

	function zoomed() {
		console.log("zooming");
  		g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
	}
	
	d3.select(self.frameElement).style("height", height + "px");
	
}

	

	
	

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
