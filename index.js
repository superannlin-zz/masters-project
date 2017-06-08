d3.queue()
  .defer(d3.json, "data/neighborhood.json")
  .defer(d3.csv, "data/census.csv")
  .defer(d3.csv, "data/petitions-capital-improvement.csv")
  .defer(d3.csv, "data/petitions-unlawful-rent-increase.csv")
  .defer(d3.csv, "data/stopsoutput.csv")
  .defer(d3.csv, "data/listings-cleaned.csv")
  .await(drawMap);

function drawMap(error, neighborhood, census, petitions_landlord, petitions_renter, stops, listings) {
	if (error) throw error;
	var width = 550, height = 450;
	
	// Define the div for the tooltip
	var tract = d3.select("body").append("div")	
		.attr("class", "tract-tooltip")				
		.style("opacity", 0);

	var bus_tip = d3.select("body").append("div")
		.attr("class","bus-tooltip")
		.style("opacity", 0);
	
	var airbnb_tip = d3.select("body").append("div")
		.attr("class","airbnb-tooltip")
		.style("opacity", 0);
	
	var svg = d3.select("body").append("svg")
		.attr("width", width)
		.attr("height", height)
		.append("g");

	var g = svg.append("g");
	var g2 = svg.append("g");
	
	// Define bounds for map
	var projection = d3.geo.mercator().scale(1).translate([0, 0]).precision(0);
	var path = d3.geo.path().projection(projection);
	var bounds = path.bounds(neighborhood);
	
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
			.style("left", ($(this).position().left + 17) + "px")		
            .style("top", ($(this).position().top - 45) + "px");
	});
	
	// TODO list data sources and tools at bottom of page
	// TODO count petitions and airbnb listings per tract using: https://github.com/d3/d3-polygon
	
	$('svg path.census').on("mouseout", function(){
		tract.transition()		
            .duration(500)		
            .style("opacity", 0);	
	});
	
	//  plot Airbnb listings
	var pts = [];
	for (var key in listings) {
		var loc0 = parseFloat(listings[key].longitude);
		var loc1 = parseFloat(listings[key].latitude);
		var year = (listings[key].last_review_year);
		var roomtype = listings[key].room_type;
		var price = listings[key].price;
		if (!isNaN(projection([loc0,loc1])[0]) && !isNaN(projection([loc0,loc1])[1])) {
			pts.push([[loc0,loc1],year,roomtype,price]);
		}
	}
	
	g.selectAll("text")
		.data(pts).enter()
		.append("text")
		.attr("class", function(d) {return "airbnb listing"+d[1];})
