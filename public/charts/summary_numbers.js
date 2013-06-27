var summaryItems = [
    [
	["Throughput", "rpm", "rpm"],
	["50 % (Median)", "median", "ms"],
	["85 %", "pct_85", "ms"],
	["95 %", "pct_95", "ms"],
	["99 %", "pct_99", "ms"]],
    [
	["Arithmetic Mean", "mean", "ms"],
	["Arithmetic Std Dev", "std_dev", "ms"],
	["Arithmetic p 85 %", "a_p85", "ms"],
	["Arithmetic p 95 %", "a_p95", "ms"],
	["Arithmetic p 99 %", "a_p99", "ms"]],
    [
	["Geometric Mean", "g_mean", "ms"],
	["Geometric Std Dev.", "g_stddev", ""],
	["Geometric p 85 %", "g_p85", "ms"],
	["Geometric p 95 %", "g_p95", "ms"],
	["Geometric p 99 %", "g_p99", "ms"]],
    [
	["Apdex","apdex", ""],
	["Apdex Failing", "apdex_f", "req"],
	["Apdex Satisfied", "apdex_s", "req"],
	["Apdex Tolerating", "apdex_t", "req"],
	["Mode", "mode", "ms"]],
];


// Manage a row of summary numbers
function summaryUpdate(div, bucket) {
    div
	.selectAll("div.summary-row")
	.data(summaryItems)
	.selectAll("div.summary-item")
	.data(function(d){ return d}, String)
        .select(".value")
	.text(function(m) { return bucket[m[1]] });
}

function summaryInit(div) {
    var rows = div
	.selectAll("div.summary-row")
	.data(summaryItems)
	.enter()
	.append("div")
	.attr("class", "summary-row");

    var items = rows
	.selectAll("div.summary-item")
	.data(function(d){ return d}, String)
	.enter()
	.append("div")
	.attr("class", "summary-item")
        .on("click", function(v){ togglePlotline(v[1]);})

    items
	.append("div")
	.attr("class", function(v) { return "bg "+v[1] });

    items
	.append("div")
	.attr("class", "label")
	.text(function(v){ return v[0]; });

    items
        .append("svg")
        .attr("height", 10)
	.append("svg:line")
	.attr("class", function(v){ return v[1]+ " series" })
        .style("opacity", function(v) {
	      return $data.displayedPlots.indexOf(v[1]) >= 0 ? "1" : "0" })
	.attr("x2", 300)
        .attr("y1", 6)
        .attr("y2", 6);

    var value = items.append("div");
    value.append("span").attr("class", "value");
    value.append("span").attr("class", "units").text(function(m) { return " "+m[2]; });

    $data.dispatch.on("plotSelect", function(plot) {
	div.select("line."+plot)
          .style("opacity", function() {
	      return $data.displayedPlots.indexOf(plot) >= 0 ? "1" : "0";
	  })
    })

    $data.dispatch.on("timerangeSelect.summary", function(col) {
	summaryUpdate(div, $data.timeslices[col]);
    })
    $data.dispatch.on("newTimesliceData.summaryTimeslice", function(col) {
	summaryUpdate(div, $data.summaryTimeslice);
    })
    
}
