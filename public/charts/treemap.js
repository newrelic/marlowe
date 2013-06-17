// adapted from http://bl.ocks.org/mbostock/4063582

function treemapInit(parent) { 
    var div = parent.append("div")
        .style("position", "relative")
        .style("width", (2 * ($data.width + $data.margin.left + $data.margin.right)) + "px")
        .style("height", ($data.height + $data.margin.top + $data.margin.bottom) + "px")
        .style("left", $data.margin.left + "px")
        .style("top", $data.margin.top + "px");

    parent.selectAll("input").on("change", function change() {
        selectedRow = selectedCol = null;
        redisplay(div, valueMethod());
    });
    $data.dispatch.on('timerangeSelect.treemap', function (col) { treemapUpdate(parent.select("div")) });
    $data.dispatch.on("newTreemapData.treemap", function() { treemapUpdate(parent.select("div")) });
    $data.dispatch.on('bucketSelect.treemap', function (i) { treemapUpdate(parent.select("div")) });
}

function valueMethod() {
    var row = $data.selectedBucket;
    var col = $data.selectedTimeslice; 
    if (row >= 0 && col >= 0) {
	return function(d) { return d.map[[col,row]] };
    } else if (col >= 0) {
	return function(d) { return d.row[col] };
    } else if (row >= 0) {
	return function(d) { return d.bars[row] };
    } else {
	return function(d) { return d.count }
    }
}

function treemapUpdate(div) {
    var treemap = d3.layout.treemap()
	.size([2 * $data.width, $data.height])
	.sticky(true)
	.value(function(d) { return d['time']+10000; });
    var color = d3.scale.category20c();
    var value = valueMethod();

    var node = div.datum($data.treemapRoot).selectAll(".node")
        .data(treemap.nodes);

    node.data(treemap.value(value).nodes)
        .html(title)
        .transition()
        .duration(250)
        .call(treemapPosition);

    node.enter().append("div")
        .attr("class", "node")
        .data(treemap.value(value).nodes)
        .html(title)
        .call(treemapPosition)

    node.style("background", function(d) { return d.children ? color(d.name) : null; })

    node.exit().remove();

    d3.select("img.treemap.busy").style("display", "none");
}

function treemapPosition() {
    this.style("left", function(d) { return d.x + "px"; })
        .style("top", function(d) { return d.y + "px"; })
        .style("width", function(d) { return Math.max(0, d.dx - 1) + "px"; })
        .style("height", function(d) { return Math.max(0, d.dy - 1) + "px"; });
}

function title(d) {
    if (d.children) {
        return null;
    } else {
        var key = d.title.replace(/\//g,'/<br>');
        var value = d.value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return key + "<br>= " + value;
    }
}
