function timeseries(div) {

    var svg = div.append("svg")
	.attr("id", "timeseries")
        .attr("width", $data.width + $data.margin.left + $data.margin.right)
        .attr("height", $data.height + $data.margin.top + $data.margin.bottom + 60);

    svg.append("defs").append("clipPath")
	.attr("id", "plotclip")
	.append("rect")
	.attr("width", $data.width)
	.attr("height", $data.height);

    svg.append("g")
        .attr("class", "grid")
        .attr("transform", "translate(" + $data.margin.left + ","+ $data.margin.top + ")");

    var xScale = d3.time.scale().rangeRound([0, $data.width]),
    yScale = d3.scale.linear().rangeRound([$data.height, 0]),
    apdexScale = d3.scale.linear().rangeRound([$data.height, 0]).domain([0, 1]),
    colorScale = d3.interpolateRgb("#ffe", "#333"),
    throughputScale = d3.scale.linear().range([$data.height, 50]),
    legendPlots = [],
    showHeatmap  = false;

    var apdex = apdexScale;
    var x = xScale;
    var y = yScale;
    
    var apdexAxis = d3.svg.axis()
        .scale(apdex)
        .orient("right");
    var chart = svg.select("g");

    function toggleHeatmap() {
        d3.select("img.timeseries.busy").style("display", "inline");
        showHeatmap = !showHeatmap;
        var rect = svg.select("#heatmap-sample")
        if (showHeatmap)
            rect.transition().duration(250).style("opacity", 1);
        else
            rect.transition().duration(250).style("opacity", 0.2);
        svg.update();
        d3.select("img.timeseries.busy").style("display", "none");
    }

    chart
	.append("g").attr("class", "heatmap")
	.attr("clip-path", "url(#plotclip)")

    var quartilesPlot = chart.append("g").attr("class", "quartiles");

    $data.dispatch.on("quartileSelect.timeseries", function() {
	svg.quartileSelectionUpdate();
    });

    // The rectangle for capturing drag events.
    chart.append("rect")
        .attr("class", "clickrect")
        .attr("opacity", 1e-6)
        .style("fill", "#EEE")
        .attr("width", $data.width)
        .attr("height", $data.height);

    chart.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + $data.height + ")");

    chart.append("g")
        .attr("class", "y axis");

    chart.append("g")
        .attr("class", "apdex axis")
        .attr("transform", "translate("+$data.width+",0)")
        .call(apdexAxis);

    chart.append("g")
	.attr("clip-path", "url(#plotclip)")
        .attr("class", "plots");

    $data.dispatch.on("plotSelect.timeseries", function(name) {
	svg.updateLines();
    });

    $data.dispatch.on("newTimesliceData.timeseries", function() {
	svg.update();
	d3.select("img.timeseries.busy").style("display", "none");
    });

    svg.legend = function(legendNames) {
	legendPlots = legendNames;
	var legendItemWidth = Math.floor($data.width / (legendPlots.length + 1)),
	legendItemHeight = 42,
	margin = 4;

	var legend = chart.append("g")
            .attr("class", "legend")
            .attr("transform", "translate(0," + ($data.height + $data.margin.top + 20) + ")");

	legend.selectAll("g.timeseries")
            .data(legendPlots, String);

	g = legend.append("g")
            .attr("class", "heatmap")
            .attr("transform", "translate(" + margin + ",0)");

	g.append("rect")
            .attr("class", "legenditem")
            .attr("x", -margin)
            .attr("y", -margin)
            .attr("width", legendItemWidth)
            .attr("height", legendItemHeight)
            .on("click", function(d) {
		toggleHeatmap(chart);
            });

	g.append("text")
            .attr("dy", "1.2em")
            .attr("class", "legend")
            .text("heatmap")
            .on("click", function(d) {
		toggleHeatmap(chart);
            });

	g.append("rect")
            .attr("id", "heatmap-sample")
            .attr("y", legendItemHeight/2)
            .attr("width", legendItemWidth - (2 * margin))
            .attr("height", legendItemHeight / 4)
            .style("opacity", showHeatmap ? 1 : 0.2)
            .attr("fill", colorScale(0.5));
	

	// Timeseries items (mean, median, exc) legend items
	g = legend.selectAll("g.timeseries")
            .data(legendPlots, String)
            .enter()
            .append("g")
            .attr("class", "timeseries")
            .attr("transform", function(d, i) {
		return "translate(" + (2 * margin + ((i+1) * legendItemWidth)) + ",0)";
            });

	g.append("rect")
            .attr("class", "legenditem")
            .attr("x", -margin)
            .attr("y", -margin)
            .attr("width", legendItemWidth - margin)
            .attr("height", legendItemHeight)
            .on("click", function(d) {
		togglePlotline(d);
            });

	g.append("text")
            .attr("dy", "1.2em")
            .text(function(d){ return d.replace("_"," ") })
            .on("click", function(d) {
		togglePlotline(d);
            });

	g.append("line")
            .style("opacity", "0")
            .attr("class", function(d) { return d+" series"; })
            .attr("transform", "translate(0, "+ ((legendItemHeight - margin) * 2 / 3)+")")
            .attr("x2", legendItemWidth - (3 * margin))
            .on("click", function(d) {
		togglePlotline(d);
            });
        return svg;
    };

    svg.timeline = function() {  
	var timeline = chart.append("g");
	timeline
	    .append("line")
	    .attr("y1", 0).attr("y2", $data.height)
	    .attr("x1", 0).attr("x2", 0)
	    .attr("id", "time-marker");

	$data.dispatch.on("tick.timeseries", function(t) {
	    var d = new Date(t);
	    var pos = x(t);
	    timeline.attr("transform", "translate("+x(t)+", 0)");
	});
        return svg;
    };

    svg.updateLines = function() {
	var apdex = apdexScale;
	x.domain(d3.extent($data.timeslices, function(d) { return d.time; }));
	svg.select("g.legend").selectAll("g.timeseries").data(legendPlots, String).select("line")
            .transition().duration(500)
            .style("opacity", function(d) {
		return $data.displayedPlots.indexOf(d) >= 0 ? "1" : "0";
            });

	// function to generate the path points for a plot
	function plotData(m) {
            d = [];
            var axis = y;
            if (m == "apdex") 
		axis = apdex;
            else if (m == "rpm")
		axis = throughputScale;      

            for (i = 0; i < $data.timeslices.length; i++) {
		d[i] = { time: x($data.timeslices[i].time), val: axis($data.timeslices[i][m]) };
            }
            return d;
	}
	function firstPlotLine() {
            m = $data.displayedPlots[0];
            var axis = y;
            if (m == "apdex") axis = apdex;
            return d3.svg.line()
		.interpolate("basis")
		.x(function(q) { return q.time; })
		.y(function(q,i) { return axis($data.timeslices[i][m]); })
	};
	function seriesPlotLine() {
            return d3.svg.line()
		.interpolate("basis")
		.x(function(q) { return q.time; })
		.y(function(q,i) { return q.val; })
	};
	var lines = svg.select("g.plots").selectAll("g").data($data.displayedPlots, String);

	lines
            .select("path")
            .datum(plotData)
            .transition()
	    .duration(500)
            .attr("d", seriesPlotLine());

	lines.enter()
            .append("g")
            .append("path")       
            .attr("class", function(d) {return "series "+d;})
            .datum(plotData)
            .attr("d", firstPlotLine())
            .style("opacity", 1e-6)
            .transition().duration(500)
            .style("opacity", 1)
            .attr("d", seriesPlotLine());
	
	var exit = lines.exit();
	var v = exit.select("path")
            .datum(plotData)
            .transition().duration(200)
            .style("opacity", 1e-6)
	exit.transition().delay(500).remove();
	svg.quartileSelectionUpdate();
    };

    svg.quartileSelectionUpdate = function() {
	function boxplot(v) {
	    var numCols = Math.floor($data.density * ($data.width / $data.height)),
   	    colWidth = $data.width / (numCols - 1 );

	    v.enter()
		.append("rect")

	    v
		.attr("transform", function(d, i) {
		    return "translate(" + (( i - 0.5) * colWidth) + ","+y(d.y0)+")";
		})
		.attr("class", $data.selectedQuartile)
		.attr("width", colWidth - 1)
		.attr("height", function(d) { return y(d.y1) - y(d.y0) })

	    v.exit()
		.remove();
	}
	if ($data.selectedQuartile == "arithmetic")
	    data = $data.timeslices.map(function(timeslice) {
		return { "y0": timeslice.mean + (z75 * timeslice.stddev),
			 "y1": timeslice.mean - (z75 * timeslice.stddev),
			 "mid": timeslice.mean,
			 "style": "arithmetic"}
            });
	else if ($data.selectedQuartile == "geometric") 
	    data = $data.timeslices.map(function(timeslice) {
		return { "y0": timeslice.g_mean * Math.pow(timeslice.g_stddev, z75),
			 "y1": timeslice.g_mean / Math.pow(timeslice.g_stddev, z75),
			 "mid": timeslice.g_mean,
			 "style": "geometric"}
	    });
	else if ($data.selectedQuartile == "actual") 
	    data = $data.timeslices.map(function(timeslice) {
		return { "y0": timeslice.pct_75,
			 "y1": timeslice.pct_25,
			 "mid": timeslice.median,
			 "style": "actual"}
	    });
	else data = []
	quartilesPlot.selectAll("rect").data(data).call(boxplot);
	return svg;
    };

    svg.update = function() {
	y.domain([0, $data.yMax]);
	x.domain(d3.extent($data.timeslices, function(d) { return d.time; }));
	throughputScale.domain([0, d3.max($data.timeslices.map(function(d){return d.rpm}))]);

	var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

	svg.select("g.x.axis").call(xAxis);

	var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

	svg.select("g.y.axis").call(yAxis);

	var numRows = Math.floor($data.density),
	numCols = Math.floor($data.density * ($data.width / $data.height)),
	yExtent, 
	xExtent,
	colWidth = $data.width / numCols,
	rowHeight = $data.height / numRows;
	var heatmap = svg.select("g.heatmap");

	var cellWidth = $data.width / (numCols - 1);
	var cellHeight = $data.height / numRows;

	var drag = d3.behavior.drag()
            .on("drag", dragmove);

	function dragmove() {
            var xPos = d3.event.x;
            var col = Math.min(Math.floor(xPos / cellWidth), $data.timeslices.length-1);
            if (col != $data.selectedTimeslice) {
		$data.selectedTimeslice = col;
		$data.dispatch.timerangeSelect(col);
            }
	}
	svg.select("rect.clickrect").call(drag);

	if (showHeatmap)
            data = $data.timeslices;
	else
            data = [];

	var bar = heatmap.selectAll("g").data(data);
	var cellInterval = (x.domain()[1] - x.domain()[0]) / (numCols - 1);

	bar.enter()
            .append("g")
	bar
            .attr("transform", function(d, i) {
		return "translate("+(x(d.time - cellInterval/2))+", 0)";
            });

	bar.exit()
            .transition().duration(250)
            .remove();

	var rect = bar.selectAll("rect")
            .data(function(d, i){ 
		return d.hist; 
            });

	rect.enter()
            .append("rect")
            .attr("class", "cell")
            .attr("x", 0)
	rect
            .attr("width", Math.round(cellWidth))
            .attr("height", Math.round(cellHeight))
            .attr("y", function(d, i) { 
		return Math.round((numRows - i - 1) * rowHeight); 
            })
            .attr("fill", function(d) { 
		return colorScale(d.score);
	    })
            .style("opacity", 1)

	rect.exit()
            .style("opacity", 0)
            .remove();

	svg.updateLines();
	return svg;
    };
    return svg;
};
