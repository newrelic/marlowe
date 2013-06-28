function timeseriesInit(div) {

    var svg = div.append("svg")
	.attr("id", "timeseries")
        .attr("width", $data.width + $data.margin.left + $data.margin.right)
        .attr("height", $data.height + $data.margin.top + $data.margin.bottom + 60);
    svg.append("g")
        .attr("transform", "translate(" + $data.margin.left + ","+ $data.margin.top + ")");

    var obj = svg.node();
    obj.xScale = d3.time.scale()
        .rangeRound([0, $data.width]);
    obj.yScale = d3.scale.linear()
        .rangeRound([$data.height, 0]);
    obj.apdexScale = d3.scale.linear()
        .rangeRound([$data.height, 0])
        .domain([0, 1]);
    obj.colorScale = d3.interpolateRgb("#ffe", "#333");
    obj.throughputScale = d3.scale.linear()
	.range([$data.height, 50]);
        
    obj.showHeatmap  = false;

    var apdex = obj.apdexScale;
    var x = obj.xScale;
    var y = obj.yScale;
    
    var apdexAxis = d3.svg.axis()
        .scale(apdex)
        .orient("right");
    var chart = svg.select("g");

    function toggleHeatmap() {
        d3.select("img.timeseries.busy").style("display", "inline");
        obj.showHeatmap = !obj.showHeatmap;
        var rect = svg.select("#heatmap-sample")
        if (obj.showHeatmap)
            rect.transition().duration(250).style("opacity", 1);
        else
            rect.transition().duration(250).style("opacity", 0.2);
        timeseriesUpdate(div);
        d3.select("img.timeseries.busy").style("display", "none");
    }

    chart.append("g")
        .attr("class", "heatmap")
        .append("rect")
        .attr("class", "clickrect")
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
        .attr("class", "plots");

    var legendItemWidth = Math.floor($data.width / ($data.allPlots.length + 1)),
    legendItemHeight = 42,
    margin = 4;

    var legend = chart.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(0," + ($data.height + $data.margin.top + 20) + ")");

    legend.selectAll("g.timeseries")
        .data($data.allPlots, String);

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
        .style("opacity", obj.showHeatmap ? 1 : 0.2)
        .attr("fill", obj.colorScale(0.5));
    

    // Timeseries items (mean, median, exc) legend items
    g = legend.selectAll("g.timeseries")
        .data($data.allPlots, String)
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

    $data.dispatch.on("plotSelect.timeseries", function(name) {
	timeseriesUpdateLines(div);
    });

    $data.dispatch.on("newTimesliceData.timeseries", function() {
	timeseriesUpdate(div);
	d3.select("img.timeseries.busy").style("display", "none");
    });

};

function timeseriesUpdateLines(div) {
    svg = div.select("svg");
    var obj = svg.node();
    var x = obj.xScale;
    var y = obj.yScale;
    var apdex = obj.apdexScale;
    x.domain(d3.extent($data.timeslices, function(d) { return d.time; }));
    svg.select("g.legend").selectAll("g.timeseries").data($data.allPlots, String).select("line")
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
	    axis = obj.throughputScale;      

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
            .x(function(q) { return q.time; })
            .y(function(q,i) { return axis($data.timeslices[i][m]); })
    };
    function seriesPlotLine() {
        return d3.svg.line()
            .x(function(q) { return q.time; })
            .y(function(q,i) { return q.val; })
    };
    var lines = svg.select("g.plots").selectAll("g").data($data.displayedPlots, String);

    lines
        .select("path")
        .datum(plotData)
        .transition().duration(500)
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
    
};

function timeseriesUpdate(div) {
    svg = div.select("svg");
    var obj = svg.node();
    var y = obj.yScale;
    var x = obj.xScale;
    var color = obj.colorScale;
    y.domain([0, $data.yMax]);
    x.domain(d3.extent($data.timeslices, function(d) { return d.time; }));
    obj.throughputScale.domain([0, d3.max($data.timeslices.map(function(d){return d.rpm}))]);

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
    heatmap.call(drag);

    if (obj.showHeatmap)
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
        .style("opacity", 1e-06)
    rect
        .attr("width", Math.round(cellWidth))
        .attr("height", Math.round(cellHeight))
        .attr("y", function(d, i) { 
            return Math.round((numRows - i - 1) * rowHeight); 
        })
        .attr("fill", function(d) { 
	    return color(d.score);
	})
        .transition().duration(250)
        .style("opacity", 1)

    rect.exit()
        .transition().duration(250)
        .style("opacity", 0)
        .remove();

    timeseriesUpdateLines(div);
};