//		.attr("class", function(d) {return "listing"+d[1];})
		.attr("x", function (d) { return projection(d[0])[0]; })
		.attr("y", function (d) { return projection(d[0])[1]; })
		.attr("year", function (d) {return d[1]})
		.attr("roomtype", function (d) {return d[2]})
		.attr("price", function (d) {return d[3]})
		.attr("dx","-.2em")
		.attr("dy", ".55em")
		.attr("stroke","black")
		.attr("stroke-width","0.05em")
		.attr("style","font-family:FontAwesome")
		.attr("fill","#fd5c63")
		.attr("font-size","10px")
		.attr("opacity","0.5")
		.text(function(d) {
			if (d[2] == "Private room") {
				return '\uf236';
			}
			else {
				return '\uf015';
			}
		})
		.attr("visibility","hidden");

	$('.airbnb').on("mouseover", function() {
		airbnb_tip.transition()		
        	.duration(200)		
            .style("opacity", "0.9");
		$(this).attr("opacity","1");
		$(this).attr("z-index","50");
		airbnb_tip.html("AirBnB Listing: <br>" + d3.select(this).attr('roomtype') +" for $"+d3.select(this).attr('price')+" per night")
			.style("left", ($(this).position().left + 17) + "px")		
            .style("top", ($(this).position().top - 45) + "px");
	});
	
	$('.airbnb').on("mouseout", function(){
		airbnb_tip.transition()		
            .duration(500)		
            .style("opacity", 0);	
		$(this).attr("opacity","0.5");
	});
	
	// Draw rent petitions
	var pts = [];
	for (var key in petitions_landlord) {
		var loc0 = parseFloat(petitions_landlord[key].Location0);
		var loc1 = parseFloat(petitions_landlord[key].Location1);
		var year = parseFloat(petitions_landlord[key].Year);
		
		if (!isNaN(projection([loc0,loc1])[0]) && !isNaN(projection([loc0,loc1])[1]) && parseInt(year) >= 2010) {
			pts.push([[loc0,loc1],year]);
		}
	}

	g.selectAll("circle")
		.data(pts).enter()
		.append("circle")
		.attr("z-index","0")
		.attr("class", function(d) {return "landlordyear"+d[1];})
		.attr("cx", function (d) { return projection(d[0])[0]; })
		.attr("cy", function (d) { return projection(d[0])[1]; })
		.attr("r", "2px")
		.attr("fill", "#f81b84")
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
		.attr("z-index","0")
		.attr("class", function(d) {return "renteryear"+d[1];})
		.attr("cx", function (d) { return projection(d[0])[0]; })
		.attr("cy", function (d) { return projection(d[0])[1]; })
		.attr("r", "2px")
		.attr("stroke", "black")
		.attr("fill", "yellow")
		.attr("year", function (d) { return d[1]; })
		.attr("visibility","hidden");
	
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
	
	g2.selectAll("text")
		.data(pts).enter()
		.append("text")
		.attr("class","bus")
		.attr("x", function (d) { return projection(d[0])[0]; })
		.attr("y", function (d) { return projection(d[0])[1]; })
		.attr("data-name", function (d) {return d[1]})
		.attr("style","font-family:FontAwesome")
		.attr("fill","white")
		.attr("stroke","black")
		.attr("stroke-width","0.05em")
		.attr("font-size","10px")
		.attr("dx","-.2em")
		.attr("dy", ".55em")
		.text(function(d) {return '\uf207'});

	$('.bus').on("mouseover", function() {
		bus_tip.transition()		
        	.duration(200)		
            .style("opacity", .9);
		bus_tip.html("Shuttle Stop: <br>" + d3.select(this).attr('data-name').split('&')[0]+" & "+d3.select(this).attr('data-name').split('&')[1])
			.style("left", ($(this).position().left + 17) + "px")		
            .style("top", ($(this).position().top - 45) + "px");
	});
	
	$('.bus').on("mouseout", function(){
		bus_tip.transition()		
            .duration(500)		
            .style("opacity", 0);	
	});
	
	// buttons to toggle data view
	var buttons = d3.select("body").append("div").style("margin-top", "20px");
	
	buttons.append("button").text("2010").on("click", function(){
		g.selectAll("circle").attr("visibility","hidden");
		g.selectAll(".airbnb").attr("visibility","hidden");
		
		g.selectAll(".landlordyear2010").attr("visibility","visible");	
		g.selectAll(".renteryear2010").attr("visibility","visible");	
		g.selectAll(".listing2010").attr("visibility","visible");	
	});
	
	buttons.append("button").text("2011").on("click", function(){
		g.selectAll("circle").attr("visibility","hidden");
		g.selectAll(".airbnb").attr("visibility","hidden");
		
		g.selectAll(".landlordyear2011").attr("visibility","visible");	
		g.selectAll(".renteryear2011").attr("visibility","visible");
		g.selectAll(".listing2011").attr("visibility","visible");	
	});
	
	buttons.append("button").text("2012").on("click", function(){
		g.selectAll("circle").attr("visibility","hidden");
		g.selectAll(".airbnb").attr("visibility","hidden");
		
		g.selectAll(".landlordyear2012").attr("visibility","visible");	
		g.selectAll(".renteryear2012").attr("visibility","visible");
		g.selectAll(".listing2012").attr("visibility","visible");	
	});
	
	buttons.append("button").text("2013").on("click", function(){
		g.selectAll("circle").attr("visibility","hidden");
		g.selectAll(".airbnb").attr("visibility","hidden");
		
		g.selectAll(".landlordyear2013").attr("visibility","visible");	
		g.selectAll(".renteryear2013").attr("visibility","visible");
		g.selectAll(".listing2013").attr("visibility","visible");	
	});
	
	buttons.append("button").text("2014").on("click", function(){
		g.selectAll("circle").attr("visibility","hidden");
		g.selectAll(".airbnb").attr("visibility","hidden");
		
		g.selectAll(".landlordyear2014").attr("visibility","visible");	
		g.selectAll(".renteryear2014").attr("visibility","visible");
		g.selectAll(".listing2014").attr("visibility","visible");	
	});
	
	buttons.append("button").text("2015").on("click", function(){
		g.selectAll("circle").attr("visibility","hidden");
		g.selectAll(".airbnb").attr("visibility","hidden");
		
		g.selectAll(".landlordyear2015").attr("visibility","visible");	
		g.selectAll(".renteryear2015").attr("visibility","visible");
		g.selectAll(".listing2015").attr("visibility","visible");	
	});
	
	buttons.append("button").text("2016").on("click", function(){
		g.selectAll("circle").attr("visibility","hidden");
		g.selectAll(".airbnb").attr("visibility","hidden");
		
		g.selectAll(".landlordyear2016").attr("visibility","visible");	
		g.selectAll(".renteryear2016").attr("visibility","visible");
		g.selectAll(".listing2016").attr("visibility","visible");	
	});
	
	buttons.append("button").text("2017").on("click", function(){
		g.selectAll("circle").attr("visibility","hidden");
		g.selectAll(".airbnb").attr("visibility","hidden");
		
		g.selectAll(".landlordyear2017").attr("visibility","visible");	
		g.selectAll(".renteryear2017").attr("visibility","visible");
		g.selectAll(".listing2017").attr("visibility","visible");	
	});
	
	d3.select("body").append("hr");
	
	d3.select("body").append("h3").text("Resources")
		.attr("margin-top","50px");
	
	var sources = d3.select("body").append("div")
		.attr("class","sources");
	
	var resources = sources.append("p");
	
	var divfiles = resources.append("div")
		.attr("class","resources");
	divfiles.append("h4")
		.text("Files");
	divfiles.append("div")
		.html("<ul><li>index.html</li><li>index.css</li><li>index.js</li><li>data/census.csv</li><li>data/listings-cleaned.csv</li><li>data/neighborhood.json</li><li>data/petitions-capital-improvement.csv</li><li>data/petitions-unlawful-rent-increase.csv</li><li>data/stopsoutput.csv</li></ul>");
	
	var divdata = resources.append("div")
		.attr("class","resources");
	divdata.append("h4")
		.text("Data Sources");
	divdata.append("div")
		.html("<ul><li><a href='http://insideairbnb.com/san-francisco/'>Inside AirBnB</a></li><li><a href='https://data.sfgov.org/Housing-and-Buildings/Petitions-to-the-Rent-Board/6swy-cmkq'>Petitions to the Rent Board</a></li><li><a href='https://factfinder.census.gov/faces/tableservices/jsf/pages/productview.xhtml?src=CF'>San Francisco 2010 Census Tract Populations</a></li><li><a href='https://data.sfgov.org/Geographic-Locations-and-Boundaries/Analysis-Neighborhoods-2010-census-tracts-assigned/bwbp-wk3r'>San Francisco 2010 Census Tracts</a></li><li><a href='https://www.sfmta.com/projects-planning/projects/commuter-shuttle-program-2016-2017'>SFMTA Commuter Shuttle Program</a></li><ul>");
	
	var divcode = resources.append("div")
		.attr("class","resources");
	divcode.append("h4")
		.text("Code Sources");
	divcode.append("div")
		.html("<ul><li><a href='https://codepen.io/JFarrow/details/ubcqw'>A Neighborhood Map of San Francisco</a></li><li><a href='http://bl.ocks.org/karmadude/5820393'>San Francisco Contours</a></li><li><a href='https://github.com/thfield/sf-census'>SF-Census Map</a></li></ul>");
	
//	var divref = resources.append("div")
//		.attr("class","resources");
//	divref.append("h4")
//		.text("References");
//	divref.append("div")
//		.html("<ul><li>index.html</li><li>index.css</li><li>index.js</li><li>index.js</li><li>index.js</li><li>index.js</li><li>index.js</li><li>index.js</li></ul>");
	
//	var reset = d3.select("body").append("div");
//	reset.append("button").text("Reset View").on("click", function(){
//		g.attr("transform", "translate("+[0, 0]+")scale(1)");
//  		g2.attr("transform", "translate("+[0, 0]+")scale(1)");									
//	});
	
	function zoomed() {
  		g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
  		g2.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
	}
	
	$("button").click(function(){
		$("button").each(function(){
			$(this).removeClass('clicked');
		});
		$(this).toggleClass('clicked');
	});
	
	d3.select(self.frameElement).style("height", height + "px");
}