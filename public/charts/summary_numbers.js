/*
  Example: 

  summary(div)
  .row()
    .column("Throughput", "rpm", "rpm")
    .column("50 % (Median)", "median", "ms")
    .column("85 %", "pct_85", "ms")
    .column("95 %", "pct_95", "ms")
    .column("99 %", "pct_99", "ms")
  .row()
    .column("Arithmetic Mean", "mean", "ms")
    .column("Arithmetic Std Dev", "stddev", "ms")
    .column("Arithmetic p 85 %", "a_p85", "ms")
    .column("Arithmetic p 95 %", "a_p95", "ms")
    .column("Arithmetic p 99 %", "a_p99", "ms")
    .column("Geometric Mean", "g_mean", "ms")
  .row()
    .column("Geometric Std Dev.", "g_stddev", "")
    .column("Geometric p 85 %", "g_p85", "ms")
    .column("Geometric p 95 %", "g_p95", "ms")
    .column("Geometric p 99 %", "g_p99", "ms")
  .row()
    .column("Apdex","apdex", "")
    .column("Apdex Failing", "apdex_f", "req")
    .column("Apdex Satisfied", "apdex_s", "req")
    .column("Apdex Tolerating", "apdex_t", "req")
    .column("Mode", "mode", "ms")
   .init()
*/

function summary(div) {
    var summaryItems = []
    div.row = function() {
	var row = [];
	summaryItems.push(row);
	row.column = function(label, style, units) {
            this.push([label, style, units ? units : ""]);
	    return this;
	}
	return row;
    }
    div.init = function() {
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

	// Manage a row of summary numbers
	function update(bucket) {
	    div
		.selectAll("div.summary-row")
		.data(summaryItems)
		.selectAll("div.summary-item")
		.data(function(d){ return d}, String)
		.select(".value")
		.text(function(m) { return bucket[m[1]] });
	}

	$data.dispatch.on("timerangeSelect.summary", function(col) {
	    update($data.timeslices[col]);
	})
	$data.dispatch.on("newTimesliceData.summaryTimeslice", function(col) {
	    update($data.summaryTimeslice);
	})
    }
    return div;
}
