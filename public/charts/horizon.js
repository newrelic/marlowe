function horizonInit(div) {

    var height = 40;
    var chart = d3.horizon()
            .width($data.width)
            .height(height)
            .bands(1)
            .mode("mirror")
            .interpolate("basis");

    function horizonUpdate() {

        var names = d3.keys($data.summaryTimeslice.breakdown).slice(0,10);
        var localMax = d3.select("input#unnormalized").node().checked;
        if (localMax) 
            chart.yMax(null);
        else
            chart.yMax($data.yMax);
        var parents = div.selectAll("div.sparkline")
            .data(names);

        var row = parents.enter()
            .append("div")
            .attr("class", "sparkline row");

        row
            .append("div").attr("class", "span3 name");
        row
            .append("div").attr("class", "span9")
            .append("svg")
            .attr("width", $data.width)

        parents
            .select("div.span3")
            .text(String);
           
        parents
            .selectAll("svg")
            .data(function(name) { 
                return [$data.timeslices.map(function(timeslice) {
                    return [new Date(timeslice.time), 
                            timeslice.breakdown[name] ? timeslice.breakdown[name][1]/timeslice.breakdown[name][0] : 0];
                })]})
            .attr("height", height)
            .call(chart.duration(1000));

        parents.exit().remove();
        d3.select("img.busy").style("display", "none");
    }
    d3.selectAll("#horizon-bands button").data([-1, 1]).on("click", function(d) {
        var n = Math.max(1, chart.bands() + d);
        d3.select("#horizon-bands-value").text(n);
        div.selectAll("svg")
            .call(chart.duration(1000).bands(n).height(height))
            .transition()
            .duration(1000)
            .attr("height", height)
    });
    var checkbox = d3.select("input#unnormalized");
    $data.dispatch.on("newTimesliceData.horizon", horizonUpdate);  
}

(function() {

    d3.horizon = function() {
        var bands = 3, // between 1 and 5, typically
        mode = "offset", // or mirror
        interpolate = "linear", // or basis, monotone, step-before, etc.
        x = d3_horizonX,
        y = d3_horizonY,
        w = 960,
        h = 40,
        yMax,
        duration = 0;

        var color = d3.scale.linear()
            .domain([-1, 0, 0, 1])
            .range(["#08519c", "#bdd7e7", "#bae4b3", "#006d2c"]);

        // For each small multiple…
        function horizon(g) {
            g.each(function(d, i) {
                var g = d3.select(this),
                n = 2 * bands + 1,
                xMin = Infinity,
                xMax = -Infinity,
                ymm = -Infinity,
                x0, // old x-scale
                y0, // old y-scale
                id; // unique id for paths

                // Compute x- and y-values along with extents.
                var data = d.map(function(d, i) {
                    var xv = x.call(this, d, i),
                    yv = y.call(this, d, i);
                    if (xv < xMin) xMin = xv;
                    if (xv > xMax) xMax = xv;
                    if (-yv > ymm) ymm = -yv;
                    if (yv > ymm) ymm = yv;
                    return [xv, yv];
                });

                // Compute the new x- and y-scales, and transform.
                var x1 = d3.scale.linear().domain([xMin, xMax]).range([0, w]),
                y1 = d3.scale.linear().domain([0, yMax || ymm]).range([0, h * bands]),
                t1 = d3_horizonTransform(bands, h, mode);

                // Retrieve the old scales, if this is an update.
                if (this.__chart__) {
                    x0 = this.__chart__.x;
                    y0 = this.__chart__.y;
                    t0 = this.__chart__.t;
                    id = this.__chart__.id;
                } else {
                    x0 = x1.copy();
                    y0 = y1.copy();
                    t0 = t1;
                    id = ++d3_horizonId;
                }

                // We'll use a defs to store the area path and the clip path.
                var defs = g.selectAll("defs")
                    .data([null]);

                // The clip path is a simple rect.
                defs.enter().append("defs").append("clipPath")
                    .attr("id", "d3_horizon_clip" + id)
                    .append("rect")
                    .attr("width", w)
                    .attr("height", h);

                defs.select("rect").transition()
                    .duration(duration)
                    .attr("width", w)
                    .attr("height", h);

                // We'll use a container to clip all horizon layers at once.
                g.selectAll("g")
                    .data([null])
                    .enter().append("g")
                    .attr("clip-path", "url(#d3_horizon_clip" + id + ")");

                // Instantiate each copy of the path with different transforms.
                var path = g.select("g").selectAll("path")
                    .data(d3.range(-1, -bands - 1, -1).concat(d3.range(1, bands + 1)), Number);

                var d0 = d3_horizonArea
                    .interpolate(interpolate)
                    .x(function(d) { return x0(d[0]); })
                    .y0(h * bands)
                    .y1(function(d) { return h * bands - y0(d[1]); })
                (data);

                var d1 = d3_horizonArea
                    .x(function(d) { return x1(d[0]); })
                    .y1(function(d) { return h * bands - y1(d[1]); })
                (data);

                path.enter().append("path")
                    .style("fill", color)
                    .attr("transform", t0)
                    .attr("d", d0);

                path.transition()
                    .duration(duration)
                    .style("fill", color)
                    .attr("transform", t1)
                    .attr("d", d1);

                path.exit().transition()
                    .duration(duration)
                    .attr("transform", t1)
                    .attr("d", d1)
                    .remove();

                // Stash the new scales.
                this.__chart__ = {x: x1, y: y1, t: t1, id: id};
            });
            d3.timer.flush();
        }

        horizon.duration = function(x) {
            if (!arguments.length) return duration;
            duration = +x;
            return horizon;
        };

        horizon.bands = function(x) {
            if (!arguments.length) return bands;
            bands = +x;
            color.domain([-bands, 0, 0, bands]);
            return horizon;
        };

        horizon.mode = function(x) {
            if (!arguments.length) return mode;
            mode = x + "";
            return horizon;
        };

        horizon.colors = function(x) {
            if (!arguments.length) return color.range();
            color.range(x);
            return horizon;
        };

        horizon.interpolate = function(x) {
            if (!arguments.length) return interpolate;
            interpolate = x + "";
            return horizon;
        };

        horizon.x = function(z) {
            if (!arguments.length) return x;
            x = z;
            return horizon;
        };

        horizon.yMax = function(ym) {
            if (!arguments.length) return yMax;
            yMax = ym;
            return horizon;
        };
        horizon.y = function(z) {
            if (!arguments.length) return y;
            y = z;
            return horizon;
        };

        horizon.width = function(x) {
            if (!arguments.length) return w;
            w = +x;
            return horizon;
        };

        horizon.height = function(x) {
            if (!arguments.length) return h;
            h = +x;
            return horizon;
        };
        return horizon;
        
    };


    var d3_horizonArea = d3.svg.area(),
    d3_horizonId = 0;

    function d3_horizonX(d) {
        return d[0];
    }

    function d3_horizonY(d) {
        return d[1];
    }

    function d3_horizonTransform(bands, h, mode) {
        return mode == "offset"
            ? function(d) { return "translate(0," + (d + (d < 0) - bands) * h + ")"; }
        : function(d) { return (d < 0 ? "scale(1,-1)" : "") + "translate(0," + (d - bands) * h + ")"; };
    }
})();