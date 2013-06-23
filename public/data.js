/*
 * This is a data structure used to hold a data set that has been aggregated according
 * to a particular bucket size given by a "density" parameter.
 */

$data = {};
$data.file = "";
// General layout parameters to ensure the charts have roughly the same
// dimensions
$data.width = 600;
$data.height = 300;
$data.margin = {top: 8, right: 50, bottom: 30, left: 50}
$data.yMax = 5000;
$data.density = 50;
$data.apdex_t = 500;
// The json files have two different values that can be plotted, front end
// and back end.  The index refers to the location of the value in each record.
// 3 for end user, 4 for app server.
$data.value_index = 3;

// newXXXdata events are dispatched when new datasets are loaded
// timerangeSelect is used to dispatch a new time range selection within the dataset.  Right now
//   it's just a single timeslice index value but should be expanded to select a range of timeslices
// bucketSelect is dispatched when a subrange of values (ie, 1000-1100 ms) is selected in this histogram.
// plotSelect is dispatched when a new plot (mean, median apdex) is selected.
$data.dispatch = d3.dispatch("newTreemapData", "newTimesliceData", "timerangeSelect", "bucketSelect", "plotSelect");

// The filter is a subset of values based on the label.  The filter can be "only" or "except"
$data.filter = ""
$data.only = "1"

// This defines the attributes of the timeslice record that are available for selection.  It could
// also include min and max.  The displayedPlots are the currently viewed plots and changes dynamically.
$data.allPlots = ["mean", "g_mean", "mode", "median", "pct_68", "pct_95", "pct_99", "apdex", "rpm"];
$data.displayedPlots = ["mean"];

// The timeslice array contains objects with fields that correspond to the plot values for each timeslice
// like mean, median, apdex, etc.  There is also a hist field with an array of values for the distribution
// of values in that timeslice.  This array drives the histogram as well as the heatmap.
$data.timeslices = []

// The summary timeslice is a timeslice record with values and a histogram for the complete
// timerange of the dataset.      
$data.summaryTimeslice = {}

$data.treemapRoot = {}
$data.counts = []

// The maximum count across all the buckets in each timeslice's histogram, used to normalize
// the per-timeslice histogram display.
$data.bucketMax = 0

// -1 means summary data is the initial selection, otherwise this is the
// index of data.timeslices
$data.selectedTimeslice = -1

// -1 means entire timerange of data in scope, otherwise it's the bucket index into $data.timeslices[n].hist
$data.selectedBucket = -1

function togglePlotline(name) {
    var pos = $data.displayedPlots.indexOf(name);
    if (pos == -1)
        $data.displayedPlots.push(name)
    else
        $data.displayedPlots.splice(pos, 1);
    $data.dispatch.plotSelect(name);
}

/*
 * This supports a text area identified as #range that displays a
 * description of the current selected scope, as well as a reset
 * button #reset that appears and will reset the selection.
 */
function showSelection() {
    var xScale = d3.time.scale()
        .rangeRound([0, $data.timeslices.length])
        .domain([$data.timeslices[0].time, $data.timeslices[$data.timeslices.length-1].time])
    var yScale = d3.scale.linear()
        .rangeRound([0, $data.yMax])
        .domain([0, $data.summaryTimeslice.hist.length]);

    var format = d3.time.format("%H:%M:%S")
    var info = [];
    if ($data.selectedBucket != -1) {
        info.push(yScale($data.selectedBucket)+ " ms to "+ yScale($data.selectedBucket+1)+" ms");
    }
    if ($data.selectedTimeslice != -1) {
        info.push(format(xScale.invert($data.selectedTimeslice))+ " to "+ format(xScale.invert($data.selectedTimeslice+1)));
    }
    var desc = d3.select("#range");
    var resetLink = d3.select("#reset");
    if (info.length == 0) {
        desc.text("All Data");
        resetLink.style("display", "none");
    } else {
        desc.text("Range: "+info.join(", "));
        resetLink.style("display","inline");
    }
}
function resetSelection() {
    $data.selectedBucket = -1;
    $data.selectedTimeslice = -1;
    showSelection();
    $data.dispatch.newTimesliceData();
    $data.dispatch.newTreemapData();
}
$data.dispatch.on("timerangeSelect.index", showSelection);
$data.dispatch.on("bucketSelect.index", showSelection);
