// Extra functions related to drawing quartile regions on the timeseries chart

function quartileInit(svg) {
    var quartilePlot = svg.select("g.quartiles");
//      .attr("clip-path", "url(#plotclip)")

    $data.dispatch.on("quartileSelect.timeseries", function() {
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
        else data = []
        quartilePlot.selectAll("rect").data(data).call(boxplot);
    });

    function boxplot(v) {
        var obj = svg.node(),
            x = obj.xScale,
            y = obj.yScale,
            numCols = Math.floor($data.density * ($data.width / $data.height)),
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
}
