Marlowe APM Visualization Tool
================

This is a [Sinatra app](http://www.sinatrarb.com/) used to present page event data in different charts using 
[D3](http://d3js.org/).  It's meant to be a simple platform for exploring Application Performance Management (APM)
data with experimental visualizations and animations.  I welcome contributions.

Requirements
---------------

1. Ruby 1.9.3
2. Smattering of ruby gems, including Sinatra, Rack

Running the Tool
----------------

1. git clone https://github.com/newrelic/marlowe.git
2. bundle install
3. rackup


Adding your own dataset
----------------
Just add json files to the data directory using the following format:


	[
	[1368817694170, "2013-05-17 12:08:14 -0700","Controller/applications/show", 2599.0, 1067.0],
	[1368817694231, "2013-05-17 12:08:14 -0700","Controller/public_access/charts/show", 277.0, 166.0],
	[1368817694240, "2013-05-17 12:08:14 -0700","Controller/applications/index", 1517.0, 983.0],
	[1368817694260, "2013-05-17 12:08:14 -0700","Controller/traced_errors/index", 1188.0, 725.0],
	....

For details on the format, refer to the [readme.md](data/readme.md) file in the data directory.


Special Thanks
------------------

Ward Cunningham for inspiration and the contribution of the Treemap and Traffic demos.

Etan Lightstone, Patrick Lightbody and the rest of the New Relic crew who
helped out greatly with feedback and suggestions.


