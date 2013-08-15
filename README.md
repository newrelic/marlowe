Marlowe APM Visualization Tool
================

This is a [Sinatra app](http://www.sinatrarb.com/) used to present
page event data in different charts using [D3](http://d3js.org/).
It's meant to be a simple platform for exploring Application
Performance Management (APM) data with experimental visualizations and
animations.  I welcome contributions.

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
     [ "timestamp", "transaction", "frontend", "backend"],
     [1368817694170, "Controller/applications/show", 2599.0, 1067.0],
     [1368817694231, "Controller/public_access/charts/show", 277.0, 166.0],
     [1368817694240, "Controller/applications/index", 1517.0, 983.0],
     [1368817694260, "Controller/traced_errors/index", 1188.0, 725.0],
     ....

The columns can be in any order, but must include `timestamp`, `transaction` and one of
`frontend` or `backennd`.  They can include additional per-event attributes which may be 
utilized in some experiments as alternatives to `transaction`.

For details on the format, refer to the [readme.md](data/readme.md) file in the data directory.


Changes
------------------

### Aug 15, 2013

Implemented selectors allowing you to pick different attributes in a
single dataset.

### Aug 9, 2013 

Implemented alternative format for datasets paving the way for doing
more with datasets that had more than one attribute.

### July 8, 2013 

Added quartile region shading in historgrams and timeseries charts

### July 3, 2013 

Incorporated [Ward Cuningham](http://c2.org)'s Traffic demo

### June 29, 2013

Added a horizon chart

### June 2013

Introduced Marlowe in preparation for talk at Velocity Santa Clara 2013


Special Thanks
------------------

Ward Cunningham for inspiration with "the summer of d3" and the
contribution of the Treemap and Traffic demos.

Etan Lightstone, Patrick Lightbody and the rest of the New Relic crew
who helped out greatly with feedback and suggestions.

