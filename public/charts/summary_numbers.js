var summaryItems = [["Mean", "mean", "ms"],
		    ["Standard Dev.", "std_dev", "ms"],
		    ["Geometric Mean", "g_mean", "ms"],
		    ["Geometric Std Dev.", "g_stddev", "ms"],
		    ["Mode", "mode", "ms"],
		    ["Throughput", "rpm", "rpm"],
		    ["Apdex","apdex", ""],
		    // ["Apdex Failing", "apdex_f", "req"],
		    // ["Apdex Satisfied", "apdex_s", "req"],
		    // ["Apdex Tolerating", "apdex_t", "req"],
		    ["Median", "median", "ms"]
		   ];

// Manage a row of summary numbers
function summaryUpdate(div, bucket) {
  var items = div.selectAll(".value").data(summaryItems);
  items
    .text(function(m) { return bucket[m[1]] })

}

function summaryInit(div) {
  var items = div
	.selectAll("div.summary_item").data(summaryItems)
	.enter()
	.append("div")
	.attr("class", "summary_item") //function(v) { return "summary_item "+v[1]});
  items
    .append("div")
    .attr("class", function(v) { return "bg "+v[1] });

  var value = items.append("div");//.attr("class", "value");
  value.append("span").attr("class", "value");
  value.append("span").attr("class", "units").text(function(m) { return " "+m[2]; });

  items
    .append("div")
    .attr("class", "label")
    .text(function(v){ return v[0]; });


  $data.dispatch.on("timerangeSelect.summary", function(col) {
      summaryUpdate(div, $data.timeslices[col]);
  })
  $data.dispatch.on("newTimesliceData.summaryTimeslice", function(col) {
      summaryUpdate(div, $data.summaryTimeslice);
  })
   
}
