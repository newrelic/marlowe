Marlowe Datasets
====================

This directory contains a list of json files used as raw page event
data for the d3 visualizations.  They are pre-processed by the Sinatra
app and transformed into data for specific to the visualization.

## What you need to know

The format is arbitrary, and the column order is important.

You can use whatever format you want--CSV, XML, weblog--you just need to add or replace a read_data
helper in the app.rb to read your format, or pull in the live data.

## Format

The format is based on the data I had access to at the time I was working on this.  

Each record looks like this:
    
    [1368817684170,"","URL/Home/index.html",500, 50],

The column values are listed in order:

1. Timestamp in milliseconds
2. Date field, ignored
3. Web transaction name; i.e, URL path or controller action
4. Front end latency, as measured from the browser
5. Back end (app server) latency as measured on the server.

You may not have values for both (4) and (5) populate 5 to start with and leave a zero in 4.

