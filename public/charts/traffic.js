function initTraffic(div) {
    div.node().stream = null;
    var margin = $data.margin;
    width = 900 - margin.left - margin.right,
    height = 250 - margin.top - margin.bottom;

    var padding = 6,
    radius = d3.scale.sqrt().domain([0,5000]).range([5, 15]),
    color = d3.scale.category10();

    function readout(text) {
	d3.select("#readout").text(text);
    }

    var nodes = [];
    var force = d3.layout.force()
	.nodes(nodes)
	.size([width, height])
	.gravity(0)
	.friction(.6)
	.charge(0)
	.on("tick", tick)
	.start();

    var svg = div.append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var circle = svg.selectAll("circle")
	.data(nodes, function(d) { return d.id;})
	.enter().append("circle")
	.attr("r", function(d) { return d.radius; })
	.style("fill", function(d) { return d.color; })
	.call(force.drag);

    // Update dom as transactions come and go
    var id = 0;
    function tick(e) {
	var now = new Date().getTime();
	for (var i = nodes.length - 1; i >= 0; i--) {
            if (finished(nodes[i],now)) {
		nodes.splice(i,1)
            }
	};
	playnext(function(arrival){
            readout(new Date(arrival.time).toTimeString().split(" ")[0]+" "+arrival.request);
            arrival.id = id++;
            arrival.radius = radius(transaction.server);
            arrival.color = color(transaction.request);
            arrival.cx = arrival.x = 10;
            arrival.cy = arrival.y = height / 2 + Math.random()*30;
            arrival.start = now;
            nodes.push(arrival);
	});

	var circle = svg.selectAll("circle")
            .data(nodes, function(d) { return d.id;});

	circle
            .enter().append("circle")
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; })
            .attr("r", function(d) { return d.radius; })
            .style("fill", function(d) { return d.color; });

	circle
            .exit().remove();

	circle
            .each(gravity(.2 * e.alpha))
		.each(collide(.5))
		    .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
	force.start();
    }

    // Move nodes toward cluster focus.
    function gravity(alpha) {
	return function(d) {
            d.y += (d.cy - d.y) * alpha;
            var now = new Date().getTime();
            var pos = width * (now - d.start)/d.client;
            d.x += (pos - d.x) * alpha;
	};
    }

    // Resolve collisions between nodes.
    function collide(alpha) {
	var quadtree = d3.geom.quadtree(nodes);
	return function(d) {
            var r = d.radius + radius.domain()[1] + padding,
            nx1 = d.x - r,
            nx2 = d.x + r,
            ny1 = d.y - r,
            ny2 = d.y + r;
            quadtree.visit(function(quad, x1, y1, x2, y2) {
		if (quad.point && (quad.point !== d)) {
		    var x = d.x - quad.point.x,
                    y = d.y - quad.point.y,
                    l = Math.sqrt(x * x + y * y),
                    r = d.radius + quad.point.radius + (d.color !== quad.point.color) * padding;
		    if (l < r) {
			l = (l - r) / l * alpha;
			d.x -= x *= l;
			d.y -= y *= l;
			quad.point.x += x;
			quad.point.y += y;
		    }
		}
		return x1 > nx2
		    || x2 < nx1
		    || y1 > ny2
		    || y2 < ny1;
            });
	};
    }

    // Stream over transaction dataset delivering entry events by callback

    function finished (transaction, now) {
	return transaction.start + (transaction.client||3000) + div.node().stream.sleep < now 
    }

    function playnext (callback) {
        var stream = div.node().stream;
	if (stream == null) {
            return;
	}
	var now = new Date().getTime();
	var delay = now - stream.wall;
        if (t = stream.data[stream.index]) {
           $data.dispatch.tick(t[0]);
        }
	stream.wall = now;
	if (delay > 1000) {
            // must have been sleeping without timer events
            stream.sleep += delay;
	}
	var want = now - stream.start + stream.first - stream.sleep;
	while ((at = stream.data[stream.index]) && at[0] < want) {
            transaction = {time:at[0], request:at[2], client:at[3], server:at[4]}
            callback(transaction);
            stream.index += 1;
	}
	if (nodes.length == 0 && want > stream.last) {
            stream.wall = stream.start = now;
            stream.sleep = stream.index = 0;
	}
    }

    $data.dispatch.on("timerangeSelect.traffic", function(col) {
       var stream = div.node().stream;
       if (stream == null) return;
       nodes = [];
       var t = $data.timeslices[col].time.getTime();
       var now = new Date().getTime();
       stream.wall = now;
       stream.start = now - (t - stream.first);
       stream.sleep = 0;
       stream.index = 0;
       var bisect = d3.bisector(function(d) { return d[0] + d[3]; }).right;
       stream.index = bisect(stream.data, t);
    });
}

function adjust (json) {
    for (var i = json.length - 1; i >= 0; i--) {
        json[i][0] -= json[i][3];   // move time back to start of transaction
    }
    json.sort(function(a,b){ return a[0]-b[0]; });
    while(json[0][3]>1000) {
        json.shift();               // remove stragglers from long ago
    }
}

function updateTraffic(error, json, div) {
    if(error) {
        readout(error);
    } else {
        var now = new Date().getTime();
        adjust(json);
        div.node().stream = {start: now, wall: now, sleep: 0, first: json[0][0], last: json[json.length-1][0], index: 0, data: json,};
    }
}
