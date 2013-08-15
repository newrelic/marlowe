Marlowe Datasets
====================

This directory contains a list of json files used as raw page event
data for the d3 visualizations.  They are pre-processed by the Sinatra
app and transformed into data for specific to the visualization.

What You Need to Know
-----------------------
Datasets are encoded as json data.  There are two formats with built
in support:

* Old format: arbitrary format where each json record had exactly 5 columns
* New (v2) format: more flexibility for specifying multiple attributes

What is an Event?
-----------------------
The datasets consist of page events that correspond to a single web
request.  The request has a timestamp in milliseconds unixtime. 
In the new format this represents when it _started_.  In the old format
it's interpreted as where the event ended and is adjusted accordingly.

It has one or two duration values representing front end or back end.
For New Relic data these values are the latencies measured by RUM from
the browser (frontend) and those measured by the appserver agent
(backend).

Events do not have to be in order.

What is an Attribute?
---------------------
An event has one or more attributes.  The most obvious one is the URL or resource
path, normalized to exclude parameters.  We refer to this as the `transaction`
generally, not URL.  Other attributes include things like the browser, region,
or account.

New Dataset Format
-----------------------
The data consists of an array of arrays.  The first element of the
array is interpreted as a header, which maps the column names to the
column indices.  See [testdata_v2.json](testdata_v2.json) for an
example.

The header must include `timestamp` whose column is a timestamp in
milliseconds, identifying when the transaction _started_.

It must also include one of `backend`, `frontend` or both.

Other columns are interpreted as attributes of the transaction, such
as `browser`, `url`, `account`, etc.

Support for Other Formats
-----------------------
You can use whatever format you want--CSV, XML, weblog--you just need
to add or replace a read_data helper in the app.rb to read your
format, or pull in the live data.


The "Old" Format
-----------------------
You should use the new format for a better user experience and more
flexibility with future plugins.  The old format is available for
backward compatibility.  It is based on the data I had access to at
the time I was working on this.

Each record looks like this:
    
    [1368817684170,"","URL/Home/index.html",500, 50],

The column values are listed in order:
    1. Timestamp in milliseconds
    2. Date field, ignored
    3. Web transaction name; i.e, URL path or controller action
    4. Front end latency, as measured from the browser
    5. Back end (app server) latency as measured on the server.

You may not have values for both (4) and (5) populate 5 to start with
and leave a zero in 4.

